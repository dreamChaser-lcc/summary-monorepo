<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick, watch, shallowRef, triggerRef, type Ref } from 'vue';

interface Item {
  id: number;
  text: string;
}

// 模拟 10 万条数据
const allItems = ref<Item[]>(
  Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    text: `第 ${i} 条数据 - Virtua 原理实现`
  }))
);

/**
 * 树状数组 (Fenwick Tree) 实现
 * 用于高效维护前缀和，支持 O(log N) 的更新和查询
 */
class FenwickTree {
  tree: Float64Array;
  size: number;

  constructor(size: number) {
    this.size = size;
    this.tree = new Float64Array(size + 1);
  }

  // O(N) 初始化
  init(initialSize: number) {
    this.tree.fill(0);
    for (let i = 1; i <= this.size; i++) {
      this.tree[i] += initialSize;
      const parent = i + (i & -i);
      if (parent <= this.size) {
        this.tree[parent] += this.tree[i];
      }
    }
  }

  // 单点更新: index (0-based) 增加 delta
  update(index: number, delta: number) {
    let i = index + 1;
    while (i <= this.size) {
      this.tree[i] += delta;
      i += i & -i;
    }
  }

  // 前缀和查询: 返回前 index 个元素的和 (即 index 处的 offset)
  query(index: number): number {
    let sum = 0;
    let i = index; 
    while (i > 0) {
      sum += this.tree[i];
      i -= i & -i;
    }
    return sum;
  }

  // 查找: 找到满足 query(index) <= value 的最大 index
  // 即找到包含 offset = value 的 item index
  find(value: number): number {
    let index = 0;
    let currentSum = 0;
    // 找到最大的 2^k <= size
    let bitMask = 1;
    while ((bitMask << 1) <= this.size) bitMask <<= 1;

    for (; bitMask > 0; bitMask >>= 1) {
      const nextIndex = index + bitMask;
      if (nextIndex <= this.size && currentSum + this.tree[nextIndex] <= value) {
        index = nextIndex;
        currentSum += this.tree[index];
      }
    }
    return index;
  }
}

/**
 * 核心虚拟滚动 Hook
 */
function useVirtualizer(options: {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: () => number;
  overscan?: number;
}) {
  const { count, getScrollElement, estimateSize, overscan = 5 } = options;

  // 状态
  // 记录真实高度: index -> size
  const sizes = new Map<number, number>();
  const scrollOffset = ref(0);
  // 使用 ref 追踪总高度变化
  const totalSize = ref(count * estimateSize());
  
  // 使用 Fenwick Tree 管理偏移量
  // shallowRef 避免 Vue 深度代理 FenwickTree 对象
  const offsetTree = shallowRef(new FenwickTree(count));
  
  // 初始化
  offsetTree.value.init(estimateSize());

  // 更新尺寸
  const setItemSize = (index: number, size: number) => {
    const oldSize = sizes.get(index) ?? estimateSize();
    if (oldSize === size) return null;
    
    sizes.set(index, size);
    const delta = size - oldSize;
    
    // 更新树
    offsetTree.value.update(index, delta);
    totalSize.value += delta;
    
    // 手动触发更新，因为 offsetTree 是 shallowRef
    triggerRef(offsetTree);
    
    return delta;
  };

  // 计算可视范围
  const viewportHeight = ref(500); // 响应式的视口高度

  const updateViewportHeight = () => {
    const el = getScrollElement();
    if (el) {
      viewportHeight.value = el.clientHeight;
    }
  };

  const virtualItems = computed(() => {
    // 依赖收集：当 offsetTree 变化时重新计算
    const tree = offsetTree.value;
    const height = viewportHeight.value; // 依赖视口高度
    const scrollTop = scrollOffset.value;
    
    // 使用树状数组快速查找
    const start = tree.find(scrollTop);
    const end = tree.find(scrollTop + height);
    
    const rangeStart = Math.max(0, start - overscan);
    const rangeEnd = Math.min(count - 1, end + overscan);

    const items = [];
    for (let i = rangeStart; i <= rangeEnd; i++) {
      // query(i) 获取第 i 个元素的 offset
      const startOffset = tree.query(i);
      const size = sizes.get(i) ?? estimateSize();
      
      items.push({
        index: i,
        start: startOffset,
        size: size,
      });
    }
    return items;
  });

  // 滚动锚定 (Scroll Anchoring) 逻辑
  let resizeObserver: ResizeObserver | null = null;
  let viewportObserver: ResizeObserver | null = null;
  
  const measureElement = (el: HTMLElement | null) => {
    if (!el) return;
    
    // 1. 监听列表项尺寸变化
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        // ... (原有逻辑保持不变)
        // 找到当前视口最顶部的元素索引，用于锚定
        const scrollTop = scrollOffset.value;
        const tree = offsetTree.value;
        
        const anchorIndex = tree.find(scrollTop);
        const anchorOffset = tree.query(anchorIndex);
        const anchorScrollTopDelta = scrollTop - anchorOffset;

        let scrollAdjustment = 0;
        let hasAdjustment = false;

        // 批量处理更新
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const idx = Number(target.dataset.index);
          if (isNaN(idx)) continue;

          // 获取精确高度 (border-box)
          const height = entry.borderBoxSize?.[0]?.blockSize ?? target.getBoundingClientRect().height;
          
          const delta = setItemSize(idx, height);
          
          if (delta !== null && delta !== 0) {
             // 如果变化的元素在锚定元素之前（或就是锚定元素），累加调整量
             if (idx <= anchorIndex) {
               scrollAdjustment += delta;
               hasAdjustment = true;
             }
          }
        }

        if (hasAdjustment && scrollAdjustment !== 0) {
           const el = getScrollElement();
           if (el) {
             const newAnchorOffset = offsetTree.value.query(anchorIndex);
             const newScrollTop = newAnchorOffset + anchorScrollTopDelta;
             if (Math.abs(el.scrollTop - newScrollTop) > 0.5) {
                el.scrollTop = newScrollTop;
             }
           }
        }
      });
    }
    resizeObserver.observe(el);
  };

  // 2. 监听视口容器尺寸变化
  const observeViewport = (el: HTMLElement | null) => {
    if (!el) return;
    updateViewportHeight(); // 初始更新
    
    if (!viewportObserver) {
      viewportObserver = new ResizeObserver(() => {
        updateViewportHeight();
      });
    }
    viewportObserver.observe(el);
  };

  const onScroll = (e: Event) => {
    const target = e.target as HTMLElement;
    scrollOffset.value = target.scrollTop;
  };
  
  onUnmounted(() => {
    resizeObserver?.disconnect();
    viewportObserver?.disconnect();
  });

  return {
    virtualItems,
    totalSize,
    onScroll,
    measureElement,
    observeViewport // 导出 viewport 监听方法
  };
}

