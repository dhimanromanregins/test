// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
const axios = require("axios");

// Set region
AWS.config.update({ region: "us-east-2" });
exports.postMessageHandler = async (event) => {
  try {
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
    const message = body.message;
    const smeEmail = body.smeEmail;
    return await axios
      .get(
        `https://adwue0temh.execute-api.us-east-2.amazonaws.com/Prod/sme/appointments/${smeEmail}`
      )
      .then(async (res) => {
        console.log("res.data: ", res.data);
        const filterData = res.data.filter(
          (item) => item.appointmentStatus === "Started"
        );
        if (filterData.length > 0) {
          const topicArn = filterData[0].sessionTopic;

          var params = {
            Message: message /* required */,
            TopicArn: topicArn,
          };

          // Create promise and SNS service object
          var publishTextPromise = await new AWS.SNS({
            apiVersion: "2010-03-31",
          })
            .publish(params)
            .promise();
          console.log("publishTextPromise: ", publishTextPromise);
          // Handle promise's fulfilled/rejected states
          if (publishTextPromise) {
            console.log(
              `Message ${params.Message} sent to the topic ${params.TopicArn}`
            );
            const response = {
              statusCode: 200,
              headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
              },
              body: JSON.stringify({
                message: `Message sent to the topic ${params.TopicArn}`,
              }),
            };
            console.info(
              `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
            );
            console.log("MessageID is: " + publishTextPromise.MessageId);
            return response;
          } else {
            const response = {
              statusCode: 401,
              headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*", // Allow from anywhere
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
              },
              body: `Message not sent successfully, error in topic ARN`,
            };
            return response;
          }
        } else {
          const response = {
            statusCode: 401,
            headers: {
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Allow-Origin": "*", // Allow from anywhere
              "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            },
            body: `Message not sent successfully, becasue topic ARN not found`,
          };
          return response;
        }
      });
  } catch (err) {
    console.log("final error: ", err);
    const response = {
      statusCode: 401,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*", // Allow from anywhere
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: `Message not sent successfully`,
    };
    return response;
  }
};
