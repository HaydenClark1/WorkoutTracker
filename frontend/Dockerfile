FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --silent

COPY . .

EXPOSE 53715

CMD ["npm", "run", "dev", "--", "--host"]
