import boto3
import os
import requests
import tqdm


dynamo_client  =  boto3.resource(service_name = 'dynamodb',region_name = 'us-east-1',
              aws_access_key_id = 'AKIAQGDMQGCMOJ4SVO5E',
              aws_secret_access_key = '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')
dynamo_client.get_available_subresources()
product_table = dynamo_client.Table('users')
users = product_table.table_status
response = product_table.scan()
data = response['Items']
print(response)

while 'LastEvaluatedKey' in response:
    response = product_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
    u = data.extend(response['Items'])
    print(u)
