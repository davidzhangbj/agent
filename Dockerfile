FROM davidzhangbj/nodejs:v0.1 AS base
ENV TZ=Asia/Shanghai
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
COPY . /app/
WORKDIR /app/apps/dbagent
ENV PORT 8000
EXPOSE 8000
# Start both the scheduler and the Next.js application
CMD ["sh", "-c", "pnpm tsx scripts/scheduler.ts & pnpm next start --port $PORT"]
