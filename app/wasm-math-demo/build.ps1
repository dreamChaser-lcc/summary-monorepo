$ErrorActionPreference = "Stop"

Write-Host "检测 wasm-pack..."
if (-not (Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
  Write-Error "未检测到 wasm-pack。请参考 https://rustwasm.github.io/wasm-pack/installer/ 安装后重试。"
  exit 1
}

Write-Host "构建 rust-math 模块（目标：web）..."
Push-Location "rust-math"
wasm-pack build --target web --out-dir ../pkg
Pop-Location

Write-Host "构建完成。请直接打开 index.html（无需启动本地服务）。"

