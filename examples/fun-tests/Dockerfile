FROM node:10.16.3-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    gcc 

COPY . /usr/src/app

RUN   npm install --production 

RUN   apk del build-dependencies

EXPOSE 8001

CMD npm run dev