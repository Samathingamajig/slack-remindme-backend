FROM node:lts-alpine

RUN mkdir -p /usr/app
WORKDIR /usr/app

# Add docker-compose-wait tool -------------------
ENV WAIT_VERSION 2.7.2
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/$WAIT_VERSION/wait /wait
RUN chmod +x /wait

COPY package.json ./
RUN npm install
COPY tsconfig.json ormconfig.js wait.sh .env ./
COPY src ./src

EXPOSE 4000
CMD /wait && npm run start
