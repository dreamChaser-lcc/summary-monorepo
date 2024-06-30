<!--
 * @Author: lcc
 * @Date: 2024-06-25 23:34:29
 * @LastEditTime: 2024-06-30 23:02:20
 * @LastEditors: lcc
 * @Description: js样式隔离demo
-->
<script lang="ts" setup>
// const longText = Array.from({ length: 5000 }, (_) => '长').join('');
import ProxySandbox, { a } from './shabox';

const proxy1 = new ProxySandbox('test');

// eval(
//   `(function(window, self){ window.a = 1;console.log('window', a)).bind(window.proxy)(window.proxy, window.proxy)`,
// );

// proxy1.proxy.a = 1;
(function (window, self) {
  // with (window) {
  window.a = 2;
  console.log('window', document);
  console.log('window', window.a);
  // }
}).bind(proxy1.proxy)(proxy1.proxy, proxy1.proxy);

// @ts-ignore
window.b = 2;
// window.a = 1;
// console.log('window 被调用啦', window.a, proxy1.proxy.a);

// const handles = {
//   get() {
//     console.log('我被触发了');
//     return 1;
//   },
//   set() {
//     console.log('我被触发了，set',a);
//     return 11;
//   },
// };
// const proxyTest = new Proxy(window, handles);

// proxyTest.a = 1;
// console.log('inin', proxyTest.a);
</script>
<template>
  <div>
    <m-layout>
      <template #summary>这里是代码概述总结</template>
      <template #content>这里是内容示例</template>
    </m-layout>
  </div>
</template>
<style lang="scss" scoped></style>
