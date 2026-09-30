#!/bin/bash

# Should be setup in cron 'crontab -e' like:
# 0 6 * * * /bin/bash /opt/nexus/scripts/db_migration.sh > /opt/nexus/scripts/migration_log.log 2>&1
# This would run it every day at 6 in the morning

# Determine the directory where the script is located
SCRIPT_DIR=$(dirname "$0")

# Source the .env file from the same directory as the script
set -a  # Automatically export all variables
source "$SCRIPT_DIR/.env"
set +a  # Stop automatically exporting

# Define the Slack webhook URL and the channel
WEBHOOK_URL=$SLACK_WEBHOOK_URL
CHANNEL="devops"

# Function to send message to Slack
send_slack_notification() {
    local status="$1"
    local message="$2"
    curl -X POST -H 'Content-type: application/json' --data "{
        \"channel\": \"#${CHANNEL}\",
        \"username\": \"migration-bot\",
        \"attachments\": [
            {
                \"color\": \"$3\",
                \"fields\": [
                    {
                        \"title\": \"Migration Status\",
                        \"value\": \"${status}\",
                        \"short\": false
                    },
                    {
                        \"title\": \"Message\",
                        \"value\": \"${message}\",
                        \"short\": false
                    }
                ]
            }
        ]
    }" $WEBHOOK_URL
}

# Navigate to the nexus directory
cd /opt/nexus

# Run the make commands and capture the output
if make db_migrate_all; then
    message="DB Migration on UAT successful: $(date)"
    color="#36a64f" # Green color for success
    status="Success"
else
    message="DB Migration on UAT failed: $(date)"
    color="#ff0000" # Red color for failure
    status="Failure"
fi

# Send notification to Slack
send_slack_notification "$status" "$message" "$color"
