<!--
 * @Date: 2024-06-19 16:00:12
 * @LastEditors: lcc
 * @LastEditTime: 2024-06-19 18:21:05
 * @FilePath: /summary-monorepo/app/vite-vue/src/components/m-layout/index.vue
 * @Description: 展示代码布局组件
-->
<script lang="ts" setup></script>
<template>
  <div class="m-layout-wrap">
    <div v-if="$slots.summary" class="m-layout-summary">
      <slot name="summary"></slot>
    </div>
    <div v-if="$slots.content" class="m-layout-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.m-layout-wrap {
  display: flex;
  align-items: center;
  flex-direction: column;
  height: 100vh;

  .m-layout-content {
    flex: 1;
  }
}
</style>
