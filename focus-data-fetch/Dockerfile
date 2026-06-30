FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

# Default: show help. Override with docker compose run ... npm run sync
CMD ["npm", "run", "explore"]
