#!/usr/bin/env bash
# Builds and starts the whole project in Docker:
# MySQL, MongoDB, Laravel API (composer install, migrate, seed), queue worker,
# audit service (npm ci) and the dashboard (npm ci, build).
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker Desktop first: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but not running. Start Docker Desktop and run this script again."
  exit 1
fi

if [ ! -f .env ]; then
  secret=$(od -An -tx1 -N32 /dev/urandom | tr -d ' \n')
  cat > .env <<EOF
AUDIT_SECRET=$secret
API_PORT=8000
FRONTEND_PORT=5173
AUDIT_PORT=4000
MYSQL_PORT=3307
MONGO_PORT=27017
EOF
  echo "Created .env with a new shared secret."
fi

# values already set in the shell win over .env, the same way docker compose handles them
while IFS='=' read -r key value; do
  case "$key" in ''|\#*) continue ;; esac
  if [ -z "${!key:-}" ]; then
    export "$key=$value"
  fi
done < .env

echo "Building and starting containers (the first run takes a few minutes)..."
docker compose --profile app up -d --build

echo "Waiting for the API and the dashboard..."
for _ in $(seq 1 120); do
  if curl -fs "http://localhost:${API_PORT}/up" >/dev/null 2>&1 \
    && curl -fs "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1; then
    echo
    echo "Ready."
    echo "  Dashboard:     http://localhost:${FRONTEND_PORT}"
    echo "  Public form:   http://localhost:${FRONTEND_PORT}/request-quote"
    echo "  API:           http://localhost:${API_PORT}/api"
    echo "  Audit service: http://localhost:${AUDIT_PORT}"
    echo
    echo "  Logins (password: password): admin@comtanix.test, staff1@comtanix.test, staff2@comtanix.test"
    echo
    echo "  Stop with:  docker compose --profile app down"
    exit 0
  fi
  sleep 5
done

echo "The services did not become ready in time. Check the logs with: docker compose --profile app logs api"
exit 1
