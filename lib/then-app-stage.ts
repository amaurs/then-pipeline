import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { ThenSinglePageApplicationStack } from './then-single-page-application-stack';

export class ThenAppStage extends cdk.Stage {
    
    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
      super(scope, id, props);
      const thenStack = new ThenSinglePageApplicationStack(this, 'Then');
    }
}