/**
 * 需要异步导入共享的模块才行  
 * 例子：
 */
// import('app1_remote/addList').then(({addList}) => {
//     console.log("🚀 ~ import ~ addList:", addList)
//     addList();
// })


/**其他应用的共享模块，以下控制加载顺序 */
const promise1 = ()=>{
    return new Promise((resolve, reject)=>{
        import('app1_remote/addList').then(({addList}) => {
            console.log("🚀 ~ import ~ addList:", addList)
            addList();
            resolve()
        }).catch(err=>{
            reject(err);
        });
    })
} 


const promise2 = ()=>{
   return new Promise((resolve, reject)=>{
        import('app2_remote/commonUtils').then(({addContent}) => {
            console.log("🚀 ~ import ~ addContent:", addContent)
            addContent();
            resolve()
        }).catch(err=>{
            reject(err);
        })
    })
}

const taskQueue = [promise1,promise2];

// 顺序执行异步队列
const taskRun = ()=>{
    taskQueue.reduce((prev,cur,all)=>{
        return prev.then((res)=>{
            return cur();
        })
    },Promise.resolve())
}
taskRun();