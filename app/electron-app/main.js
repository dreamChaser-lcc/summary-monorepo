// main.js

// electron 模块可以用来控制应用的生命周期和创建原生浏览窗口
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { generateAst } = require('./utils/parseFile.js');

/**文件改动重启服务 */
// const reload = require('electron-reload');
// reload(__dirname, {
//   electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
// });

const createWindow = () => {
  // 创建浏览窗口
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 加载 index.html
  mainWindow.loadFile('index.html');
  // 加载路由
  // mainWindow.loadURL('http://localhost:9000/');

  // const child = new BrowserWindow({ parent: mainWindow, modal: true, show: true });
  // child.loadURL('https://github.com');

  // 打开开发工具
  mainWindow.webContents.openDevTools({
    mode: false || 'detach',
  });
  // app.commandLine.appendSwitch('--remote-debugging-port', '8315');
};

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // 在 macOS 系统内, 如果没有已开启的应用窗口
    // 点击托盘图标时通常会重新创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态,
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/** 监听readFile事件，调用nodeApi */
ipcMain.handle('readFile', async (event, filePath) => {
  try {
    console.log('🚀 ~ ipcMain.handle ~ event:', event);
    return generateAst();
  } catch (error) {
    console.error('读取文件出错：', error);
    return null;
  }
});
