// Create clients and set shared const values outside of the handler.
// Create a DocumentClient that represents the query to add an item

const axios = require("axios");
/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
exports.putItemHandler = async (event) => {
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
  const smename = body.smeName;
  const customerName = body.custName;
  const smeEmail = body.smeEmail;
  const custEmail = body.custEmail;
  // Creates a new item, or replaces an old item with a new item
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  //https://bqiipakjza.execute-api.us-east-1.amazonaws.com/dev/charges

  return await axios
    .post(
      "https://1jvc56apqe.execute-api.us-east-2.amazonaws.com/Prod/cardPayment",
      {
        id: id,
        custName: customerName,
        smename: smename,
        smeEmail: smeEmail,
        custEmail: custEmail,
      }
    )
    .then(async (res) => {
      const response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Origin": "*", // Allow from anywhere
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        body: JSON.stringify({ message: "Payment done successfully" }),
      };
      return response;
    })
    .catch((e) => {
      console.log("API error::: ", e);
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
