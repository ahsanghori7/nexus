#!/bin/sh


# Process the template .env. Important!!! Assumes workdir is properly set on Dockerfile!!!
if [ ! -f .env ]; then
    envsubst < docker/.env.template > .env
fi
envsubst < docker/apache.conf.template > /etc/apache2/sites-available/document_service.conf

# Replace the access and error log paths dynamically to send logs to CloudWatch (stdout and stderr)
sed -i "s|CustomLog .*|CustomLog \"/proc/self/fd/1\" combined|" /etc/apache2/sites-available/document_service.conf
sed -i "s|ErrorLog .*|ErrorLog \"/proc/self/fd/2\"|" /etc/apache2/sites-available/document_service.conf

if [ -n "${NEW_RELIC_LICENSE_KEY}" ] && [ -n "${NEW_RELIC_APP_NAME}" ]; then \
        echo "NEW RELIC IS ENABLED"; \
        sed -i \
        -e "s/newrelic.license[[:space:]]*=[[:space:]]*.*/newrelic.license = ${NEW_RELIC_LICENSE_KEY}/" \
        -e "s/newrelic.appname[[:space:]]*=[[:space:]]*.*/newrelic.appname = ${NEW_RELIC_APP_NAME}/" \
        -e "\$a newrelic.daemon.address=newrelic-php-daemon:31339" \
        /usr/local/etc/php/conf.d/newrelic.ini; \
else \
        echo "NEW RELIC IS NOT ENABLED"; \
        rm -f /usr/local/etc/php/conf.d/newrelic.ini
fi

a2ensite document_service.conf
a2enmod headers
# Ensure www-data owns the .env and apache conf files
chown www-data:www-data /etc/apache2/sites-available/document_service.conf /etc/apache2/sites-enabled/document_service.conf
chmod 644 .env

php-fpm &

# Execute whatever command is passed from CMD
exec "$@"
