import express from 'express';
import client from 'prom-client';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// 收集默认指标
client.collectDefaultMetrics();

const httpDuration = new client.Histogram({
  name: 'http_server_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

/**
 * 访问日志 + 指标采集中间件（Express 版本）
 * - 使用 res.on('finish') 捕获响应完成时机
 * - 注意：Express 的 next() 不可 await，这里用事件实现“后置”逻辑
 */
export function accessAndMetrics(req: any, res: any, next: any) {
  const reqId = req.headers['x-request-id'] || cryptoRandomId();
  res.setHeader('x-request-id', String(reqId));
  const start = Date.now();

  res.on('finish', () => {
    const cost = Date.now() - start;
    logger.info({
      msg: 'http access',
      reqId,
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
      cost,
    });
    httpDuration
      .labels(req.method, req.route?.path || req.path, String(res.statusCode))
      .observe(cost / 1000);
  });

  next();
}

/**
 * 注册 /metrics、/healthz、/readyz 路由（Express）
 * @param app Express 实例
 */
export function registerSystemRoutes(app: express.Express) {
  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });
  app.get('/healthz', (_req, res) => res.status(200).send('ok'));
  app.get('/readyz', (_req, res) => {
    const ready = true; // TODO: 检查依赖可用性
    res.status(ready ? 200 : 503).send(ready ? 'ready' : 'not ready');
  });
}

/**
 * 创建示例应用（可用于 PoC 或演示）
 */
export function createApp() {
  const app = express();
  app.use(accessAndMetrics);
  registerSystemRoutes(app);
  app.get('/hello', (_req, res) => res.json({ message: 'world' }));
  return app;
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// 可选：直接启动（示例）
// if (require.main === module) {
//   createApp().listen(3000, () => logger.info('Express app on :3000'));
// }

