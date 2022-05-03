import { Construct } from "constructs";
import { App, S3Backend, TerraformStack } from "cdktf";
import {
  AppsyncDatasource,
  AppsyncGraphqlApi,
  AppsyncResolver,
} from "@cdktf/provider-aws/lib/appsync";
import { AwsProvider } from "@cdktf/provider-aws";
import { id } from "./lib/id";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb";
import { IamPolicy, IamRole, IamRolePolicy, IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam";
import { tags } from "./lib/tags";
import { LambdaFunction, LambdaPermission } from "@cdktf/provider-aws/lib/lambdafunction";
import { fileHash } from "./lib/fileHash";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch";

class DivaStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new S3Backend(this, {
      region: "eu-west-2",
      key: id("TerraformS3Backend"),
      bucket: "divaterraformlockfiles",
      dynamodbTable: "TerraformLock",
    });

    new AwsProvider(this, id("provider"), {
      region: "eu-west-2",
    });

    const table = new DynamodbTable(this, id("OrderbookTable"), {
      name: id("Orderbook0Table"),
      readCapacity: 10,
      writeCapacity: 1,
      hashKey: "makerToken",
      rangeKey: "id",

      attribute: [
        {
          name: "makerToken",
          type: "S",
        },
        {
          name: "id",
          type: "S",
        },
        {
          name: "takerToken",
          type: "S",
        },
        {
          name: "maker",
          type: "S",
        },
      ],
      globalSecondaryIndex: [
        {
          name: "OrderBookIndex",
          hashKey: "makerToken",
          rangeKey: "takerToken",
          projectionType: "ALL",
          writeCapacity: 1,
          readCapacity: 10,
        },
        {
          name: "MakerIndex",
          hashKey: "maker",
          rangeKey: "makerToken",
          projectionType: "ALL",
          writeCapacity: 1,
          readCapacity: 10,
        },
      ],
      tags: tags({}),
    });

    const lambdaAuthorizerRole = new IamRole(
      this,
      id("OrderbookLambdaAuthRole"),
      {
        name: id("OrderbookLambdaAuthRole"),
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
              Effect: "Allow",
              Sid: "",
            },
          ],
        }),
        tags: tags({}),
      }
    );


    const authFileName = `${process.cwd()}/dist/lambda-fns/orderbookAuth.zip`;
    const lambdaAuthorizer = new LambdaFunction(
      this,
      id("OrderbookLambdaAuthorizer"),
      {
        filename: authFileName,
        runtime: "nodejs12.x",
        handler: "index.handler",
        role: lambdaAuthorizerRole.arn,
        sourceCodeHash: fileHash(authFileName),
        functionName: id("OrderbookLambdaAuthorizer"),
        tags: tags({})
      }
    );

    new CloudwatchLogGroup(this, id("OrderbookAuthorizerLogs"), {
      name: `/aws/lambda/${lambdaAuthorizer.functionName}`,
      retentionInDays: 14,
      tags: tags({}),
    });

    const lambdaLogging = new IamPolicy(this, id("LambdaLoggingPolicy"), {
      name: id("LambdaLoggingPolicy"),
      path: "/",
      description: "IAM policy for logging from a lambda",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: "arn:aws:logs:*:*:*",
            Effect: "Allow",
          },
        ],
      }),
      tags: tags({}),
    });

    new IamRolePolicyAttachment(this, id("LambdaLogs"), {
      role: lambdaAuthorizerRole.name,
      policyArn: lambdaLogging.arn,
    });

    const api = new AppsyncGraphqlApi(this, id("OrderbookAppsyncApi"), {
      name: id("OrderbookAppsyncApi"),
      authenticationType: "AWS_LAMBDA",
      schema: `
      schema {
        query: Query
        mutation: Mutation
      }

      type Signature {
        signatureType: String!
        r: String!
        s: String!
        v: String!
      }

      input SignatureInput {
        signatureType: String!
        r: String!
        s: String!
        v: String!
      }

      type Order {
        id: ID!

        pool: String!
        feeRecipient: String!
        takerTokenFeeAmount: String!
        makerToken: String!
        takerToken: String!
        makerAmount: String!
        takerAmount: String!
        maker: String!
        taker: String!
        sender: String!
        expiry: String!
        salt: String!
        chainId: Int!
        verifyingContract: String!
        signature: Signature!
      }


      type Mutation {
        createOrder(
          pool: String!
          feeRecipient: String!
          takerTokenFeeAmount: String!
          makerToken: String!
          takerToken: String!
          makerAmount: String!
          takerAmount: String!
          maker: String!
          taker: String!
          sender: String!
          expiry: String!
          salt: String!
          chainId: Int!
          verifyingContract: String!
          signature: SignatureInput!
        ): Order
      }
      
      type PaginatedOrders {
        items: [Order]
        nextToken: String!
      }
    
      type Query {
        order(id: ID!): Order
        ordersByMakerToken(makerToken: String, limit: Int, nextToken: String): PaginatedOrders
        ordersByTokens(makerToken: String, takerToken: String, limit: Int, nextToken: String): PaginatedOrders
      }
      `,
      tags: tags({}),
      lambdaAuthorizerConfig: {
        authorizerUri: lambdaAuthorizer.arn,
      },
    });

    new LambdaPermission(this, id("OrderbookAppsyncLambdaPermission"), {
      statementId: "appsync_lambda_authorizer",
      action: "lambda:InvokeFunction",
      functionName: lambdaAuthorizer.functionName,
      principal: "appsync.amazonaws.com",
      sourceArn: api.arn,
    });

    const iamRole = new IamRole(this, id("OrderbookDatasourceRole"), {
      name: id("OrderbookDatasourceRole"),
      assumeRolePolicy: `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Principal": {
              "Service": "appsync.amazonaws.com"
            },
            "Effect": "Allow"
          }
        ]
      }`,
      tags: tags({}),
    });

    const dataSource = new AppsyncDatasource(this, id("OrderbookDatasource"), {
      name: id("OrderbookDatasource"),
      apiId: api.id,
      serviceRoleArn: iamRole.arn,
      type: "AMAZON_DYNAMODB",
      dynamodbConfig: {
        tableName: table.name,
      },
    });

    new AppsyncResolver(this, id("OrderbookAppsyncResolverGetOrder"), {
      apiId: api.id,
      field: "order",
      type: "Query",
      dataSource: dataSource.name,
      requestTemplate: `{
        "version": "2017-02-28",
        "operation": "GetItem",
        "key" : {
          "id" : $util.dynamodb.toDynamoDBJson($ctx.args.id)
        }
      }`,
      responseTemplate: `
      {
        "items": $utils.toJson($ctx.result.items)
        #if($ctx.result.nextToken)
          ,"nextToken": $util.toJson($ctx.result.nextToken)
        #end
      }
      `,
    });

    new AppsyncResolver(this, id("GetOrdersByTokens"), {
      apiId: api.id,
      field: "ordersByTokens",
      type: "Query",
      dataSource: dataSource.name,
      requestTemplate: `{
        "version" : "2017-02-28",
        "index": "OrderBookIndex",
        "operation" : "Query"
        #if($ctx.args.limit)
          ,"limit": $util.toJson($ctx.args.limit)
        #end
        #if($ctx.args.nextToken)
          ,"nextToken": $util.toJson($ctx.args.nextToken)
        #end
        ,"query" : {
          "expression": "makerToken = :makerToken AND takerToken = :takerToken",
            "expressionValues" : {
              ":makerToken" : $util.dynamodb.toDynamoDBJson($context.arguments.makerToken),
              ":takerToken" : $util.dynamodb.toDynamoDBJson($context.arguments.takerToken)
            }
          }
      }`,
      responseTemplate: `$util.toJson($ctx.result)`,
    });

    new AppsyncResolver(this, id("GetOrdersByMakerToken"), {
      apiId: api.id,
      field: "ordersByMakerToken",
      type: "Query",
      dataSource: dataSource.name,
      requestTemplate: `{
        "version" : "2017-02-28",
        "operation" : "Query"
        #if($ctx.args.limit)
          ,"limit": $util.toJson($ctx.args.limit)
        #end
        #if($ctx.args.nextToken)
          ,"nextToken": $util.toJson($ctx.args.nextToken)
        #end
        ,"query" : {
          "expression": "makerToken = :makerToken",
            "expressionValues" : {
              ":makerToken" : $util.dynamodb.toDynamoDBJson($context.arguments.makerToken)
            }
        }
    }`,
      responseTemplate: `$util.toJson($ctx.result)`,
    });


    new AppsyncResolver(this, id("OrderbookAppsyncResolverCreateOrder"), {
      apiId: api.id,
      field: "createOrder",
      type: "Mutation",
      dataSource: dataSource.name,
      requestTemplate: `{
        "version" : "2017-02-28",
        "operation" : "PutItem",
        "key" : {
          "id": $util.dynamodb.toDynamoDBJson($util.autoId())
        },
        "attributeValues" : $util.dynamodb.toMapValuesJson($ctx.args)
    }`,
      responseTemplate: "$util.toJson($ctx.result)",
    });

    new IamRolePolicy(this, id("OrderbookDatasourcePolicy"), {
      name: id("OrderbookDataSourcePolicy"),
      policy: `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": [
              "dynamodb:*"
            ],
            "Effect": "Allow",
            "Resource": [
              "${table.arn}",
              "${table.arn}/index/OrderBookIndex",
              "${table.arn}/index/MakerIndex"
            ]
          }
        ]
      }`,
      role: iamRole.id,
    });
  }
}

const app = new App();
new DivaStack(app, "diva-infrastructure");
app.synth();
