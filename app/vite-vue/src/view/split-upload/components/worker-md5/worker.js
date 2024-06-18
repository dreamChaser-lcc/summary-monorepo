/*
 * @Author: lcc
 * @Date: 2024-06-10 17:08:06
 * @LastEditTime: 2024-06-19 00:59:36
 * @LastEditors: lcc
 * @Description: 子线程处理的事情
 */

/**
 * 这里是子线程执行的内容
 * worker postMessage的回调函数
 * @param context MessageEvent
 */
onmessage = (context) => {
  console.log('🚀 ~ context,e:', context);
  // 不能直接使用npm的包，这能这样引入，可以在context.target中找到，成功导入的变量
  importScripts(['https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js']);

  const payload = context.data;

  const callback = (chunkList) => {
    postMessage(chunkList); // 向主线程发送消息
  };
  generatorMd5(payload, callback);
};

/**
 * 拆分文件
 * 并根据内容生成hash值
 * (内容不变hash值是不会变的)
 * @param {*} payload 文件拆分参数
 * @param {*} callback 成功回调
 */
const generatorMd5 = (payload, callback) => {
  const { file, chunkSize = 300 * 1024 } = payload;

  const chunkList = [];
  let curChunk = 0;
  const fileReader = new FileReader();

  fileReader.onload = function (e) {
    // 生成对应的hash值
    const spark = new SparkMD5.ArrayBuffer();
    spark.append(e.target.result);
    const md5 = spark.end();
    chunkList[curChunk].md5 = md5;
    curChunk++;

    const chunkTotal = Math.ceil(file.size / chunkSize);
    if (curChunk < chunkTotal) {
      loadNext();
    } else {
      // 按尺寸分片完成
      console.info('computed hash', chunkList);
      callback(chunkList);
    }
  };

  fileReader.onerror = function () {
    console.warn('chunk 加载失败');
  };

  const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
  function loadNext() {
    // 拆分文件
    const start = curChunk * chunkSize;
    const end = (curChunk + 1) * chunkSize >= file.size ? file.size : (curChunk + 1) * chunkSize;
    // console.log('🚀 ~ loadNext ~ start, end:', start, end, file.name, String(123).endsWith);
    const chunk = blobSlice.call(file, start, end, file.type);
    const suffix = file?.name?.split('.').pop();
    chunkList.push({
      chunk: chunk,
      suffix: suffix,
      chunkIndex: curChunk,
      fileName: file.name.slice(0, 5),
    });

    fileReader.readAsArrayBuffer(chunk);
  }

  loadNext();
};
