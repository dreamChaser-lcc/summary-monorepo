<!--
 * @Author: lcc
 * @Date: 2024-06-01 19:56:05
 * @LastEditTime: 2024-06-01 23:00:16
 * @LastEditors: lcc
 * @Description: 发布订阅模式（事件总线中心） publish/subscribe 模式
-->
<script setup lang="ts">
interface IEvent{
    [key:string]: Function[]
}

class EventBus{
    eventManage:IEvent={};
    constructor(){
        this.eventManage = {};
    }

    on(key:string, handler:Function){
        if(Reflect.has(this.eventManage, key)){
            this.eventManage[key].push(handler);
        }else{
           this.eventManage[key] = [handler];
        }
    }

    emit(key:string,params:any){
        if(!Reflect.has(this.eventManage, key)){
            console.warn('未找到监听事件的',key)
        }else{
        //    this.eventManage[key] = [handler];
            this.eventManage[key].forEach(handler=>{
                handler.call(handler, params)
            })
        }
    }

    off(key:string, handler:Function){
        const existIndex = this.eventManage[key].findIndex(item=>{
            // 原来传入的函数也是可以判断全等的，可以通过这个删除掉
            return item === handler;
        });
        if(existIndex > -1){
            this.eventManage[key].splice(existIndex,1);
        }else{
            Reflect.deleteProperty(this.eventManage, key); 
        }
    }
}
const event = new EventBus();

const added1 = function(params){
    console.log('added1', params)
}

const subscribe= ()=>{
    console.log('in subscribe');
    event.on('added',function(params){
        console.log('added', params)
    });
    event.on('added',added1);
    event.on('join', function(params){
        console.log('join',params);
    })
}

const emitAdd = ()=>{
    event.emit('added',{name:'added',message:'我要进入added1和added2啦'})
}

const emitJoin = ()=>{
    event.emit('join',{name:'join',message:'我要进入emitJoin啦'})
}
const cancelSubscribe = ()=>{
    // 只是取消事件
    event.off('added', added1);
}
</script>
<template>
<div>
    <button @click="subscribe">订阅</button>
    <button @click="cancelSubscribe">取消订阅added</button>
    <button @click="emitAdd">发布added</button>
    <button @click="emitJoin">发布join</button>
</div>
</template>
<style>
</style>