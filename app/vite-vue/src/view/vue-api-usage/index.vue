<script lang="ts" setup>
import { vLazy } from '@/directive/index';

const ad = 'vv';
const url =
  'https://img0.baidu.com/it/u=2865956156,2660758198&fm=253&fmt=auto&app=120&f=PNG?w=1287&h=730';
</script>
<template>
  <div class="vue-api-usage">
    <div class="lazy-box">
      <div class="placeholder">懒加载盒子，往右拉图片才会去请求</div>
      <img crossorigin="anonymous" v-lazy="url" />
    </div>
  </div>
</template>
<style lang="scss">
.vue-api-usage {
  .lazy-box {
    overflow-x: scroll;
    width: 200px;
    display: flex;
    border: 1px solid #c3c3c3;
    border-radius: 6px;
    .placeholder {
      width: 200px;
      flex: 0 0 200px;
    }
    img {
      width: 200px;
      height: 200px;
    }
  }
}
</style>
