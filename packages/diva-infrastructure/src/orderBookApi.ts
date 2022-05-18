import { Construct } from "constructs";
import {
  AppsyncDatasource,
  AppsyncGraphqlApi,
  AppsyncResolver
} from "@cdktf/provider-aws/lib/appsync";
import { id } from "./lib/id";
import { IamPolicy, IamRole, IamRolePolicy, IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam";
import { tags } from "./lib/tags";
import { LambdaFunction, LambdaPermission } from "@cdktf/provider-aws/lib/lambdafunction";
import { fileHash } from "./lib/fileHash";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch";
import { orderBookTable } from "./orderBookTable";

export function orderBookApi(construct: Construct) {
  const table = orderBookTable(construct);

  const lambdaAuthorizerRole = new IamRole(
    construct,
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
    construct,
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

  new CloudwatchLogGroup(construct, id("OrderbookAuthorizerLogs"), {
    name: `/aws/lambda/${lambdaAuthorizer.functionName}`,
    retentionInDays: 14,
    tags: tags({}),
  });

  const lambdaLogging = new IamPolicy(construct, id("LambdaLoggingPolicy"), {
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

  new IamRolePolicyAttachment(construct, id("LambdaLogs"), {
    role: lambdaAuthorizerRole.name,
    policyArn: lambdaLogging.arn,
  });

  const api = new AppsyncGraphqlApi(construct, id("OrderbookAppsyncApi"), {
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
        chainId: Int!
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
      orders(chainId: Int, limit: Int, nextToken: String): PaginatedOrders
      ordersByMakerToken(chainId: Int, makerToken: String, limit: Int, nextToken: String): PaginatedOrders
      ordersByTokens(chainId: Int, makerToken: String, takerToken: String, limit: Int, nextToken: String): PaginatedOrders
    }

    type Subscription {
      orderCreated: Order
      @aws_subscribe(mutations: ["createOrder"])
    }
    `,
    tags: tags({}),
    lambdaAuthorizerConfig: {
      authorizerUri: lambdaAuthorizer.arn,
    },
  });

  new LambdaPermission(construct, id("OrderbookAppsyncLambdaPermission"), {
    statementId: "appsync_lambda_authorizer",
    action: "lambda:InvokeFunction",
    functionName: lambdaAuthorizer.functionName,
    principal: "appsync.amazonaws.com",
    sourceArn: api.arn,
  });

  const iamRole = new IamRole(construct, id("OrderbookDatasourceRole"), {
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

  const dataSource = new AppsyncDatasource(construct, id("OrderbookDatasource"), {
    name: id("OrderbookDatasource"),
    apiId: api.id,
    serviceRoleArn: iamRole.arn,
    type: "AMAZON_DYNAMODB",
    dynamodbConfig: {
      tableName: table.name,
    },
  });

  new AppsyncResolver(construct, id("OrderbookAppsyncResolverGetOrder"), {
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

  new AppsyncResolver(construct, id("GetOrdersByTokens"), {
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
      },
      "filter" : {
        "expression" : "chainId = :chainId",
        "expressionValues" : {
          ":chainId" : $util.dynamodb.toDynamoDBJson($context.arguments.chainId)
        }
      }
    }`,
    responseTemplate: `$util.toJson($ctx.result)`,
  });

  new AppsyncResolver(construct, id("GetOrders"), {
    apiId: api.id,
    field: "orders",
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
        "expression": "chainId = :chainId",
        "expressionValues" : {
          ":chainId" : $util.dynamodb.toDynamoDBJson($context.arguments.chainId)
        }
      }
    }`,
    responseTemplate: `$util.toJson($ctx.result)`,
  });

  new AppsyncResolver(construct, id("GetOrdersByMakerToken"), {
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
        "expression": "chainId = :chainId AND makerToken = :makerToken",
          "expressionValues" : {
            ":chainId" : $util.dynamodb.toDynamoDBJson($context.arguments.chainId),
            ":makerToken" : $util.dynamodb.toDynamoDBJson($context.arguments.makerToken)
          }
      }
  }`,
    responseTemplate: `$util.toJson($ctx.result)`,
  });


  new AppsyncResolver(construct, id("OrderbookAppsyncResolverCreateOrder"), {
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

  new IamRolePolicy(construct, id("OrderbookDatasourcePolicy"), {
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
            "${table.arn}/index/MakerIndex",
            "${table.arn}/index/ChainAndExpiry"
          ]
        }
      ]
    }`,
    role: iamRole.id,
  });
}
