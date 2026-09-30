#!/bin/bash

# Load environment variables from .env file
source .env

echo "$SKIP_CONFIRMATION"
# Prompt user for confirmation
if [ "$SKIP_CONFIRMATION" != "true" ]; then
    read -p "This will reset the database $DB_NAME to a clean state. Are you sure? (y/n) " -n 1 -r
    echo    # move to a new line
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        exit 1
    fi
fi

# Function to wait for the MySQL server to be ready
wait_for_db() {
  local timeout=20
  while ! mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e 'select 1' >/dev/null 2>&1 && [ $timeout -gt 0 ]; do
    echo "MySQL is unavailable - sleeping"
    sleep 1
    ((timeout--))
  done

  if [ $timeout -eq 0 ]; then
    echo "MySQL is still unavailable after waiting for $initial_timeout seconds, exiting"
    exit 1
  fi

  echo "MySQL is up - executing command"
}

# Call the function to wait for the MySQL server
wait_for_db

# Check if the database exists
DB_EXIST=$(mysql -u $DB_USER -h $DB_HOST -p$DB_PASSWORD -e "SHOW DATABASES LIKE '$DB_NAME';")

# If the database doesn't exist, create it
if [ -z "$DB_EXIST" ]; then
    echo "Database $DB_NAME does not exist. Creating database..."
    mysql -u $DB_USER -h $DB_HOST -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
fi

# Get all tables in the database
TABLES=$(mysql -u $DB_USER -h $DB_HOST -p$DB_PASSWORD -D $DB_NAME -e 'SHOW TABLES;' | awk '{ print $1}' | grep -v '^Tables' )

# Start building the SQL command
SQL_COMMAND="SET FOREIGN_KEY_CHECKS = 0;"

# Add a DROP TABLE command for each table
for t in $TABLES; do
    SQL_COMMAND+=" DROP TABLE IF EXISTS $t;"
done

# Re-enable foreign key checks
SQL_COMMAND+=" SET FOREIGN_KEY_CHECKS = 1;"

echo "Cleaning DB"
# Execute MySQL command
echo $SQL_COMMAND | mysql -u $DB_USER -h $DB_HOST -p$DB_PASSWORD $DB_NAME

echo "Repopulating DB"
mysql -u $DB_USER -h $DB_HOST -p$DB_PASSWORD $DB_NAME < docker/sql/initial_db.sql
