#!/bin/bash

# 进入目标目录
cd "$(pwd)/apps/dbagent/" 
echo $PWD
cp -r public .next/standalone/apps/dbagent
cp -r .next/static .next/standalone/apps/dbagent/.next/
cp local.db .next/standalone/apps/dbagent
cp .env.example .next/standalone/apps/dbagent/.env.local