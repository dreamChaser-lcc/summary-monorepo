<!--
 * @Date: 2024-06-19 16:00:12
 * @LastEditors: lcc
 * @LastEditTime: 2024-06-20 03:10:12
 * @FilePath: /summary-monorepo/app/vite-vue/src/components/m-layout/index.vue
 * @Description: 展示代码布局组件
-->
<script lang="ts" setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const title = route.meta?.title;
</script>
<template>
  <div class="m-layout-wrap">
    <div v-if="$slots.summary" class="m-layout-summary">
      <span class="title">{{ title }}概述：</span>
      <div class="split-line"></div>
      <div class="m-layout-summary-content">
        <slot name="summary"></slot>
      </div>
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
  width: 100vw;
  max-width: 1280px;
  text-align: left;
  .m-layout-summary {
    // min-height: 200px;
    max-height: 35vh;
    padding: 12px;
    width: 100%;
    border-bottom: 1px solid #c3c3c3;
    border-radius: 12px;
    background-color: #f7f7f7;
    margin: 12px 0;
    .title {
      font-weight: bold;
      padding-bottom: 6px;
    }
    .split-line {
      margin: 6px 0;
      border-bottom: 1px solid #c3c3c3;
    }
    &-content {
      max-height: calc(100% - 36px);
      overflow: auto;
    }
  }
  .m-layout-content {
    flex: 1;
    width: 100%;
    border-radius: 12px 12px 0 0;
    background-color: #f7f7f7;
    padding: 12px;
    border: 1px solid #c3c3c3;
    border-bottom: none;
    margin: 0 auto;
  }
}
</style>
