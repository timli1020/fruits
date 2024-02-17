import * as AWS from 'aws-sdk';

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {
  const fruitId = event.pathParameters.id;

  if (!fruitId) {
    return { statusCode: 400, body: `Error. No fruit id provided` };
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: fruitId,
    },
  };

	try {
		const response = await db.get(params).promise();
		if (response.Item) {
			return { statusCode: 200, body: JSON.stringify(response.Item) };
		} else {
			return { statusCode: 404, body: `Fruit with id ${fruitId} not found` };
		}
	} catch (dbError) {
		return { statusCode: 500, body: JSON.stringify(dbError) };
	}
};
