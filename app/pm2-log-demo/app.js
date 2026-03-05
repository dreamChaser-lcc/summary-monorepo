const http = require('http');

const server = http.createServer((req, res) => {
  // 标准输出日志 (stdout) -> 会被 PM2 捕获到 out.log
  console.log(`[${new Date().toISOString()}] 收到请求: ${req.method} ${req.url}`);

  if (req.url === '/error') {
    // 错误输出日志 (stderr) -> 会被 PM2 捕获到 error.log
    console.error(`[${new Date().toISOString()}] 发生错误: 模拟的错误请求`);
    res.writeHead(500);
    res.end('Error');
    return;
  }

  res.writeHead(200);
  res.end('Hello PM2 Logs');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
