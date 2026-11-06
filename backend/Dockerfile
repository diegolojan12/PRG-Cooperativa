FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src/database.mjs ./src/database.mjs
COPY --from=build /app/prisma7.config.ts ./
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["sh", "-c", "node scripts/database.mjs && node dist/main.js"]
