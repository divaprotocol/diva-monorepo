import { Construct } from "constructs";
import { App, S3Backend, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import { id } from "./lib/id";
import { orderBookApi } from "./orderBookApi";

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

    orderBookApi(this)
  }
}

const app = new App();
new DivaStack(app, "diva-infrastructure");
app.synth();
