# Node 层线上监控落地指南

本文提供一套可复制的 Node（Koa/Express）线上监控模板，覆盖 Metrics（指标）、Logs（日志）、Traces（链路），并附 Prometheus 告警规则与 Grafana 仪表模板。

## 能力概览
- 指标：进程/内存/事件循环/GC 默认指标 + HTTP 时延分布（直方图）
- 日志：结构化访问日志（包含 reqId），便于检索与关联
- 链路：OpenTelemetry 最小可用接入（HTTP/Koa 自动采集）
- 健康探针：/healthz（存活）、/readyz（就绪）

## 文件说明
- koa-monitor.ts：Koa 中间件与 /metrics 暴露示例
- express-monitor.ts：Express 中间件与 /metrics 暴露示例
- otel-init.ts：OpenTelemetry 初始化（HTTP/Koa 自动采集，OTLP 导出）
- prometheus-rules.yml：示例告警规则（可用性、性能、资源）
- grafana-dashboard.json：示例仪表（服务概览）

## 快速使用（示例）
1. 安装依赖（示例）：prom-client、pino、@opentelemetry/sdk-node 等（按需）
2. 在入口最早处调用 initTracing（若使用链路追踪）
3. 注册 metricsMiddleware/requestLogger，并挂载 /metrics、/healthz、/readyz
4. Prometheus 抓取 /metrics，Grafana 导入仪表；接入 Sentry/异常平台可选

## 注意事项
- 指标 label 避免高基数（不要直接使用 userId 等）
- 追踪与日志需控制开销：建议设置采样率与脱敏
- 告警阈值需结合各环境基线调优，避免噪声

更多背景与原理说明见主文档：
[interview-qa-zh.md](../interview-qa-zh.md)

