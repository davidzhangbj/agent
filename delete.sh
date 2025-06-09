#!/bin/bash

# 进入目标目录
cd "$(pwd)/node_modules/.pnpm" 
echo $PWD

# 定义要删除的文件或目录的列表
files=( 
  "onnxruntime-node@1.21.0"
  "turbo-linux-64@2.5.4"
  "typescript@5.8.3"
  "@img+sharp-libvips-linux-x64@1.1.0"
  "@img+sharp-libvips-linuxmusl-x64@1.1.0"
  "react-icons@5.5.0_react@19.1.0"
  "@fluentui+react-icons@2.0.302_react@19.1.0"
  "lucide-react@0.501.0_react@19.1.0"
  "mastra@0.4.9_@opentelemetry+api@1.9.0_openapi-types@12.1.3_react@19.1.0_typescript@5.8.3"
  "@aws-sdk+client-sagemaker@3.824.0"
  "lightningcss-linux-x64-musl@1.30.1"
  "lightningcss-linux-x64-gnu@1.30.1"
  "prettier@3.5.3"
  "prettier-plugin-tailwindcss@0.6.12_prettier-plugin-organize-imports@4.1.0_prettier@3.5._3ec8cd114d0de7bffc034e88cef72748"
  "@google-cloud+monitoring@5.2.0"
  "react-syntax-highlighter@15.6.1_react@19.1.0"
  "@aws-sdk+client-rds@3.787.0"
  "onnxruntime-web@1.22.0-dev.20250409-89f8206ba4"
  "@fluentui+react-icons@2.0.298_react@19.1.0"
  "@huggingface+transformers@3.5.1"
  "date-fns@3.6.0"
  "turbo-linux-64@2.5.3"
  "cohere-ai@7.17.1"
  "@aws-sdk+client-sagemaker@3.806.0"
  "lightningcss-linux-x64-gnu@1.29.2"
  "lightningcss-linux-x64-musl@1.29.2"
  "react-syntax-highlighter@15.5.0_react@19.1.0"
  "es-abstract@1.23.9"
  "web-streams-polyfill@3.3.3"
  "@google-cloud+monitoring@5.0.1"
  "@opentelemetry+semantic-conventions@1.28.0"
  "recharts@2.15.3_react-dom@19.1.0_react@19.1.0__react@19.1.0"
  "@google-cloud+logging@11.2.0"
  "@typescript-eslint+eslint-plugin@8.32.0_@typescript-eslint+parser@8.32.0_eslint@9.26.0__e949c46e110888b51ed6bdd24eab2bc9"
  "@anush008+tokenizers-linux-x64-gnu@0.0.0"
  "prettier-plugin-tailwindcss@0.6.11_prettier-plugin-organize-imports@4.1.0_prettier@3.5._ca0bd85965d78b6d75dab0941cec6c1c"
  "eslint@9.26.0_jiti@2.4.2"
  "compromise@14.14.4"
  "google-gax@5.0.1-rc.1"
  "google-gax@4.6.0"
  "@babel+types@7.27.1"
  "axe-core@4.10.3"
  "@types+node@22.15.17"
  "eslint-plugin-react@7.37.5_eslint@9.26.0_jiti@2.4.2_"
  "@aws-sdk+client-cloudwatch@3.787.0"
  "tar@7.4.3"
  "eslint-plugin-import@2.31.0_@typescript-eslint+parser@8.32.0_eslint@9.26.0_jiti@2.4.2___3ab30d1f7e16e4de2b7dac550d58b58c"
  "@babel+helpers@7.27.1"
  "litellm-api@0.0.3"
  "preact@10.11.3"
  "@googleapis+sqladmin@27.0.0"
  "@smithy+types@4.2.0"
  "eslint-plugin-jsx-a11y@6.10.2_eslint@9.26.0_jiti@2.4.2_"
  "@aws-sdk+nested-clients@3.806.0"
)


# 循环遍历文件列表并删除它们
for file in "${files[@]}"; do
  if [ -e "$file" ]; then
    echo "删除: $file"
    rm -rf "$file"  # 使用 -rf 强制删除目录和文件
  else
    echo "文件不存在: $file"
  fi
done

echo "删除完成."

