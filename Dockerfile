FROM node:12-alpine

RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY package.json ./
RUN npm install
COPY tsconfig.json ormconfig.json wait.sh .env ./
COPY src ./src
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

EXPOSE 4000
CMD /wait && npm run start
