import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, CodeBuildStep } from 'aws-cdk-lib/pipelines';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { ThenAppStage } from './then-app-stage';


export class ThenPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    const fontBucket = s3.Bucket.fromBucketName(this, "FontBucket1", process.env.FONT_S3_BUCKET!);


    console.log('Just before pipeline creation.');

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'ThenPipeline',
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_7_0,
        },
      },

      synth: new ShellStep('Build', {
        input: CodePipelineSource.gitHub('amaurs/then-pipeline', 'main', {
                    authentication: cdk.SecretValue.secretsManager(process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!),
                }),
        additionalInputs: {
            'then': CodePipelineSource.gitHub('amaurs/then', 'main', {
                        authentication: cdk.SecretValue.secretsManager(process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!),
                    }),
            'fonts': CodePipelineSource.s3(fontBucket, 'fonts.zip')
        },
        env: {
            'ACCOUNT': process.env.ACCOUNT!,
            'REGION': process.env.REGION!,
            'GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME': process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!,
            'VITE_API_HOST': process.env.VITE_API_HOST!,
            'VITE_GA_ID': process.env.VITE_GA_ID!,
            'FONT_S3_BUCKET': process.env.FONT_S3_BUCKET!,
        },
        primaryOutputDirectory: "cdk.out",
        commands: [
            'n 20',
            'cp -r fonts/* then/src/fonts',
            'cd then',  // path from project root to React app package.json
            'npm ci --legacy-peer-deps',
            'npm run build',
            'cd ..',
            'npm ci',
            'npm run build',
            'npx cdk synth']
      })
    });

    pipeline.addStage(new ThenAppStage(this, "Deployment", {
      env: { account: process.env.ACCOUNT!, region: process.env.REGION! }
    }));
  }
}
