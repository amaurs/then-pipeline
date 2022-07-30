import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { ThenAppStage } from './then-app-stage';


export class ThenPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'ThenPipeline',

      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('amaurs/then-pipeline', 'main', {
                    authentication: cdk.SecretValue.secretsManager(process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!),
                }),
        env: {
            'ACCOUNT': process.env.ACCOUNT!,
            'REGION': process.env.REGION!,
            'GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME': process.env.GITHUB_PERSONAL_ACCESS_TOKEN_SECRET_NAME!,
            'REACT_APP_API_HOST': process.env.REACT_APP_API_HOST!,
            'REACT_APP_GA_ID': process.env.REACT_APP_GA_ID!,
            'FONT_S3_BUCKET': process.env.FONT_S3_BUCKET!,
        },
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });

    pipeline.addStage(new ThenAppStage(this, "Prod", {
      env: { account: process.env.ACCOUNT!, region: process.env.REGION! }
    }));
  }
}
