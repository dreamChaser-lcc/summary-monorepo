import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
// 可选：Koa/Express 对应的自动采集，按需开启
import { KoaInstrumentation } from 'opentelemetry-instrumentation-koa';
// import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

/**
 * 初始化 OpenTelemetry（在应用入口最早处调用）
 * - 导出到 OTLP HTTP（对接 Jaeger/Tempo/云厂商）
 * - 设置服务名与环境标签
 * - 生产环境请配置采样率/脱敏/资源标签
 */
export async function initTracing() {
  const exporter = new OTLPTraceExporter({
    url: process.env.OTLP_HTTP_URL, // 例如 http://otel-collector:4318/v1/traces
    headers: {}, // 若需要鉴权可在此注入
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'node-service',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'dev',
    }),
    traceExporter: exporter,
    instrumentations: [
      new HttpInstrumentation(),
      new KoaInstrumentation(),
      // new ExpressInstrumentation(),
    ],
  });

  await sdk.start();
}

