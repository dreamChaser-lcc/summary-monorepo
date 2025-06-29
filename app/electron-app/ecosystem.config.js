const path = require('path');
// pm2 启动服务的配置
module.exports = {
  apps: [
    // {
    //   name: 'my-app',
    //   script: path.resolve(__dirname, './main.js'),
    //   watch: true, // 启用文件监听
    //   watch_delay: 1000, // 监听延迟，单位毫秒，避免频繁重启
    //   ignore_watch: [
    //     // 忽略的文件或目录
    //     'node_modules',
    //     'logs',
    //     '*.log',
    //   ],
    //   // 其他 PM2 配置选项...
    // },
    {
      name: 'my-app',
      script: 'pnpm',
      args: 'start',
    },
  ],
};
