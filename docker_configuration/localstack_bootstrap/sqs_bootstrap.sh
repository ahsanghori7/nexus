#!/usr/bin/bash

set -euo pipefail

# Use the AWS_REGION from the environment variables passed by Docker Compose
AWS_REGION=${DEFAULT_REGION:-"eu-west-2"}

create_queue() {
    local QUEUE_NAME=$1
    local ATTRIBUTES=$2
    # Creating the queue and fetching the Queue URL directly
    local QUEUE_URL=$(awslocal sqs create-queue --queue-name ${QUEUE_NAME} --region ${AWS_REGION} --attributes "${ATTRIBUTES}" --query 'QueueUrl' --output text)
    # Fetching the queue ARN using the Queue URL
    local QUEUE_ARN=$(awslocal sqs get-queue-attributes --queue-url ${QUEUE_URL} --attribute-names QueueArn --region ${AWS_REGION} --query 'Attributes.QueueArn' --output text)
    echo "${QUEUE_ARN}"
}

MAIN_QUEUE_NAME=${SQS_QUEUE_NAME:-"default_main_queue"}
DLQ_NAME=${SQS_DLQ_NAME:-"default_dlq"}

# Creating the DLQ and retrieving its ARN
echo "Creating Dead Letter Queue: ${DLQ_NAME}"
DLQ_ARN=$(create_queue "${DLQ_NAME}" '{"VisibilityTimeout":"30"}')

# Constructing the Redrive Policy using the DLQ ARN
MAIN_QUEUE_ATTRIBUTES="{\"VisibilityTimeout\":\"30\", \"RedrivePolicy\":\"{\\\"maxReceiveCount\\\":\\\"5\\\", \\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\"}\"}"

# Creating the main queue with the Redrive Policy
echo "Creating Main Queue with DLQ setup: ${MAIN_QUEUE_NAME}"
create_queue "${MAIN_QUEUE_NAME}" "${MAIN_QUEUE_ATTRIBUTES}"
