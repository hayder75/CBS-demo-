#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
if [ -f backend/.env ]; then
  set -a
  . backend/.env
  set +a
fi
exec mvn -f backend/pom.xml spring-boot:run
