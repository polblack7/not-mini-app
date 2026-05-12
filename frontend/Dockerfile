FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_TENDERLY_WALLET
ARG VITE_TENDERLY_TOKEN
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TENDERLY_WALLET=$VITE_TENDERLY_WALLET
ENV VITE_TENDERLY_TOKEN=$VITE_TENDERLY_TOKEN

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
