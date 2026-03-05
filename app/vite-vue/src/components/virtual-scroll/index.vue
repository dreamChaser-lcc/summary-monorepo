<script setup lang="ts">
import { ref, computed } from 'vue';

interface Item {
  id: number;
  text: string;
}

// 1. 基础配置
const ITEM_HEIGHT = 50; // 每个项目固定高度
const VISIBLE_COUNT = 10; // 可视区域显示的项目数量
const BUFFER_COUNT = 5; // 上下缓冲的项目数量

// 模拟 10 万条数据
const allItems = ref<Item[]>(
  Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    text: `第 ${i} 条数据 - 虚拟滚动演示`
  }))
);

// 2. 响应式状态
const scrollTop = ref(0);
const containerRef = ref<HTMLElement | null>(null);

// 3. 计算属性：总高度（用于撑开滚动条）
const totalHeight = computed(() => allItems.value.length * ITEM_HEIGHT);

// 4. 计算属性：起始索引和结束索引
const startIndex = computed(() => {
  // 向下取整，算出当前滚过了多少个项目
  const index = Math.floor(scrollTop.value / ITEM_HEIGHT);
  // 减去上方缓冲区，防止滚太快白屏，但不能小于 0
  return Math.max(0, index - BUFFER_COUNT);
});

const endIndex = computed(() => {
  // 算出结束位置
  const index = Math.floor((scrollTop.value + VISIBLE_COUNT * ITEM_HEIGHT) / ITEM_HEIGHT);
  // 加上下方缓冲区，但不能超过总数据量
  return Math.min(allItems.value.length, index + BUFFER_COUNT);
});

// 5. 计算属性：当前需要渲染的数据切片
const visibleItems = computed(() => {
  return allItems.value.slice(startIndex.value, endIndex.value);
});

// 6. 计算属性：偏移量（将列表定位到正确的位置）
const offset = computed(() => startIndex.value * ITEM_HEIGHT);

// 7. 处理滚动事件
const onScroll = () => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }
};
</script>

<template>
  <div class="virtual-scroll-demo">
    <h3>虚拟滚动 Demo (100,000 条数据)</h3>
    <p>当前渲染 DOM 数量: {{ visibleItems.length }} (10 + 2*5 缓冲区)</p>
    
    <!-- 外部容器：固定高度，负责产生滚动条 -->
    <div 
      class="viewport" 
      ref="containerRef" 
      @scroll="onScroll"
      :style="{ height: `${VISIBLE_COUNT * ITEM_HEIGHT}px` }"
    >
      <!-- 撑开容器：高度等于总数据量 * 单个高度 -->
      <div class="phantom" :style="{ height: `${totalHeight}px` }"></div>
      
      <!-- 真实列表渲染区：通过 transform 偏移到可视区域 -->
      <div class="actual-list" :style="{ transform: `translateY(${offset}px)` }">
        <div 
          v-for="item in visibleItems" 
          :key="item.id" 
          class="list-item"
          :style="{ height: `${ITEM_HEIGHT}px`, lineHeight: `${ITEM_HEIGHT}px` }"
        >
          {{ item.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-scroll-demo {
  padding: 20px;
  font-family: sans-serif;
}

.viewport {
  width: 400px;
  border: 2px solid #333;
  overflow-y: auto;
  position: relative;
  background: #f9f9f9;
}

.phantom {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: -1;
}

.actual-list {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.list-item {
  padding: 0 15px;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  background: white;
}

.list-item:hover {
  background: #f0f0f0;
}
</style>
