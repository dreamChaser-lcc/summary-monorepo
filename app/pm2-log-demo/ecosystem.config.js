module.exports = {
  apps: [{
    name: "pm2-log-demo",
    script: "./app.js",
    instances: 1,
    
    // --- 日志管理核心配置 ---
    
    // 1. 日志文件路径
    // 默认情况下，PM2 会把日志存在 ~/.pm2/logs/ 目录下
    // 这里我们可以自定义路径
    error_file: "./logs/app-err.log", // 错误日志 (stderr)
    out_file: "./logs/app-out.log",   //以此为准 (stdout)
    log_file: "./logs/app-combined.log", // 合并日志 (可选，包含 stdout 和 stderr)

    // 2. 日志时间戳
    // 给每一行日志自动加上时间前缀，格式自定义
    time: true, // 或者 "YYYY-MM-DD HH:mm:ss"

    // 3. 自动合并日志 (Cluster模式下)
    // 如果开启多个实例 (instances > 1)，默认每个实例会写不同的文件
    // 设置为 true 可以让所有实例写入同一个文件
    merge_logs: true,

    // 4. 禁用日志 (可选)
    // out_file: "/dev/null",
    // error_file: "/dev/null",
  }]
}
