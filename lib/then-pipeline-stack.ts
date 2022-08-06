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

      synth: new ShellStep('Build', {
        input: CodePipelineSource.gitHub('amaurs/then-pipeline', 'main', {
                    authentication: cdk.SecretValue.secretsManager(process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!),
                }),
        additionalInputs: {
            'then': CodePipelineSource.gitHub('amaurs/then', 'feature-update', {
                        authentication: cdk.SecretValue.secretsManager(process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!),
                    }),
            'fonts': CodePipelineSource.s3(fontBucket, 'fonts.zip')
        },
        env: {
            'ACCOUNT': process.env.ACCOUNT!,
            'REGION': process.env.REGION!,
            'GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME': process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!,
            'REACT_APP_API_HOST': process.env.REACT_APP_API_HOST!,
            'REACT_APP_GA_ID': process.env.REACT_APP_GA_ID!,
            'FONT_S3_BUCKET': process.env.FONT_S3_BUCKET!,
        },
        primaryOutputDirectory: "cdk.out",
        commands: [
            'cp -r fonts/* then/src/fonts',
            'cd then',  // path from project root to React app package.json
            'npm install terser@3.14.1 --save-dev',
            'npm ci',
            'npm run build',
            'cd ..',
            'cat .gitignore',
            'npm ci', 'npm run build', 'npx cdk synth --debug']
      })
    });

    console.log('About to start deployment');

    pipeline.addStage(new ThenAppStage(this, "Deployment", {
      env: { account: process.env.ACCOUNT!, region: process.env.REGION! }
    }));
  }
}
