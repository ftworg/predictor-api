FROM nikolaik/python-nodejs:latest

WORKDIR '/app'

COPY ./package.json ./

RUN npm install

COPY ./ ./

ARG jwtKey

ENV tp_jwtPrivateKey=$jwtKey

CMD [ "npm", "start" ]