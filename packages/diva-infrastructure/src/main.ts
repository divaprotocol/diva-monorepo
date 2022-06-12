import { Construct } from "constructs";
import { App, S3Backend, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import { id } from "./lib/id";
import { orderBookApi } from "./orderBookApi";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront";

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

    orderBookApi(this);

    const bucket = new S3Bucket(this, id("app.diva.finance"), {
      bucket: "app.diva.finance",
      acl: "public-read",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::app.diva.finance/*",
          },
        ],
      }),
    });

    const originId = id("AppCloudFrontDistro")

    new CloudfrontDistribution(this, id("AppCloudFrontDistro"), {
      enabled: true,
      defaultRootObject: "index.html",
      isIpv6Enabled: true,
      defaultCacheBehavior: {
        allowedMethods: [
          "DELETE",
          "GET",
          "HEAD",
          "OPTIONS",
          "PATCH",
          "POST",
          "PUT",
        ],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: "none",
          },
        },
        viewerProtocolPolicy: "redirect-to-https",
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
        targetOriginId: originId,
      },
      origin: [
        {
          domainName: bucket.bucketRegionalDomainName,
          originId,
        },
      ],
      customErrorResponse: [
        {
          errorCachingMinTtl: 60,
          errorCode: 404,
          responseCode: 200,
          responsePagePath: "/index.html",
        },
      ],
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
    });
  }
}

const app = new App();
new DivaStack(app, "diva-infrastructure");
app.synth();
