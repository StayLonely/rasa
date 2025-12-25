FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Актуальные типы для React
RUN npm install --save-dev @types/react@latest @types/react-dom@latest

COPY . .

RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]