FROM node:20-slim

WORKDIR /app

# Install OpenSSL 1.1 (required by Prisma)
RUN apt-get update && apt-get install -y libssl1.1 && rm -rf /var/lib/apt/lists/*

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
