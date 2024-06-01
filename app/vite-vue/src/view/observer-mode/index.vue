<!--
 * @Author: lcc
 * @Date: 2024-06-01 23:00:42
 * @LastEditTime: 2024-06-01 23:25:37
 * @LastEditors: lcc
 * @Description: 观察者模式 (舔狗模式 要等发布者同意放到通知名单才会通知你向你撒网)  
-->
<script setup lang="ts">
interface IObserver{
    name: string;
    notify: Function;
}

class Publisher{
    // 订阅者
    subscribers:IObserver[]=[];

    constructor(){
        this.subscribers = [];
    }
    // 通知名单添加需要订阅我的最新消息的人放进去
    subscribe(observer){
        this.subscribers.push(observer);
    }

    publish(params){
        this.subscribers.forEach(observer=>{
            observer.notify(params);
        })
    }
}

// 订阅者对象
class Subscriber{
    name:string ='';

    constructor(name){
        this.name = name;
    }

    notify(params){
        console.log('观察者:', this.name,'看看发布者了什么东西哦:',params)
    }
}

// 订阅者
const user1 = new Subscriber('用户1号')
const user2 = new Subscriber('用户2号')

// 发布者
const publisher = new Publisher();

const addSubscribe = ()=>{
    // 发布者将这两个人放到通知名单中 
    publisher.subscribe(user1);
    publisher.subscribe(user2);
}

// 发布者发布通知，发布后，通知名单的人都可以接收到通知
const publishMessage = ()=>{
    publisher.publish('我要通知你们明天是星期八哦，不用上班');
} 
</script>
<template>
    <div>
        <button @click="addSubscribe">添加观察者到发布者通知名单中</button>
        <button @click="publishMessage">发布者要发布消息啦</button>
    </div>
</template>