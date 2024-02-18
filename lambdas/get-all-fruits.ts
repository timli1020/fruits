import * as AWS from 'aws-sdk';

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {

    const params = {
        TableName: TABLE_NAME,
    }

    try {
        const response = await db.scan(params).promise();
        if (response.Items) {
            const items: AWS.DynamoDB.DocumentClient.AttributeMap[] = [];
            response.Items.forEach((item) => {
                items.push(item);
            });
            return { statusCode: 200, body: JSON.stringify({"fruits": items}) };
        } else {
            return { statusCode: 404, body: `No Fruits found` };
        }
    } catch (dbError) {
        return { statusCode: 500, body: JSON.stringify(dbError) };
    }
    
}