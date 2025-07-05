/*
 * @Author: lcc
 * @Date: 2024-06-10 17:01:30
 * @LastEditTime: 2024-06-10 17:54:14
 * @LastEditors: lcc
 * @Description: 用worker线程生成md5唯一标识
 */
// import workjs from './worker.js';
export class WorkerMd5{
    worker: Worker;
    constructor(){
       this.worker =  new Worker(new URL('./worker.js', import.meta.url));
       console.log('inin',import.meta,new URL('./worker.js', import.meta.url))
    //    this.worker.onmessage = this.onmessage.bind(this)
    }
    postMessage(message){
        console.log("🚀 ~ WorkerMd5 ~ postMessage ~ message:", message)
        this.worker.postMessage(message)
    }
    onmessage(e:any){
        console.log("🚀 ~ workerMd5 ~ onmessage ~ e:", e)
    }
}