import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, InlineCode, Runtime } from 'aws-cdk-lib/aws-lambda';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { aws_codebuild as codebuild } from 'aws-cdk-lib';


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
    }
}