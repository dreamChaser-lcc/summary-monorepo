<!--
 * @Author: lcc
 * @Date: 2024-06-02 18:05:31
 * @LastEditTime: 2024-06-20 03:18:00
 * @LastEditors: lcc
 * @Description: pinia和vuex状态管理比较，异步&同步使用
-->
<script lang="ts" setup>
import { useUserInfoStore, useUserInfo1Store } from '@store/userInfo';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useUserInfoStore();
const store1 = useUserInfo1Store();
console.log('🚀 ~ store1:', store1);

// 直接解构的状态(不具有响应式)
const { loginNum: errLoginNum } = store;
// state和getters不能直接解构，会丢失响应式，storeToRefs先转换成ref
const { name, loginNum } = storeToRefs(store);
console.log('🚀 ~ name, loginNum:', name.value, loginNum.value);
// actions可以直接结构，因为不存在响应式问题
const { increment, reduce } = store;

// ------------------ vuex -------------
const vuexStore = useStore();

const vuexName = computed(() => vuexStore.state.moduleA.name);
const vuexLoginNum = computed(() => vuexStore.state.moduleA.loginNum);
// 直接使用辅助函数mapState,mapActions等方法需要封装
// const allState = computed(() => ({...mapState('moduleA', 'name','loginNum')}))
const vuexIncrement = () => vuexStore.commit('moduleA/increment', 1);
const vuexReduce = () => vuexStore.dispatch('moduleA/reduce', 1);

// store.commit('increment'),
</script>
<template>
  <m-layout>
    <template #summary>
      <ul>
        <li>pinia对ts和vue3组合式api兼容性更好，心智负担更低</li>
        <li>vuex中的很多辅助函数比如mapState在vue3中没有办法直接使用，需要进行二次封装</li>
        <li>pinia中没有mutations,actions可以处理异步任务</li>
        <li>vuex mutations只能处理同步任务，异步任务需要actions之后提交到mutation</li>
        <li>
          vuex是单一状态树，意味着当越来越多store时，需要嵌套或者更多的命名空间，pinia做到了解耦
        </li>
      </ul>
    </template>
    <template #content>
      <div class="store-container">
        <div class="pinia-container">
          <header class="header">pinia状态管理器</header>
          <main>
            <div>store name: {{ name }}</div>
            <div>store loginNum: {{ loginNum }}</div>
            <div>错误解构的 loginNum: {{ errLoginNum }}</div>
          </main>
          <m-button @click="increment">同步添加</m-button>
          <m-button @click="reduce">异步减少</m-button>
        </div>

        <div class="vuex-container">
          <header class="header">
            vuex
            <br />
            (单一状态树，可以通过嵌套和modules创建更多的状态)
          </header>
          <main>
            <div>store name: {{ vuexName }}</div>
            <div>store loginNum: {{ vuexLoginNum }}</div>
          </main>
          <m-button @click="vuexIncrement">同步添加</m-button>
          <m-button @click="vuexReduce">异步减少</m-button>
        </div>
      </div>
    </template>
  </m-layout>
</template>
<style lang="scss" scoped>
.summary {
  text-align: left;
}
.store-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
.pinia-container,
.vuex-container {
  padding: 12px;
  border-radius: 5px;
  border: 1px solid #c3c3c3;

  .header,
  main {
    border-bottom: 1px solid #c3c3c3;
  }
}
.vuex-container {
  margin-left: 12px;
}
</style>
