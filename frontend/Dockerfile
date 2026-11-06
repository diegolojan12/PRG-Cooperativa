FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM caddy:2-alpine
COPY --from=build /app/dist/frontend/browser /srv