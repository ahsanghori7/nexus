FROM php:8.1-apache-bookworm
RUN mkdir -p /home/repos
RUN apt-get update && apt-get install -y \
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
    && rm -rf /var/lib/apt/lists/*

# Enable apache modules.
RUN a2enmod proxy
RUN a2enmod proxy_http
RUN a2enmod rewrite

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install PHP extensions
RUN docker-php-ext-configure zip \
    && docker-php-ext-install zip \
    && docker-php-ext-install pdo \
    && docker-php-ext-install pdo_mysql \
    && docker-php-ext-install mysqli

RUN docker-php-ext-install mbstring
RUN docker-php-ext-install gd

# Custom PHP ini
RUN cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini && \
        sed -i -e "s/^ *memory_limit.*/memory_limit = 1G/g" /usr/local/etc/php/php.ini && \
        sed -i -e "s/^ *max_execution_time.*/max_execution_time = 300/g" /usr/local/etc/php/php.ini && \
        sed -i -e "s/^ *max_input_time.*/max_input_time = 300/g" /usr/local/etc/php/php.ini

COPY apache/proxy/* /etc/apache2/sites-available/
COPY apache/proxy/* /etc/apache2/sites-enabled/
# Run apache
EXPOSE 80
CMD ["apachectl", "-D", "FOREGROUND"]
