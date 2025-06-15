FROM node:20

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN npm install

# Default to dev mode; override command in Compose if needed
COPY frontend .

EXPOSE 3000

CMD ["npm", "run", "dev"]
