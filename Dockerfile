FROM davidzhangbj/nodejs:v0.1 AS base
COPY apps/dbagent/.next/standalone /app/
WORKDIR /app/apps/dbagent
ENV HOSTNAME='0.0.0.0'
ENV PORT=8000
EXPOSE 8000
CMD ["node", "server.js"] 
