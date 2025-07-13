// /*
//  * @Author: lcc
//  * @Date: 2024-06-10 17:08:06
//  * @LastEditTime: 2024-06-10 17:26:35
//  * @LastEditors: lcc
//  * @Description: 子线程处理的事情
//  */

onmessage = (e) => {
    // importScripts(['https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js']);
    console.log("Message received from main script");
    const workerResult = `Result`;
    console.log("Posting message back to main script");
    
    postMessage(workerResult); // 向主线程发送消息
};

// let count = 0;

// 监听主线程发送的消息
// onmessage = function(event) {
//   if (event.data === 'increment') {
//     count++;
//     postMessage(count); // 向主线程发送消息
//   }
// };
// addEventListener('message', ({ data }) => {
//     const response = data; // 处理数据
//     console.log("🚀 ~ addEventListener ~ data:", data)
//     postMessage(response); // 发送结果到主线程
// });