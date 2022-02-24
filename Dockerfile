FROM node:17.5.0

WORKDIR /usr/src/app
COPY . /usr/src/app

RUN npm install

CMD ["npm", "start"]
