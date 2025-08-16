FROM php:8.2-fpm

# --------------------------
# OS + PHP Dependencies
# --------------------------
RUN apt-get update && apt-get install -y \
    git unzip zip curl \
    libpq-dev \
    python3 python3-pip python3-venv \
    && docker-php-ext-install pdo pdo_pgsql

# --------------------------
# Xdebug Installation
# --------------------------
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# Create xdebug.ini config
# Create xdebug.ini config
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
# Working Directory
# --------------------------
WORKDIR /var/www/html

# --------------------------
# Python: create and install in virtualenv
# --------------------------
COPY backend/python_requirements.txt .
RUN python3 -m venv /opt/venv \
 && /opt/venv/bin/pip install --no-cache-dir -r python_requirements.txt

# --------------------------
# Add virtualenv Python to PATH
# --------------------------
ENV PATH="/opt/venv/bin:$PATH"

# --------------------------
# PHP-FPM exposes port 9000 internally (Nginx connects to it)
# --------------------------
EXPOSE 9000

# --------------------------
# Start PHP-FPM
# --------------------------
CMD ["php-fpm"]
