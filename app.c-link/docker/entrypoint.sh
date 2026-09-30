#!/bin/bash

# Process the template .env. Important!!! Assumes workdir is properly set on Dockerfile!!!
if [ ! -f .env ]; then
    envsubst < docker/.env.template > .env
fi

a2enconf php-fpm

chmod 644 .env

# Create the temp folder that is on the PREQUALIFICATION_DOWNLOAD_FILES_FOLDER envvar
mkdir -p $PREQUALIFICATION_DOWNLOAD_FILES_FOLDER

chown www-data:www-data $PREQUALIFICATION_DOWNLOAD_FILES_FOLDER

php-fpm &

# Execute whatever command is passed from CMD
exec "$@"
