FROM node:20-alpine

WORKDIR /app
COPY package.json /app/package.json
RUN npm install

COPY . /app

ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["npm", "run", "dev"]

