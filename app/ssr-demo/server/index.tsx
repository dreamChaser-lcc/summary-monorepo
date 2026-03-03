import express from 'express';
import React from 'react';
import { renderToString, renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { matchRoutes } from 'react-router-dom';
import serialize from 'serialize-javascript';
import App from '../src/App';
import routes, { RouteConfig } from '../src/routes';
import fs from 'fs/promises';
import path from 'path';
import { Writable } from 'stream';

const app = express();
const PORT = 3000;

// 托管静态资源（客户端构建产物）
app.use(express.static('dist/public', { index: false }));

/**
 * 演示模式 A: Express 中间件预取数据 (Middleware Prefetching)
 * 针对 /profile 路由，我们在进入 React 渲染逻辑之前，先在 Express 中间件里获取数据。
 * 这种方式更接近传统的后端 MVC 模式，适用于需要复杂权限校验或与特定后端逻辑耦合的场景。
 */
app.use('/profile', async (req, res, next) => {
  console.log('Middleware: Fetching data for /profile...');
  // 模拟异步数据获取
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // 将获取到的数据挂载到 res.locals 上
  // res.locals 是 Express 推荐的在中间件之间传递数据的对象
  res.locals.data = {
    user: {
      username: 'MiddlewareUser',
      email: 'middleware@example.com',
      role: 'Admin'
    }
  };
  next();
});

/**
 * 处理标准同步 SSR (Standard SSR with renderToString)
 * 这是 React 18 之前的主流 SSR 方式。
 * 
 * 流程：
 * 1. 等待所有数据准备就绪。
 * 2. renderToString 生成完整的 HTML 字符串。
 * 3. 替换模板中的占位符。
 * 4. 一次性发送给浏览器。
 * 
 * 优点：实现简单，SEO 友好。
 * 缺点：TTFB (Time To First Byte) 较慢，因为必须等所有数据和渲染都完成才能发送响应。
 */
async function handleStandardSSR(req: express.Request, res: express.Response, initialData: any, template: string) {
  try {
    // 1. 渲染组件为 HTML 字符串
    const appHtml = renderToString(
      <StaticRouter location={req.url}>
        <App data={initialData} />
      </StaticRouter>
    );

    // 2. 序列化初始数据，用于客户端注水 (Hydration)
    // 使用 serialize-javascript 可以防止 XSS 攻击（自动转义 HTML 字符）
    const serializedData = serialize(initialData);

    // 3. 替换模板占位符
    const html = template
      .replace('__SSR_CONTENT__', appHtml)
      .replace(
        '__SSR_DATA_SCRIPT__',
        `<script>window.__INITIAL_DATA__ = ${serializedData}</script>`
      );
    
    // 4. 发送响应
    res.send(html);
  } catch (err) {
    console.error('Standard SSR Error:', err);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * 处理流式 SSR (Streaming SSR with renderToPipeableStream)
 * 这是 React 18 引入的新特性，配合 Suspense 使用效果最佳。
 * 
 * 流程：
 * 1. 立即发送 HTML 头部（Shell）。
 * 2. 持续渲染并流式传输 React 组件内容。
 * 3. 遇到 Suspense 边界时，先发送 fallback，等异步内容准备好后再发送真实内容和内联 JS 进行替换。
 * 4. 最后发送数据脚本和 HTML 尾部。
 * 
 * 优点：TTFB 极快，用户可以更快看到页面骨架；支持渐进式加载 (Progressive Hydration)。
 * 缺点：实现较复杂，需要处理流的拼接。
 */
function handleStreamingSSR(req: express.Request, res: express.Response, initialData: any, template: string) {
  // 我们需要将模板拆分为两部分：
  // header: <!DOCTYPE html>...<div id="root">
  // footer: </div>...</body>
  const [header, footer] = template.split('__SSR_CONTENT__');
  
  const serializedData = serialize(initialData);
  // 构造完整的 footer，包含注入的数据脚本
  const finalFooter = footer.replace(
    '__SSR_DATA_SCRIPT__',
    `<script>window.__INITIAL_DATA__ = ${serializedData}</script>`
  );
  
  let didError = false;

  const { pipe } = renderToPipeableStream(
    <StaticRouter location={req.url}>
      <App data={initialData} />
    </StaticRouter>,
    {
      // 客户端 JS 脚本路径，用于 React 在客户端进行 Hydration
      bootstrapScripts: ['/client.main.js'],
      
      // 当 Shell (骨架屏) 准备好时触发
      onShellReady() {
        res.statusCode = didError ? 500 : 200;
        res.setHeader('Content-Type', 'text/html');
        
        // 1. 先发送头部
        res.write(header);
        
        // 2. 创建一个 Transform 流来拼接 React 输出和 Footer
        // 这种做法确保了 React 渲染的内容直接流向 res，而在流结束时追加 footer
        const transformStream = new Writable({
          write(chunk, encoding, callback) {
            // 透传 React 的渲染内容
            res.write(chunk, encoding);
            callback();
          },
          final(callback) {
            // 3. React 流结束了，写入 footer 并关闭连接
            res.write(finalFooter);
            res.end();
            callback();
          }
        });
        
        // 将 React 的渲染流 pipe 到我们的 transformStream
        pipe(transformStream);
      },
      
      onShellError(err) {
        console.error('Shell Error:', err);
        res.statusCode = 500;
        res.send('<!doctype html><p>Internal Server Error</p>');
      },
      
      onError(err) {
        didError = true;
        console.error('Streaming Error:', err);
      }
    }
  );
}

// 主请求处理逻辑
app.get(/(.*)/, async (req, res) => {
  // 1. 初始化数据
  // 如果之前的中间件（比如 /profile）已经准备好了数据，就直接用
  let initialData: any = res.locals.data || {};
  
  // 2. 演示模式 B: 组件级预取数据 (Component Prefetching)
  // 如果中间件没给数据，则使用 react-router-config 风格的静态路由配置来匹配组件并获取数据
  // 这种方式更符合 React 生态的习惯，组件定义自己的数据需求
  if (Object.keys(initialData).length === 0) {
    const matches = matchRoutes(routes, req.url);
    if (matches) {
      const promises = matches.map((match) => {
        const route = match.route as RouteConfig;
        // 如果路由配置了 loadData 静态方法，则调用它
        if (route.loadData) {
          return route.loadData();
        }
        return Promise.resolve(null);
      });

      // 等待所有组件的数据请求完成
      const results = await Promise.all(promises);
      
      // 合并所有数据
      const fetchedData = results.reduce((acc, curr) => {
        return curr ? { ...acc, ...curr } : acc;
      }, {});
      initialData = { ...initialData, ...fetchedData };
    }
  }

  // 读取构建生成的 index.html 模板
  const templatePath = path.resolve(__dirname, 'public/index.html');
  
  try {
    let template = await fs.readFile(templatePath, 'utf-8');
    
    // 根据 URL 参数切换渲染模式
    // ?stream=true 开启流式渲染 (React 18+)
    // 默认使用标准同步渲染
    const useStream = req.query.stream === 'true';
    
    if (useStream) {
      console.log('Mode: Streaming SSR');
      handleStreamingSSR(req, res, initialData, template);
    } else {
      console.log('Mode: Standard SSR');
      handleStandardSSR(req, res, initialData, template);
    }
    
  } catch (err) {
    console.error('Error rendering template:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
