FROM davidzhangbj/nodejs:v0.1 AS base
ENV TZ=Asia/Shanghai
RUN npm install -g pnpm@^10
COPY . /app/
WORKDIR /app/apps/dbagent
ENV PORT 8000
EXPOSE 8000
# Start both the scheduler and the Next.js application
CMD ["sh", "-c", "pnpm dev-scheduler & pnpm next start --port $PORT"]
