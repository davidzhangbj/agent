# Use Node.js 22 as the base image
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
COPY . /app/
WORKDIR /app/apps/dbagent
# Start both the scheduler and the Next.js application
CMD ["sh", "-c", "pnpm drizzle-kit migrate && (pnpm tsx scripts/scheduler.ts & pnpm next start --port $PORT)"] 