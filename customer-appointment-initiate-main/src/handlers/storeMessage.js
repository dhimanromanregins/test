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

        const body = JSON.parse(event.body);
        const { userType, sessionChannelId, message } = body;
        var params = {
            TableName: tableName,
            Key: {
                sessionChannelId,
            }
        };

        console.log(params);

        let chats = await docClient.get(params).promise();

        params = {
            TableName: tableName,
            Key: {
                sessionChannelId,
            },
            ReturnValues: "UPDATED_NEW",
        };

        chats.messages.push({
            userType,
            message
        });
        params.UpdateExpression = "set messages = :messages";
        params.ExpressionAttributeValues = { [':messages']: chats.messages };

        await docClient.update(params).promise();

        await apig.postToConnection({
            ConnectionId: userType === 'SME' ? chats.userId : chats.smeId,
            Data: JSON.stringify({
                event: "message",
                userType,
                message,
                sessionChannelId
            })
        }).promise();

    } catch (err) {
        console.log(err);
    }
};