// --- 组件逻辑 ---
const parentRef = ref<HTMLElement | null>(null);
const count = allItems.value.length;

const { virtualItems, totalSize, onScroll, measureElement, observeViewport } = useVirtualizer({
  count,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 50,
});

// 计算可视区域的偏移量 (padding-top)
const startPadding = computed(() => {
  if (virtualItems.value.length === 0) return 0;
  return virtualItems.value[0].start;
});

// 监听 parentRef 挂载，启动 viewport 监听
watch(parentRef, (el) => {
  if (el) {
    observeViewport(el);
  }
});

// 监听元素挂载，绑定 ResizeObserver
watch(virtualItems, () => {
  nextTick(() => {
    if (!parentRef.value) return;
    const children = parentRef.value.querySelectorAll('[data-index]');
    children.forEach((el) => {
      measureElement(el as HTMLElement);
    });
  });
}, { flush: 'post' });

</script>

<template>
  <div class="virtua-demo">
    <h3>Virtua 原理重写版 (Fenwick Tree + O(logN) 高性能)</h3>
    <p>渲染节点: {{ virtualItems.length }} / 总数据: {{ allItems.length }}</p>
    
    <div 
      class="viewport" 
      ref="parentRef"
      @scroll="onScroll"
    >
      <div 
        class="list-container"
        :style="{ 
          height: `${totalSize}px`,
          position: 'relative',
          width: '100%'
        }"
      >
        <div
          :style="{
            transform: `translateY(${startPadding}px)`,
            willChange: 'transform'
          }"
        >
          <div 
            v-for="virtualItem in virtualItems"
            :key="virtualItem.index"
            :data-index="virtualItem.index"
            class="list-item"
          >
            <div class="item-content">
              <span class="index">#{{ virtualItem.index }}</span>
              <p :style="{ height: `${(allItems[virtualItem.index].id % 5) * 20 + 20}px` }">
                {{ allItems[virtualItem.index].text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtua-demo {
  /* 限制高度，防止在父容器无高度时自动撑开导致虚拟滚动失效 */
  height: 800px; 
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.viewport {
  flex: 1;
  border: 1px solid #ccc;
  overflow-y: auto;
  position: relative;
}

.list-container {
  min-height: 100%;
}

.list-item {
  width: 100%;
  box-sizing: border-box;
  background: white;
  border-bottom: 1px solid #eee;
  /* 确保内容不会溢出覆盖 */
  overflow: hidden; 
}

.item-content {
  padding: 10px;
}

.index {
  background: #eee;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 10px;
  font-weight: bold;
}
</style>
