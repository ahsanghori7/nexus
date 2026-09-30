FROM composer:2.6.5 AS composer

FROM php:7.4-fpm

# Update and install security packages - without holding them
RUN apt-get update && apt-get dist-upgrade -y && \
    apt-get install -y --only-upgrade \
        curl \
        libkrb5-3 \
        libglib2.0-0 \
        libtasn1-6 \
        git \
        gstreamer1.0-0 \
        libexpat1 \
        python3.9 && \
    apt-get update && \
    apt-get install -y \
        apache2 \
        libapache2-mod-fcgid \
        software-properties-common \
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
        default-mysql-client && \
    a2enmod proxy && \
    a2enmod proxy_fcgi && \
    a2enmod rewrite && \
    a2enmod proxy_http && \
    rm -rf /var/lib/apt/lists/*

COPY --from=composer /usr/bin/composer /usr/bin/composer

# Install Composer and PHP extensions in one step
RUN docker-php-ext-configure zip \
    && docker-php-ext-install zip pdo pdo_mysql mysqli mbstring gd

COPY apache/apache_template.conf /tmp/apache.conf.template
COPY reset_services_db.sh /tmp/reset_db.sh

# Custom PHP ini
RUN cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini && \
        sed -i -e "s/^ *disable_functions.*/disable_functions = pcntl_alarm,pcntl_fork,pcntl_waitpid,pcntl_wait,pcntl_wifexited,pcntl_wifstopped,pcntl_wifsignaled,pcntl_wifcontinued,pcntl_wexitstatus,pcntl_wtermsig,pcntl_wstopsig,pcntl_signal,pcntl_signal_get_handler,pcntl_signal_dispatch,pcntl_get_last_error,pcntl_strerror,pcntl_sigprocmask,pcntl_sigwaitinfo,pcntl_sigtimedwait,pcntl_exec,pcntl_getpriority,pcntl_setpriority,pcntl_async_signals,pcntl_unshare/g" /usr/local/etc/php/php.ini && \
        sed -i -e "s/^ *expose_php.*/expose_php = Off/g" /usr/local/etc/php/php.ini && \
        sed -i -e "s/^ *post_max_size.*/post_max_size = 100M/g" /usr/local/etc/php/php.ini && \
        sed -i -e "s/^ *upload_max_filesize.*/upload_max_filesize = 50M/g" /usr/local/etc/php/php.ini && \
        sed -i -e "s/^ *session.gc_probability.*/session.gc_probability = 0/g" /usr/local/etc/php/php.ini

# NEW RELIC
ARG NEW_RELIC_AGENT_VERSION="11.7.0.21"

RUN curl -L https://download.newrelic.com/php_agent/archive/${NEW_RELIC_AGENT_VERSION}/newrelic-php5-${NEW_RELIC_AGENT_VERSION}-linux.tar.gz | tar -C /tmp -zx \
    && export NR_INSTALL_USE_CP_NOT_LN=1 \
    && export NR_INSTALL_SILENT=1 \
    && /tmp/newrelic-php5-${NEW_RELIC_AGENT_VERSION}-linux/newrelic-install install \
    && rm -rf /tmp/newrelic-php5-* /tmp/nrinstall*
