FROM node:20

WORKDIR /app

# Don't install dependencies during build
# Don't copy source code during build

EXPOSE 3000

# Just keep the container running
CMD ["tail", "-f", "/dev/null"]
