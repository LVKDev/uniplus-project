FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install \
  && npm install prisma@5.18.0 --save-dev

COPY src ./src
COPY README.md ./
COPY scripts/start.sh ./scripts/start.sh

RUN chmod +x ./scripts/start.sh

ENV NODE_ENV=production
EXPOSE 3000

CMD ["./scripts/start.sh"]
