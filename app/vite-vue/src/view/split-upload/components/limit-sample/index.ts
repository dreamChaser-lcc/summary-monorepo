import pLimit from 'p-limit';

const request1 = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('inin', 1, new Date().getTime());
      resolve(true);
    }, 1000);
  });
const request2 = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('inin', 2, new Date().getTime());
      resolve(true);
    }, 2000);
  });
const request3 = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('inin', 3, new Date().getTime());
      resolve(true);
    }, 3000);
  });
// const limit = pLimit(2);
// const input = [
//   limit(() => {
//     console.log('🚀 ~ input:', limit.activeCount);
//     request1();
//   }),
//   limit(() => {
//     console.log('🚀 ~ input:', limit.activeCount);
//     request2();
//   }),
//   limit(() => {
//     console.log('🚀 ~ input:', limit.activeCount);
//     request3();
//   }),
// ];
// console.log('🚀 ~ input:', limit.activeCount);
// const input = [request1(), request2(), request3()];
// const result = await Promise.all(input);
// console.log(result);

class MyPlimit {
  queue: any = [];
  concurrency = 1;
  curActiveCount = 0;
  constructor(concurrency) {
    this.concurrency = concurrency;
  }

  async next() {
    this.curActiveCount--;
    if (this.queue.length > 0) {
      const func = this.queue.pop();
      await this.runFunc(func);
    }
  }

  async runFunc(func1) {
    // console.log('🚀 ~ MyPlimit ~ runFunc ~ func1:', func1);
    this.curActiveCount++;
    const result = await func1();
    await this.next();
    // resolve(result)
  }

  // 入队
  enqueue(promiseFunc) {
    this.queue.unshift(promiseFunc);
    if (this.curActiveCount < this.concurrency && this.queue.length > 0) {
      const func = this.queue.pop();
      // console.log('🚀 ~ MyPlimit ~ enqueue ~ func:', func);
      // func();
      // this.runFunc(func);
      this.runFunc(func);
    }
  }
}

const myplimit = new MyPlimit(3);

const input = [
  myplimit.enqueue(() => {
    console.log('curActiveCount', myplimit.curActiveCount);
    request1();
  }),
  myplimit.enqueue(() => {
    console.log('curActiveCount', myplimit.curActiveCount);
    request2();
  }),
  myplimit.enqueue(() => {
    console.log('curActiveCount', myplimit.curActiveCount);
    request3();
  }),
];
const result = await Promise.all(input);

export default {};
