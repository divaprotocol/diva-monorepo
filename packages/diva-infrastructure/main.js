"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdktf_1 = require("cdktf");
const provider_aws_1 = require("@cdktf/provider-aws");
const tableName = "hello";
const schema = `
  type Paginated${tableName} {
    items: [${tableName}!]!
    nextToken: String
  }
  type Query {
    all(limit: Int, nextToken: String): Paginated${tableName}!
    getOne(${tableName}Id: ID!): ${tableName}
  }
  type Mutation {
    save(name: String!): ${tableName}
    delete(${tableName}Id: ID!): ${tableName}
  }
  type Schema {
    query: Query
    mutation: Mutation
}
`;
class MyStack extends cdktf_1.TerraformStack {
    constructor(scope, name) {
        super(scope, name);
        new cdktf_1.TerraformVariable(scope, "environment", {
            default: "development",
        });
        new provider_aws_1.AwsProvider(this, 'provider', {
            region: 'us-west-2',
        });
        // new AppsyncGraphqlApi(scope, "")
        // define resources here
    }
}
const app = new cdktf_1.App();
new MyStack(app, "diva-infrastructure");
app.synth();
