FROM node:lts-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_API_AUTH_TOKEN
ARG VITE_COMPANY_ID
ARG VITE_NAPSA_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_AUTH_TOKEN=$VITE_API_AUTH_TOKEN
ENV VITE_COMPANY_ID=$VITE_COMPANY_ID
ENV VITE_NAPSA_BASE_URL=$VITE_NAPSA_BASE_URL

RUN npm run build

FROM node:lts-alpine AS runner

WORKDIR /app

RUN npm install -g serve

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

USER appuser

EXPOSE 3003
CMD ["serve", "-s", "dist", "-l", "3003"]