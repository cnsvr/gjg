FROM node:latest

# create root application folder
WORKDIR /app


# copy configs to /app folder
COPY package.json ./
COPY tsconfig.json ./
COPY swagger.json ./
# copy source code to /app/src folder
COPY src /app/src

RUN npm install --s

EXPOSE 8000

CMD [ "npm", "start" ]