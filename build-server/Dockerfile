FROM ubuntu:focal

RUN apt-get update && \
    apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

RUN apt-get install git -y

RUN mkdir /home/app

WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

RUN chmod +x main.sh && \
    chmod +x script.js

ENTRYPOINT [ "bash", "./main.sh" ]