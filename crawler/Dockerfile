FROM node:20-bookworm

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src ./src

RUN npx playwright install --with-deps chromium

EXPOSE 3100

CMD ["npm", "start"]
