/**
 * 渲染进程
 * preload.js
 */
const { contextBridge, ipcRenderer } = require('electron');
// const fs = require('node:fs');

// 所有的 Node.js API接口 都可以在 preload 进程中被调用.
// 它拥有与Chrome扩展一样的沙盒。
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
    console.log(1);
  }
});

contextBridge.exposeInMainWorld('api', {
  readFile: (filePath) => {
    console.log('filePath', filePath);
    return ipcRenderer.invoke('readFile', filePath);
  },
});
