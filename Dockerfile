FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json ./
RUN npm install

FROM dependencies AS app
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM dependencies AS builder
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS precommit
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv git \
  && python3 -m venv /opt/precommit-venv \
  && /opt/precommit-venv/bin/pip install --no-cache-dir pre-commit \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV PATH="/opt/precommit-venv/bin:$PATH"
CMD ["pre-commit", "run", "--all-files"]

FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
