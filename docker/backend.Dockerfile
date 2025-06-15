FROM php:8.2-apache

# --------------------------
# OS + PHP Dependencies
# --------------------------
RUN apt-get update && apt-get install -y \
    git unzip zip curl \
    libpq-dev \
    python3 python3-pip python3-venv \
    && docker-php-ext-install pdo pdo_pgsql \
    && a2enmod rewrite

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
