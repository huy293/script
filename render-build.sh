#!/usr/bin/env bash

set -o errexit  # Dừng script khi có lỗi

# Cài đặt dependencies
npm install

# Nếu cần build dự án thì bỏ comment dòng này
# npm run build

# Đảm bảo thư mục cache của Puppeteer tồn tại
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Cài Puppeteer và tải Chrome
npx puppeteer browsers install chrome

# Tạo thư mục đích nếu chưa có
DEST_CACHE_DIR=/opt/render/project/src/.cache/puppeteer/chrome
mkdir -p $DEST_CACHE_DIR

# Lưu cache Puppeteer vào build cache
echo "...Storing Puppeteer Cache in Build Cache"
cp -R $PUPPETEER_CACHE_DIR/chrome/ $DEST_CACHE_DIR
