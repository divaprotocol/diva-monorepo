import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import {
  AppsyncApiKey,
  AppsyncDatasource,
  AppsyncGraphqlApi,
  AppsyncResolver,
} from "@cdktf/provider-aws/lib/appsync";
import { AwsProvider } from "@cdktf/provider-aws";
import { id } from "./lib/id";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb";
import { IamRole, IamRolePolicy } from "@cdktf/provider-aws/lib/iam";

class DivaStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, id("provider"), {
      region: "eu-west-2",
    });

    const table = new DynamodbTable(this, id("OrderbookTable"), {
      name: id("Orderbook0Table"),
      readCapacity: 1,
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
      ],
    });

    const api = new AppsyncGraphqlApi(this, id("OrderbookAppsyncApi"), {
      name: id("OrderbookAppsyncApi"),
      authenticationType: "API_KEY",
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
        orders(makerToken: String, limit: Int, nextToken: String): PaginatedOrders
      }
      `,
    });


    new AppsyncApiKey(this, id("OrderbookAppsyncApiKey"), {
      apiId: api.id,
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

    new AppsyncResolver(this, id("OrderbookAppsyncResolverGetOrders"), {
      apiId: api.id,
      field: "orders",
      type: "Query",
      dataSource: dataSource.name,
      requestTemplate: `{
        "version" : "2017-02-28",
        "operation" : "Query"
        #if($ctx.args.count)
          ,"limit": $util.toJson($ctx.args.count)
        #end
        #if($ctx.args.nextToken)
          ,"nextToken": $util.toJson($ctx.args.nextToken)
        #end
        #if($ctx.args.makerToken)
        ,"query" : {
          "expression": "makerToken = :makerToken",
            "expressionValues" : {
              ":makerToken" : $util.dynamodb.toDynamoDBJson($context.arguments.makerToken)
            }
        }
        #end
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
              "${table.arn}"
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
