<script setup lang="ts">
import { ref } from 'vue';
import { VList } from 'virtua/vue';

// 模拟 10,000 条不定高度的数据
const list = ref(
  Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
    // 随机生成不同长度的文本，模拟不定高度
    content: '内容 '.repeat(Math.floor(Math.random() * 20) + 1),
    height: Math.floor(Math.random() * 50) + 30 // 仅用于样式模拟，virtua 会自动测量真实高度
  }))
);
</script>

<template>
  <m-layout>
    <template #summary>
      <ul>
        <li>使用 virtua 库实现虚拟列表</li>
        <li>零配置：不需要预设 itemSize，不需要手动测量</li>
        <li>支持不定高度：自动测量 DOM 真实高度</li>
        <li>体积极小：~3KB</li>
      </ul>
    </template>
    <template #content>
      <div class="virtua-container">
        <h3>Virtua 虚拟列表 Demo (10,000 条不定高度数据)</h3>
        
        <!-- VList 组件 -->
        <!-- style 设置容器高度，overflow-y: auto 由组件内部处理 -->
        <VList :data="list" :style="{ height: '800px' }" #default="{ item, index }">
          <div
            :key="index"
            :style="{
              height: item + 'px',
              background: 'white',
              borderBottom: 'solid 1px #ccc',
            }"
          >
            {{ index }}
          </div>
        </VList>
      </div>
    </template>
  </m-layout>
</template>

<style scoped>
.virtua-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  background: #fff;
}

.list-item:hover {
  background: #f5f5f5;
}

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.id {
  background: #e0e0e0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
  color: #333;
}

.title {
  font-weight: bold;
}

.item-content {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}
</style>
