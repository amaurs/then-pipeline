import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_s3_deployment as s3_deployment } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, InlineCode, Runtime } from 'aws-cdk-lib/aws-lambda';
import { aws_certificatemanager as certificate_manager } from 'aws-cdk-lib';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';
import { aws_route53_targets as route53_targets } from 'aws-cdk-lib';
import { aws_codebuild as codebuild } from 'aws-cdk-lib';
import * as path from 'path';


export class ThenSinglePageApplicationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const primaryDomain = 'then.gallery'

        console.log('Creating the bucket');
        const bucket = new s3.Bucket(this, "ThenSinglePageApplicationBucket", {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            bucketName: primaryDomain,
        });

        console.log('Giving it access');
        const cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, 'ThenOriginAccessIdentity', {
            comment: `Origin access identity for Then website.`,
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

        const hostedZone = new route53.HostedZone(this, 'ThenHostedZone', {
            zoneName: primaryDomain,
        });

        const certificate = new certificate_manager.Certificate(this, 'ThenCertificate', {
            domainName: primaryDomain,
            subjectAlternativeNames: [
                `blog.${primaryDomain}`,
                ],
            validation: certificate_manager.CertificateValidation.fromDns(hostedZone),
        });


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
            viewerCertificate: {
                aliases: [primaryDomain],
                props: {
                    acmCertificateArn: certificate.certificateArn,
                    sslSupportMethod: 'sni-only',
                    minimumProtocolVersion: 'TLSv1.1_2016',
                }
            },
            errorConfigurations: [
                {
                    errorCode: 403,
                    errorCachingMinTtl: 10,
                    responseCode: 403,
                    responsePagePath: '/index.html',
                },
                {
                    errorCode: 404,
                    errorCachingMinTtl: 10,
                    responseCode: 404,
                    responsePagePath: '/index.html',
                },
            ]
        };

        const cloudfrontDist = new cloudfront.CloudFrontWebDistribution(
          this,
          'ThenCloudFrontDistribution',
          cloudFrontDistProps
        );

        new route53.ARecord(this, 'Alias', {
            zone: hostedZone,
            target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(cloudfrontDist)),
        });

        new s3_deployment.BucketDeployment(this, 'ThenBucketDeployment', {
            sources: [s3_deployment.Source.asset(path.join(__dirname, '../then/build'))],
            destinationBucket: bucket,
            distribution: cloudfrontDist,
            distributionPaths: ['/index.html'],
        });

    }
}