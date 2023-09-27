FROM node:18
WORKDIR /recorder
COPY . .
RUN npm install
RUN npm run build
WORKDIR /recorder
COPY .envdocker .env
CMD npm start