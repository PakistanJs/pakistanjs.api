FROM node:alpine

#Install pm2 
RUN npm install pm2 -g

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 80

CMD ["pm2-docker", "server.js"]
