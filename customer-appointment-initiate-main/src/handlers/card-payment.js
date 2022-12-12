// Create clients and set shared const values outside of the handler.
// Create a DocumentClient that represents the query to add an item

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName =
  "customer-appointment-booking-AppointmentBooking-1JQ2TKD68PQST";
const chatTableName = 'chatSessions';

const axios = require("axios");
/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */

function randomString(length) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

  if (!length) {
    length = Math.floor(Math.random() * chars.length);
  }

  var str = '';
  for (var i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

exports.cardPaymentHandler = async (event) => {
  //Call this function with this URl - https://1jvc56apqe.execute-api.us-east-2.amazonaws.com/Prod/init
  if (event.httpMethod !== "POST") {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`
    );
  }
  // All log statements are written to CloudWatch
  console.info("received:", event);
  // Get id and name from the body of the request
  const body = JSON.parse(event.body);
  const id = body.id;
  const smename = body.smename;
  const customerName = body.custName;
  const smeEmail = body.smeEmail;
  const custEmail = body.custEmail;
  // Creates a new item, or replaces an old item with a new item
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  //https://bqiipakjza.execute-api.us-east-1.amazonaws.com/dev/charges

  return await axios
    .get(
      `https://g1vdjcanm1.execute-api.us-east-2.amazonaws.com/Prod/paymentmethods/${custEmail}`
    )
    .then(async (response) => {
      console.log("res from get payment methods API", response.data);
      if (response.data.length > 0) {
        try {

          // charge here
          const cardDetail = response.data.find((i) => i.makeAsDefaultMethod === true);
          let chargeObject = {
            name: cardDetail.nameOnCard,
            email: cardDetail.customerEmail,
            cardNumber: cardDetail.cardNumber,
            cvv: cardDetail.securityCode,
            cardExpMonth: parseInt(cardDetail.cardExpiry.split("/")[0]),
            cardExpYear: parseInt(`20${cardDetail.cardExpiry.split("/")[1]}`),
            amount: 299,
          };
          let chargeApiUrl = "https://bqiipakjza.execute-api.us-east-1.amazonaws.com/dev/charges";
          let res = await axios.post(chargeApiUrl, chargeObject);

          console.info("charges API response: ", res);
          console.info("consultingSession-" + customerName + smename + id);

          let sessionChannelId = randomString(15);

          var params = {
            TableName: tableName,
            Key: {
              sessionChannelId
            }
          };
          let existingChatSession = await docClient.get(params).promise();

          while(existingChatSession) {
            sessionChannelId = randomString(15);
          }

          let appointmentCreationUrl = `https://adwue0temh.execute-api.us-east-2.amazonaws.com/Prod/sme/appointments/${smeEmail}`;
          res = await axios.get(appointmentCreationUrl);

          // create chat session
          params = {
            TableName: chatTableName,
            Item: {
              sessionChannelId,
              messages: [],
              smeId: "",
              userId: ""
            }
          };
          await docClient.putItem(params).promise();

          // update session record
          if (res.data.length > 0) {
            var params = {
              TableName: tableName,
              Key: {
                appointmentId: res.data[0].appointmentId,
              },
              UpdateExpression:
                "set appointmentStatus = :appointmentStatusVal, sessionTopic = :sessionTopicVal",
              ExpressionAttributeValues: {
                ":appointmentStatusVal": "Started",
                ":sessionChannelId": sessionChannelId,
              },
              ReturnValues: "UPDATED_NEW",
            };
            console.log("params: ", params);
            const result = await docClient.update(params).promise();
            console.log("result: ", result);
            const response = {
              statusCode: 200,
              headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
              },
              body: JSON.stringify({ topicArn: createTopicPromise }),
            };
            console.info(
              `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
            );
            return response;

          } else {
            return {
              statusCode: 400,
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
              },
              body: "No appointment available",
            };
          }

        } catch (e) {
          console.log("charges API e::: ", e);
          return {
            statusCode: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            },
            body: e,
          };
        }
      } else {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
          },
          body: "No default payment available",
        };
      }
    })
    .catch((e) => {
      console.log("e::: ", e);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        body: e,
      };
    });
};
