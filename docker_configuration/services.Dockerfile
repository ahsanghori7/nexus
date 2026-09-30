# Might be worth versioning this base image at some point
ARG REGISTRY=""
FROM ${REGISTRY}services-base:latest
ARG SERVICE_NAME
ARG INSTALL_DEV_DEPENDENCIES=false

# Set the working directory inside the container
WORKDIR /var/www/html/${SERVICE_NAME}

# Custom PHP ini settings
RUN { \
        echo 'memory_limit = 1G'; \
        echo 'max_execution_time = 300'; \
        echo 'max_input_time = 300'; \
    } > /usr/local/etc/php/conf.d/custom.ini

# Remove default apache conf file
RUN rm /etc/apache2/sites-enabled/000-default.conf \
    # Create log folders
    && mkdir -p /var/log/apache2/var/www/html/${SERVICE_NAME}/

# Copy the composer files and install the dependencies.
# Separated so that only if there are changes in composer dependecies this step is run (not cached)
COPY composer.json composer.lock ./
RUN if [ "$INSTALL_DEV_DEPENDENCIES" = "true" ]; then \
        composer install -o; \
    else \
        composer install --no-dev -o; \
    fi

# Copy the rest of the application, consider .dockerignore to exclude files!
COPY --chown=www-data:www-data . ./

RUN mv /tmp/apache.conf.template docker/apache.conf.template && \
    mv /tmp/reset_db.sh docker/sql/reset_db.sh

# Run apache
EXPOSE 80
ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["apachectl", "-D", "FOREGROUND"]
