#!/bin/sh
set -e

echo "Starting application..."
echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'no')"

# Run prisma db push to sync schema (works with driver adapters)
echo "Running Prisma db push to sync schema..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 || {
    echo "Warning: prisma db push failed, but continuing..."
}

echo "Starting server..."

# Start the application
exec node dist/index.js
