FROM node:18-alpine AS notifications

WORKDIR /app

COPY package*.json ./
COPY . ./

RUN npm install && npm run build
EXPOSE 3000

CMD ["npm", "start"]
