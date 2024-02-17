import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {
    if (!event.body) {
        return { statusCode: 400, body: `Error. No fruit body parameters provided` };
    }

    const fruit = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
    const id = uuid();
    fruit[PRIMARY_KEY] = id;

    const params = {
        TableName: TABLE_NAME,
        Item: fruit
    };

    try {
        await db.put(params).promise();
        return { statusCode: 201, body: `successfully created fruit wth id ${id}` };
    } catch (dbError) {
        return { statusCode: 500, body: JSON.stringify(dbError) };
    }
}