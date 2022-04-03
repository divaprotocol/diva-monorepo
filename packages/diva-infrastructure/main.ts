import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AppsyncApiKey, AppsyncDatasource, AppsyncGraphqlApi, AppsyncResolver } from "@cdktf/provider-aws/lib/appsync";
import { AwsProvider } from "@cdktf/provider-aws";
import { id } from "./lib/id";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb";
import { IamRole, IamRolePolicy } from "@cdktf/provider-aws/lib/iam";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, id("provider"), {
      region: "eu-west-2",
    });

    const table = new DynamodbTable(this, id("OrderbookTable"), {
      name: id("Orderbook0Table"),
      readCapacity: 1,
      writeCapacity: 1,
      hashKey: "OrderId",

      attribute: [
        {
          name: "OrderId",
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

        type Order {
          OrderId: ID!
          sender: String!
          maker: String!
          taker: String!
        }

        type Mutation {
          putOrder(sender: String!, maker: String!, taker: String!): Order
        }
        
        type Query {
          getOrder(id: ID!): Order
          allOrders: [Order]
        }`,
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
      field: "getOrder",
      type: "Query",
      dataSource: dataSource.name,
      requestTemplate: `{
        "version": "2017-02-28",
        "operation": "GetItem",
        "key" : {
            "OrderId" : $util.dynamodb.toDynamoDBJson($ctx.args.id)
        }
      }`,
      responseTemplate: `$util.toJson($ctx.result)`,
    });

    new AppsyncResolver(this, id("OrderbookAppsyncResolverGetOrder"), {
      apiId: api.id,
      field: "getOrder",
      type: "Query",
      dataSource: dataSource.name,
      requestTemplate: `{
        "version": "2017-02-28",
        "operation": "GetItem",
        "key" : {
            "OrderId" : $util.dynamodb.toDynamoDBJson($ctx.args.id)
        }
      }`,
      responseTemplate: `$util.toJson($ctx.result)`,
    });


    new AppsyncResolver(this, id("OrderbookAppsyncResolverPutOrder"), {
      apiId: api.id,
      field: "putOrder",
      type: "Mutation",
      dataSource: dataSource.name,
      requestTemplate: `{
        "version" : "2017-02-28",
        "operation" : "PutItem",
        "key" : {
            "OrderId": $util.dynamodb.toDynamoDBJson($util.autoId())
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
new MyStack(app, "diva-infrastructure");
app.synth();
