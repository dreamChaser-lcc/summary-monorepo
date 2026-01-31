#!/usr/bin/env bash
set -euo pipefail

echo "检测 wasm-pack..."
if ! command -v wasm-pack >/dev/null 2>&1; then
  echo "未检测到 wasm-pack。请参考 https://rustwasm.github.io/wasm-pack/installer/ 安装后重试。"
  exit 1
fi

echo "构建 rust-math 模块（目标：web）..."
pushd rust-math >/dev/null
wasm-pack build --target web --out-dir ../pkg
popd >/dev/null

echo "构建完成。请直接打开 index.html（无需启动本地服务）。"

