# TODO syntax=docker/dockerfile:1.7-labs  Does not seem to work
# For this feature: https://docs.docker.com/engine/reference/builder/#copy---parents

ARG SETASIGN_USERNAME
ARG SETASIGN_PASSWORD

FROM composer:2.8 AS composer

FROM php:8.1-apache-bookworm
# Install system dependencies, enable apache modules, and clean up apt cache.
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    software-properties-common \
    curl \
    gzip \
    less \
    libzip-dev \
    libonig-dev \
    libpng-dev \
    nano \
    npm \
    zip \
    gettext-base \
    jq \
    default-mysql-client \
    && a2enmod proxy proxy_http rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer /usr/bin/composer /usr/bin/composer

# Set the working directory inside the container
WORKDIR /var/www/html/framework

# Install Composer and PHP extensions in one step
RUN docker-php-ext-configure zip \
    && docker-php-ext-install zip pdo pdo_mysql mysqli mbstring gd

# Custom PHP ini settings
RUN { \
        echo 'memory_limit = 1G'; \
        echo 'max_execution_time = 300'; \
        echo 'max_input_time = 300'; \
    } > /usr/local/etc/php/conf.d/custom.ini


# Remove default apache conf file
RUN rm /etc/apache2/sites-enabled/000-default.conf \
    # Create log folders
    && mkdir -p /var/log/apache2/framework/

# Copy the composer files and install the dependencies.
# Separated so that only if there are changes in composer dependecies this step is run (steps cached)
COPY app.constants.php ./
COPY src/core/install.php ./src/core/
# TODO Check when this feature is available: https://docs.docker.com/engine/reference/builder/#copy---parents
#COPY --chown=www-data:www-data --parents src/*/composer.json src/*/composer.lock ./

COPY --chown=www-data:www-data src/core/composer.json src/core/composer.lock ./src/core/
COPY --chown=www-data:www-data src/supply_chain/composer.json src/supply_chain/composer.lock ./src/supply_chain/
COPY --chown=www-data:www-data src/prosper/composer.json src/prosper/composer.lock ./src/prosper/
COPY --chown=www-data:www-data src/admin/composer.json src/admin/composer.lock ./src/admin/
COPY --chown=www-data:www-data src/analytics/composer.json src/analytics/composer.lock ./src/analytics/
COPY --chown=www-data:www-data src/company_profile/composer.json src/company_profile/composer.lock ./src/company_profile/
COPY --chown=www-data:www-data src/cost_planning_tool/composer.json src/cost_planning_tool/composer.lock ./src/cost_planning_tool/
COPY --chown=www-data:www-data src/email/composer.json src/email/composer.lock ./src/email/
COPY --chown=www-data:www-data src/hubspot/composer.json src/hubspot/composer.lock ./src/hubspot/
COPY --chown=www-data:www-data src/prequalification/composer.json src/prequalification/composer.lock ./src/prequalification/
COPY --chown=www-data:www-data src/api/composer.json src/api/composer.lock ./src/api/

# Switch to `www-data` for application-specific tasks
RUN chown -R www-data:www-data /var/www/ /var/log/apache2/framework/ /etc/apache2/sites-enabled/ /etc/apache2/sites-available/

# Composer install, getting setasign credentials ready and removing afterwards to not leave it on the image
RUN mkdir -p ~/.composer/ && \
    echo "{\"http-basic\":{\"www.setasign.com\":{\"username\":\"${SETASIGN_USERNAME}\",\"password\":\"${SETASIGN_PASSWORD}\"}}}" > ~/.composer/auth.json && \
    for dir in /var/www/html/framework/src/*/; do \
      cd $dir && \
      composer install --no-dev -o; \
    done &&\
    rm ~/.composer/auth.json

## Copy the rest of the application, consider .dockerignore to exclude folders/files, like vendor folder!
COPY --chown=www-data:www-data . ./

# Run apache
EXPOSE 80
COPY docker docker
ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["apachectl", "-D", "FOREGROUND"]
