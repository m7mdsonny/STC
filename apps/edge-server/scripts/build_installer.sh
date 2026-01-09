#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v pyinstaller >/dev/null 2>&1; then
  echo "[!] pyinstaller غير مثبت. ثبته عبر: pip install pyinstaller" >&2
  exit 1
fi

rm -rf dist build
pyinstaller edge_server.spec --noconfirm

if [ -f dist/edge_server/edge_server.exe ]; then
  echo "[+] تم إنشاء ملف edge_server.exe داخل dist/edge_server" 
elif [ -f dist/edge_server ]; then
  echo "[+] تم إنشاء حزمة edge_server في dist/edge_server"
fi
