FROM node:18
WORKDIR /recorder
COPY package-lock.json package-lock.json
COPY package.json package.json
RUN npm install
COPY src src
COPY tsconfig.json tsconfig.json
RUN npm run build
WORKDIR /recorder
COPY .envdocker .env
CMD npm start
