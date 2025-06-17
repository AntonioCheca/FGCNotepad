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

# Start PHP-FPM (default entrypoint)
CMD ["php-fpm"]
