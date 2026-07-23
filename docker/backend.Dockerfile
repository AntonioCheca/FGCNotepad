FROM php:8.2-fpm

# --------------------------
# OS + PHP Dependencies
# --------------------------
RUN apt-get update && apt-get install -y \
    git unzip zip curl \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# --------------------------
# Create user with same UID as host user
# --------------------------
ARG USER_ID=1000
ARG GROUP_ID=1000
RUN groupmod -g ${GROUP_ID} www-data && \
    usermod -u ${USER_ID} -g www-data www-data

# --------------------------
# Xdebug Installation
# --------------------------
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

RUN echo "zend_extension=xdebug.so" > /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
 && echo "xdebug.mode=debug" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
 && echo "xdebug.start_with_request=trigger" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
 && echo "xdebug.client_host=host.docker.internal" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
 && echo "xdebug.client_port=9003" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
 && echo "xdebug.log=/tmp/xdebug.log" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# --------------------------
# Composer
# --------------------------
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# --------------------------
# Working Directory & Permissions
# --------------------------
WORKDIR /var/www/html
RUN chown -R www-data:www-data /var/www/html

# --------------------------
# Switch to www-data user
# --------------------------
USER www-data

EXPOSE 9000
CMD ["php-fpm"]
