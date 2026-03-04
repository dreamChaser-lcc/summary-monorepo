import Koa from 'koa';
import Router from '@koa/router';
import client from 'prom-client';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// 收集默认指标：进程、内存、事件循环、GC 等
client.collectDefaultMetrics();

const httpDuration = new client.Histogram({
  name: 'http_server_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

/**
 * 访问日志中间件
 * - 注入 reqId（若无）
 * - 输出结构化日志：method/path/status/耗时
 */
export async function requestLogger(ctx: Koa.Context, next: Koa.Next) {
  const reqId = ctx.get('x-request-id') || cryptoRandomId();
  ctx.set('x-request-id', reqId);
  const start = Date.now();
  try {
    await next();
  } finally {
    logger.info({
      msg: 'http access',
      reqId,
      method: ctx.method,
      path: ctx.path,
      status: ctx.status,
      cost: Date.now() - start,
    });
  }
}

/**
 * 指标采集中间件
 * - 使用直方图记录 HTTP 时延
 * - path 使用 _matchedRoute（若有）降低 label 基数
 */
export async function metricsMiddleware(ctx: Koa.Context, next: Koa.Next) {
  const labelBase = {
    method: ctx.method,
    path: (ctx as any)._matchedRoute || ctx.path,
  } as const;
  const end = httpDuration.startTimer(labelBase as any);
  try {
    await next();
  } finally {
    end({ status: String(ctx.status) });
  }
}

/**
 * 注册指标与健康探针路由
 * @param app Koa 实例
 * @returns 已注册的 Router（便于测试）
 */
export function registerSystemRoutes(app: Koa) {
  const router = new (Router as any)();
  router.get('/metrics', async (ctx: Koa.Context) => {
    ctx.set('Content-Type', client.register.contentType);
    ctx.body = await client.register.metrics();
  });
  router.get('/healthz', (ctx: Koa.Context) => { ctx.status = 200; ctx.body = 'ok'; });
  router.get('/readyz', (ctx: Koa.Context) => {
    // TODO: 在此处检测 DB/缓存等依赖可用性
    const ready = true;
    ctx.status = ready ? 200 : 503;
    ctx.body = ready ? 'ready' : 'not ready';
  });
  app.use(router.routes()).use(router.allowedMethods());
  return router;
}

/**
 * 创建示例应用（可用于 PoC 或演示）
 * @returns Koa 应用
 */
export function createApp() {
  const app = new Koa();
  app.use(requestLogger);
  app.use(metricsMiddleware);
  registerSystemRoutes(app);

  // 示例业务路由
  app.use(async (ctx, next) => {
    if (ctx.path === '/hello') {
      ctx.body = { message: 'world' };
      return;
    }
    await next();
  });

  return app;
}

/**
 * 生成简易随机 ID（替代 crypto.randomUUID，避免示例依赖）
 */
function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// 可选：直接启动（示例）
// if (require.main === module) {
//   createApp().listen(3000, () => logger.info('Koa app on :3000'));
// }

