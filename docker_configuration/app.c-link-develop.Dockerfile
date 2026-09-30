ARG REGISTRY=""
FROM php:8-fpm
ARG GITHUB_TOKEN

WORKDIR /var/www/html/app.c-link

# Install dependencies
RUN apt-get update && apt-get install -y curl unzip git && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer


RUN apt-get update && apt-get dist-upgrade -y && \
    apt-get install -y \
    qpdf \
    libfreetype6-dev libjpeg62-turbo-dev libpng-dev \
    libzip-dev zip unzip \
    ghostscript \
    libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd zip intl

# Install Apache and required PHP modules
RUN apt-get update && apt-get install -y \
    apache2 \
    libapache2-mod-fcgid \
    && rm -rf /var/lib/apt/lists/*


RUN rm -f /etc/apache2/sites-available/000-default.conf

RUN { \
    echo '<VirtualHost *:80>'; \
    echo '    ServerAdmin robmaster@localhost'; \
    echo '    DocumentRoot /var/www/html/app.c-link/public'; \
    echo '    ErrorLog ${APACHE_LOG_DIR}/error.log'; \
    echo '    CustomLog ${APACHE_LOG_DIR}/access.log combined'; \
    echo '    <Directory /var/www/html/app.c-link/public/>'; \
    echo '        AllowOverride All'; \
    echo '        Require all granted'; \
    echo '    </Directory>'; \
    echo '    <FilesMatch "\.php$">'; \
    echo '         SetHandler "proxy:fcgi://127.0.0.1:9000"'; \'; \
    echo '    </FilesMatch>'; \
    echo '</VirtualHost>'; \
} > /etc/apache2/sites-available/000-default.conf

RUN a2enmod proxy_fcgi
RUN a2enmod rewrite

## PHP FPM configuration
COPY docker/www.conf /usr/local/etc/php-fpm.d/www.conf

# Custom PHP ini settings, need to review based on move to fmp
RUN { \
        echo 'memory_limit = 1G'; \
        echo 'max_execution_time = 300'; \
        echo 'max_input_time = 300'; \
    } > /usr/local/etc/php/conf.d/custom.ini

# Remove default apache conf file
RUN mkdir -p /var/log/apache2/var/www/html/app.c-link/ app/log && \
    touch app/log/log.txt && \
    chown -R www-data:www-data app/log

# Copy the composer files and install the dependencies.
# Separated so that only if there are changes in composer dependecies this step is run (not cached)
COPY composer-develop.json ./
RUN git config --global http.postBuffer 524288000
RUN echo "{\"github-oauth\":{\"github.com\":\"${GITHUB_TOKEN}\"}}" > ~/.composer/auth.json && \
    COMPOSER=composer-develop.json composer install --no-dev -o && \
    chown -R www-data:www-data vendor/mpdf/mpdf/tmp && \
    rm ~/.composer/auth.json

# Copy the rest of the application, consider .dockerignore to exclude files!
COPY --chown=www-data:www-data . ./

# Run apache
EXPOSE 80
ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["apachectl", "-D", "FOREGROUND"]
