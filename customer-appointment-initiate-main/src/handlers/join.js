const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = "chatSessions";
const apigEndpoint = 'wss://1a40wvs365.execute-api.us-east-1.amazonaws.com/production';
const apig = new AWS.ApiGatewayManagementApi({
    endpoint: apigEndpoint
});

exports.handler = async (event) => {
    try {
        console.log('Received event ', event);

        const { connectionId } = event.requestContext;
        const body = JSON.parse(event.body);
        const { userType, sessionChannelId } = body;
        var params = {
            TableName: tableName,
            Key: {
                sessionChannelId,
            },
            ExpressionAttributeValues: {
                ":connectionId": connectionId
            },
            ReturnValues: "UPDATED_NEW",
        };

        if (userType === 'SME') {
            params.UpdateExpression = "set smeId = :connectionId";

        } else {
            params.UpdateExpression = "set userId = :connectionId";
        }

        let chatSession = await docClient.update(params).promise();

        await apig.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify({
                event: "init",
                chatSession
            })
        }).promise();

    } catch (err) {
        console.log(err);
    }
};
