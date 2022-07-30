import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, InlineCode, Runtime } from 'aws-cdk-lib/aws-lambda';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { aws_codebuild as codebuild } from 'aws-cdk-lib';
import * as yaml from 'yaml';

const fromYaml = yaml.parse(`
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 16
  pre_build:
    commands:
      - npm
  build:
    commands:
      - echo $REACT_APP_API_HOST
      - echo "if-then"
      - mkdir -p src/fonts
      - aws s3 sync s3://$FONT_S3_BUCKET/ src/fonts
      - npm install terser@3.14.1 --save-dev
      - npm install
      - npm run build
      # - command
  post_build:
    commands:
      - aws s3 sync --cache-control 'max-age=604800' --exclude index.html build/ s3://$HOME_SWEET_HOME/
      - aws s3 sync --cache-control 'no-cache' build/ s3://$HOME_SWEET_HOME/

`);


export class ThenSinglePageApplicationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
  
        const bucket = new s3.Bucket(this, "then.gallery", {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, 'OAI', {
            comment: `OAI for Then website.`,
        });

        const cloudfrontS3Access = new iam.PolicyStatement();
        cloudfrontS3Access.addActions('s3:GetBucket*');
        cloudfrontS3Access.addActions('s3:GetObject*');
        cloudfrontS3Access.addActions('s3:List*');
        cloudfrontS3Access.addResources(bucket.bucketArn);
        cloudfrontS3Access.addResources(`${bucket.bucketArn}/*`);
        cloudfrontS3Access.addCanonicalUserPrincipal(
          cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
        );

        bucket.addToResourcePolicy(cloudfrontS3Access);

        const webhooks: codebuild.FilterGroup[] = [
            codebuild.FilterGroup.inEventOf(
                codebuild.EventAction.PUSH,
                codebuild.EventAction.PULL_REQUEST_MERGED).andHeadRefIs("main"),
        ];

        const repo = codebuild.Source.gitHub({
            owner: "amaurs",
            repo: "then",
            webhook: true,
            webhookFilters: webhooks,
            reportBuildStatus: true,
        });

        console.log('HOME_SWEET_HOME 👉🏽', bucket.bucketName);
        console.log('REACT_APP_API_HOST 👉🏽', process.env.REACT_APP_API_HOST);
        console.log('REACT_APP_GA_ID 👉🏽', process.env.REACT_APP_GA_ID);
        console.log('FONT_S3_BUCKET 👉🏽', process.env.FONT_S3_BUCKET);

    }
}