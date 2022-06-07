import { Construct } from "constructs";
import { App, S3Backend, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import { id } from "./lib/id";
import { orderBookApi } from "./orderBookApi";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3";

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

    // new S3Bucket(this, id("app.diva.finance"), {
    //   bucket: id("app.diva.finance"),
    //   website: {
    //     indexDocument: "index.html",
    //   },
    // });
  }
}

const app = new App();
new DivaStack(app, "diva-infrastructure");
app.synth();
