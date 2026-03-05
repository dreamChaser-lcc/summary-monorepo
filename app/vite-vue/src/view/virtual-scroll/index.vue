<script setup lang="ts">
import VirtualScroll from '@/components/virtual-scroll/index.vue';
</script>

<template>
  <m-layout>
    <template #summary>
      <ul>
        <li>
          虚拟滚动的本质是“空间换时间”，通过计算只渲染用户看得见的那部分。
        </li>
        <li>
          视口层 (Viewport)：用户看到的固定窗口（如 500px 高），设置 overflow-y:
          auto。
        </li>
        <li>
          撑开层 (Phantom/Ghost Container)：欺骗浏览器，让浏览器以为列表真的有
          10 万条那么长，从而显示出正确比例的滚动条。
        </li>
        <li>
          渲染层 (Actual List)：承载真实渲染的 20 个 DOM 节点，通过 transform:
          translateY(offset) 来实时调整它的位置。
        </li>
      </ul>
    </template>
    <template #content>
      <div class="virtual-scroll-container">
        <VirtualScroll />
      </div>
    </template>
  </m-layout>
</template>

<style scoped>
.virtual-scroll-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
