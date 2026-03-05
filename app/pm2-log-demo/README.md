# PM2 日志管理 Demo

这个 Demo 展示了如何使用 PM2 来管理 Node.js 应用的日志，包括自定义日志路径、时间戳、错误日志分离以及日志轮转 (Log Rotate)。

## 1. 目录结构

*   `app.js`: 一个简单的 Node.js HTTP 服务器，会打印 `console.log` (stdout) 和 `console.error` (stderr)。
*   `ecosystem.config.js`: PM2 的配置文件，定义了日志的存储位置和格式。

## 2. 运行 Demo

确保你已经安装了 PM2：
```bash
npm install pm2 -g
```

进入目录并启动：
```bash
cd app/pm2-log-demo
pm2 start ecosystem.config.js
```

## 3. 验证日志

访问服务产生日志：
```bash
# 产生正常日志 (stdout)
curl http://localhost:3000/
# 产生错误日志 (stderr)
curl http://localhost:3000/error
```

查看生成的日志文件：
```bash
ls -l logs/
# 你会看到 app-out.log, app-err.log 等文件
cat logs/app-out.log
```

## 4. 实时查看日志

在开发或排查问题时，可以使用以下命令实时查看：

```bash
# 查看所有应用的日志
pm2 logs

# 查看特定应用的日志
pm2 logs pm2-log-demo

# 查看特定应用的最后 100 行
pm2 logs pm2-log-demo --lines 100
```

## 5. 日志轮转 (Log Rotate) - 进阶

生产环境中，日志文件会越来越大，把磁盘写满。PM2 提供了一个插件 `pm2-logrotate` 来自动切割日志。

### 安装插件
```bash
pm2 install pm2-logrotate
```

### 配置策略
默认配置是每天切割一次，或者文件超过 10MB 切割。你可以通过以下命令修改配置：

```bash
# 设置每个日志文件最大 10MB (默认 10M)
pm2 set pm2-logrotate:max_size 10M

# 设置保留最近 30 个日志文件 (默认 30)
pm2 set pm2-logrotate:retain 30

# 设置是否压缩归档的日志 (默认 false)
pm2 set pm2-logrotate:compress true

# 设置切割周期 (格式为 cron，默认每天午夜 0 0 * * *)
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

### 常用命令
*   `pm2 flush`: 清空当前所有日志文件（瞬间释放磁盘空间）。
*   `pm2 reloadLogs`: 重新加载日志配置（手动触发切割）。

## 6. 上传到第三方平台 (ELK/Loki)

在生产环境中，通常不会只看本地文件，而是将日志实时上传到 ELK 或 Loki。

### 方案一：使用 PM2 插件 (简单)
PM2 有很多第三方插件可以直接推送日志。

```bash
# 示例：推送到 Grafana Loki
pm2 install pm2-loki
pm2 set pm2-loki:lokiUrl 'http://your-loki-server:3100'
```

### 方案二：使用 Filebeat/Promtail (推荐)
这是最稳健的方案。PM2 只负责写文件，由外部 Agent 负责采集。

**以 Filebeat 为例：**
1. 安装 Filebeat。
2. 配置 `filebeat.yml` 监听 PM2 的日志目录：

```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/your/project/app/pm2-log-demo/logs/*.log

output.elasticsearch:
  hosts: ["localhost:9200"]
```
