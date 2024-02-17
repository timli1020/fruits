import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi, IResource } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FruitsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create Fruits table
    const dynamoTable = new Table(this, 'fruits', {
      partitionKey: {
        name: 'fruitId',
        type: AttributeType.STRING
      },
      tableName: 'fruits',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk'
        ],
      },
      depsLockFilePath: join('lambdas', 'package-lock.json'),
      environment: {
        PRIMARY_KEY: 'fruitId',
        TABLE_NAME: dynamoTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    }

    //Create a lambda function for crud operations
    const getFruitLambda = new NodejsFunction(this, 'getFruitFunction', {
      entry: join('lambdas', 'get-fruit.ts'),
      ...nodeJsFunctionProps,
    });

    const createFruitLambda = new NodejsFunction(this, 'createFruitFunction', {
      entry: join('lambdas', 'create-fruit.ts'),
      ...nodeJsFunctionProps,
    });

    const deleteFruitLambda = new NodejsFunction(this, 'deleteFruitFunction', {
      entry: join('lambdas', 'delete-fruit.ts'),
      ...nodeJsFunctionProps,
    });

    //Grant lambda functions read access to the DynamoDB table
    dynamoTable.grantReadWriteData(getFruitLambda);
    dynamoTable.grantReadWriteData(createFruitLambda);
    dynamoTable.grantReadWriteData(deleteFruitLambda);

    //Integrate Lambda functions with API Gateway resource
    const getFruitIntegration = new LambdaIntegration(getFruitLambda);
    const createFruitIntegration = new LambdaIntegration(createFruitLambda);
    const deleteFruitIntegration = new LambdaIntegration(deleteFruitLambda);

    //Create an API Gateway resource for each operation
    const api = new RestApi(this, 'fruitsApi', {
      restApiName: 'Fruits Service'
    });

    const singleFruits = api.root.addResource('{id}');
    singleFruits.addMethod('GET', getFruitIntegration);
    singleFruits.addMethod('DELETE', deleteFruitIntegration);
    addCorsOptions(singleFruits);
    
    const fruits = api.root.addResource('fruits');
    fruits.addMethod('POST', createFruitIntegration);
    addCorsOptions(fruits);
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    // In case you want to use binary media types, uncomment the following line
    // contentHandling: ContentHandling.CONVERT_TO_TEXT,
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    // In case you want to use binary media types, comment out the following line
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}
