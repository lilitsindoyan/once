#!/bin/sh
# Vercel build — runs automatically on every push (Vercel prefers "vercel-build" over "build").
# Production deploys (pushes to main) apply pending database migrations first.
# Preview deploys (other branches) never touch the database schema.
set -e
npx prisma generate
if [ "$VERCEL_ENV" = "production" ]; then
  echo "Production deploy: applying database migrations"
  npx prisma migrate deploy
else
  echo "Preview deploy ($VERCEL_ENV): skipping migrations"
fi
npx next build
