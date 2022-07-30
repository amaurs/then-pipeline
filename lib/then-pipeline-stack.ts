import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { ThenAppStage } from './then-app-stage';


export class ThenPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const buildThen = new ShellStep('Prebuild', {
        input: CodePipelineSource.gitHub('amaurs/then', 'main', {
                    authentication: cdk.SecretValue.secretsManager(process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!),
                }),
        primaryOutputDirectory: './build',
        commands: ['mkdir -p src/fonts',
                   `aws s3 sync s3://${process.env.FONT_S3_BUCKET!}/ src/fonts`,
                   'npm install terser@3.14.1 --save-dev',
                   'npm install',
                   'npm run build'],
    });

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'ThenPipeline',

      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('amaurs/then-pipeline', 'main', {
                    authentication: cdk.SecretValue.secretsManager(process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!),
                }),
        additionalInputs: {
            'then': buildThen
        },
        env: {
            'ACCOUNT': process.env.ACCOUNT!,
            'REGION': process.env.REGION!,
            'GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME': process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!,
            'REACT_APP_API_HOST': process.env.REACT_APP_API_HOST!,
            'REACT_APP_GA_ID': process.env.REACT_APP_GA_ID!,
            'FONT_S3_BUCKET': process.env.FONT_S3_BUCKET!,
        },
        commands: ['npm ci', 'npm run build', 'npx cdk synth -vv']
      })
    });

    pipeline.addStage(new ThenAppStage(this, "Prod", {
      env: { account: process.env.ACCOUNT!, region: process.env.REGION! }
    }));
  }
}
