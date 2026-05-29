## Builder
FROM node:24.13.1-alpine AS builder

WORKDIR /src

COPY .npmrc package.json package-lock.json /src/
RUN npm ci
COPY . /src/
ENV NODE_OPTIONS=--max_old_space_size=4096
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_DT_API_URL
ENV VITE_DT_API_URL=$VITE_DT_API_URL
ARG VITE_DT_WEB_URL
ENV VITE_DT_WEB_URL=$VITE_DT_WEB_URL
RUN npm run build
RUN npm run build


## App
FROM nginx:1.29.8-alpine

COPY --from=builder /src/dist /app
COPY --from=builder /src/docker-nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html \
  && ln -s /app /usr/share/nginx/html