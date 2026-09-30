#!/usr/bin/env bash

# Document Creator S3 Upload Script
set -euo pipefail

# Configuration
SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
ENV_FILE="$PROJECT_ROOT/.env"
SOURCE_DIR="document-creator"
UPLOAD_WINDOW_MINUTES=5

set -a
source "$ENV_FILE"
set +a

# Setup AWS credentials
export AWS_ACCESS_KEY_ID="${AWS_S3_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${AWS_S3_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="${AWS_S3_REGION:-eu-west-2}"



# Find recently modified files
modified_files=$(find "$SOURCE_DIR" -type f -name "*.json" -mmin -"$UPLOAD_WINDOW_MINUTES" 2>/dev/null)

if [ -z "$modified_files" ]; then
    exit 0
fi

# Upload files to S3
upload_count=0
success_count=0
failed_files=()

while IFS= read -r file; do
    [ -z "$file" ] && continue

    upload_count=$((upload_count + 1))
    relative_path="${file#document-creator/}"
    s3_destination="s3://${AWS_S3_ASSET_PATH}${relative_path}"

    if aws s3 cp "$file" "$s3_destination" --quiet; then
        success_count=$((success_count + 1))
    else
        failed_files+=("$file")
    fi
done <<< "$modified_files"


# Send SNS notification if configured
if [ -n "${AWS_SNS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SNS_SECRET_ACCESS_KEY:-}" ] && [ -n "${AWS_SNS_FUE_TOPIC_URL:-}" ]; then

    # Switch to SNS credentials
    export AWS_ACCESS_KEY_ID="$AWS_SNS_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$AWS_SNS_SECRET_ACCESS_KEY"

    # Send notification
    if [ "$success_count" -gt 0 ]; then
        message="Document Creator Upload: $success_count/$upload_count files uploaded to s3://${AWS_S3_ASSET_PATH} at $(date)"
        aws sns publish --topic-arn "$AWS_SNS_FUE_TOPIC_URL" --message "$message" --subject "S3 Upload Success" --region "$AWS_DEFAULT_REGION" --output text > /dev/null 2>&1;
    fi

    if [ ${#failed_files[@]} -gt 0 ]; then
        failure_message="Document Creator Upload Failed: ${#failed_files[@]} files failed to upload at $(date)"
        aws sns publish --topic-arn "$AWS_SNS_FUE_TOPIC_URL" --message "$failure_message" --subject "S3 Upload Failed" --region "$AWS_DEFAULT_REGION" --output text > /dev/null 2>&1
    fi
fi
