# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

ENV NODE_ENV=production

# Install Yarn v4 via npm
RUN npm install -g yarn@4.12.0 && \
    yarn config set nodeLinker node-modules && \
    yarn --version

# Build stage
FROM base AS build

# Install build tools
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --immutable

# Copy application code
COPY . .

# Build app
RUN yarn build

# Final stage
FROM base

# Copy built app
COPY --from=build /app /app

EXPOSE 3000

CMD ["yarn", "start"]
