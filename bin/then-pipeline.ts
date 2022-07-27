#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ThenPipelineStack } from '../lib/then-pipeline-stack';

const app = new cdk.App();

console.log('ACCOUNT 👉🏽', process.env.ACCOUNT);
console.log('REGION 🌎', process.env.REGION);

new ThenPipelineStack(app, 'ThenPipelineStack', {
  env: { 
      account: process.env.ACCOUNT, 
      region: process.env.REGION },
});