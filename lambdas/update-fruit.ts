import * as AWS from "aws-sdk";
import { UpdateItemInput } from "aws-sdk/clients/dynamodb";

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {
  const fruitId = event.pathParameters.id;

  if (!fruitId) {
    return { statusCode: 400, body: `Error. No fruit id provided` };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: `Error. No fruit body parameters provided`,
    };
  }

  const fruit = typeof event.body == "object" ? event.body : JSON.parse(event.body);
	const fruitProperties = Object.keys(fruit);
	if (!fruit || fruitProperties.length < 1) {
    return { statusCode: 400, body: 'invalid request, no arguments provided' };
  }

  const firstProperty = fruitProperties.splice(0, 1);
  const params: any = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: fruitId
    },
    UpdateExpression: `set ${firstProperty} = :${firstProperty}`,
    ExpressionAttributeValues: {},
    ReturnValues: 'UPDATED_NEW'
  }
  params.ExpressionAttributeValues[`:${firstProperty}`] = fruit[`${firstProperty}`];

  fruitProperties.forEach(property => {
    params.UpdateExpression += `, ${property} = :${property}`;
    params.ExpressionAttributeValues[`:${property}`] = fruit[property];
  });

  try {
    await db.update(params).promise();
    return { statusCode: 201, body: `successfully updated fruit wth id ${fruitId}` };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
