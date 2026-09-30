#!/bin/bash

# Process the template .env. Important!!! Assumes workdir is properly set on Dockerfile!!!
if [ ! -f .env ]; then
    envsubst < docker/.env.template > .env
fi

# Create the mPDF temp folder used by PDFMiddleware (document.save.tmp/mpdf)
mkdir -p /var/tmp/mpdf
chown www-data:www-data /var/tmp/mpdf

# WORKER_MODE: skip Apache setup, run Supercronic with crontab from SSM
if [ "${WORKER_MODE}" = "true" ]; then
    chmod 644 .env
    chmod -R 777 /var/www/html/framework/src/core/vendor/mpdf/mpdf/tmp

    aws ssm get-parameter \
      --name "/rbt/framework/worker_crontab" \
      --query 'Parameter.Value' \
      --output text \
      --region eu-west-2 > /tmp/worker-crontab

    supercronic /tmp/worker-crontab &
    SUPERCRONIC_PID=$!

    while kill -0 $SUPERCRONIC_PID 2>/dev/null; do
        sleep 60
        aws ssm get-parameter \
          --name "/rbt/framework/worker_crontab" \
          --query 'Parameter.Value' \
          --output text \
          --region eu-west-2 > /tmp/new-crontab
        if ! diff -q /tmp/worker-crontab /tmp/new-crontab > /dev/null 2>&1; then
            cp /tmp/new-crontab /tmp/worker-crontab
            kill -HUP $SUPERCRONIC_PID
        fi
    done
    exit 0
fi

for dir in src/*; do
    # Check if it's a directory
    if [ -d "$dir" ] && [ "$dir" != "src/core" ]; then
      # Construct the URL environment variable name
      app="${dir#src/}"  # remove 'src/'
      server_name_var_name="APACHE_${app^^}_SERVER_NAME"  # ^^ Converts to uppercase
      # Extract the URL from the environment
      server_name="${!server_name_var_name}"
      export APACHE_SERVER_NAME="$server_name"
      export APACHE_APP="$app"

      # Use envsubst to generate the Apache config
      envsubst < docker/apache_framework_template.conf > "/etc/apache2/sites-available/${app}.conf"

      # Enable site
      a2ensite ${app}.conf
    fi
done

a2enmod headers

# Ensure www-data owns the .env and apache conf files
chown www-data:www-data /etc/apache2/sites-available/* /etc/apache2/sites-enabled/*
chmod 644 .env
## TODO: To check the proper permission for tmp to work with mPDF
chmod -R 777 /var/www/html/framework/src/core/vendor/mpdf/mpdf/tmp

# Execute whatever command is passed from CMD
exec "$@"
