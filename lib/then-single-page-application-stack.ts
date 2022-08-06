import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_s3_deployment as s3_deployment } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, InlineCode, Runtime } from 'aws-cdk-lib/aws-lambda';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { aws_codebuild as codebuild } from 'aws-cdk-lib';
import * as path from 'path';


export class ThenSinglePageApplicationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        console.log('Creating the bucket');
        const bucket = new s3.Bucket(this, "SPABucket", {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            bucketName: 'then.gallery',
        });

        console.log('Giving it access');
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


        const cloudFrontDistProps: cloudfront.CloudFrontWebDistributionProps = {
          originConfigs: [
            {
              s3OriginSource: {
                s3BucketSource: bucket,
                originAccessIdentity: cloudFrontOAI,
              },
              behaviors: [{ isDefaultBehavior: true }],
            },
          ],
        };

        const cloudfrontDist = new cloudfront.CloudFrontWebDistribution(
          this,
          `then.gallery-cfd`,
          cloudFrontDistProps
        );

        bucket.addToResourcePolicy(cloudfrontS3Access);

        console.log('Deploying website -> ', path.join(__dirname, './build'));
        new s3_deployment.BucketDeployment(this, 'DeployWebsite', {
            sources: [s3_deployment.Source.asset(path.join(__dirname, '../then/build'))],
            destinationBucket: bucket,
            distribution: cloudfrontDist,
            distributionPaths: ['/index.html'],
        });
    }
}