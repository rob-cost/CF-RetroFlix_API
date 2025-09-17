FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .    

ENV PORT=8080
ENV CONNECTION_URI=

EXPOSE 8080

CMD ["npm", "start"]