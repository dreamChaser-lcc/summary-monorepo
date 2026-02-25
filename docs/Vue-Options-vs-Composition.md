# Vue: Options API vs Composition API 深度对比

Vue 3 引入了 Composition API，彻底改变了我们组织 Vue 代码的方式。本文档详细对比两种 API 风格的区别、优势及适用场景。

## 1. 核心理念对比

### Options API (选项式 API)
**理念**：**"关注点分离 (Separation of Options)"**。
框架强制规定了代码的位置：
- 数据必须在 `data()`
- 方法必须在 `methods`
- 计算属性必须在 `computed`

### Composition API (组合式 API)
**理念**：**"关注点聚合 (Collocation of Concerns)"**。
代码根据**业务逻辑功能**进行组织。
- 一个“搜索功能”的所有代码（状态、方法、副作用）可以写在一起。
- 甚至可以提取到一个独立的函数 (`useSearch`) 中。

---

## 2. 代码组织图解

### 场景：一个包含“用户列表”和“文章列表”的组件

#### Options API (分散)
```javascript
export default {
  data() {
    return {
      users: [],      // 用户数据
      posts: [],      // 文章数据
      loading: false
    }
  },
  mounted() {
    this.fetchUsers(); // 用户逻辑
    this.fetchPosts(); // 文章逻辑
  },
  methods: {
    fetchUsers() { ... }, // 用户逻辑
    fetchPosts() { ... }  // 文章逻辑
  }
}
```
*痛点：修改“用户逻辑”时，需要在 `data`, `mounted`, `methods` 之间反复上下滚动。*

#### Composition API (聚合)
```javascript
// userLogic.js (或者直接写在 setup 里)
function useUsers() {
  const users = ref([]);
  const fetchUsers = () => { ... };
  onMounted(fetchUsers);
  return { users, fetchUsers };
}

// postLogic.js
function usePosts() {
  const posts = ref([]);
  const fetchPosts = () => { ... };
  onMounted(fetchPosts);
  return { posts, fetchPosts };
}

// 组件内
export default {
  setup() {
    const { users } = useUsers(); // 用户逻辑
    const { posts } = usePosts(); // 文章逻辑
    return { users, posts };
  }
}
```
*优势：逻辑高度内聚，维护时只需关注相关代码块。*

---

## 3. 详细优势对比表

| 维度 | Options API (Vue 2) | Composition API (Vue 3) |
| :--- | :--- | :--- |
| **逻辑复用** | **Mixins**<br>❌ 命名冲突<br>❌ 数据来源不清 (隐式依赖)<br>❌ 难以类型推断 | **Composables (Hooks)**<br>✅ 显式引入，来源清晰<br>✅ 无命名冲突 (可重命名)<br>✅ 像普通函数一样简单 |
| **TypeScript** | **差**<br>❌ 严重依赖 `this` 上下文<br>❌ 类型推断困难 | **极好**<br>✅ 基本上就是写普通 JS 函数<br>✅ 类型自动推断准确 |
| **代码体积** | 稍大 (无法 Tree-shaking 掉未使用的选项) | **更小** (对压缩工具友好，更好的 Tree-shaking) |
| **心智模型** | **对象属性** (this.xxx) | **变量与闭包** (const xxx) |
| **学习曲线** | **低** (填空题，适合新手) | **中** (需要理解 Ref/Reactive 原理) |

---

## 4. 选型建议

### ✅ 选择 Composition API 如果...
1.  **项目使用 TypeScript**：这是压倒性的优势。
2.  **大型复杂项目**：组件逻辑复杂，代码行数多，需要更好的组织结构。
3.  **需要强逻辑复用**：希望构建自己的 Hooks 库 (如 `useRequest`, `useModal`)。
4.  **Vue 3 新项目**：这是官方推荐的未来主流写法 (`<script setup>`)。

### ✅ 选择 Options API 如果...
1.  **小型简单项目**：逻辑简单，不需要复用。
2.  **从 Vue 2 迁移**：不想花费大量精力重构旧代码 (Vue 3 完全兼容 Options API)。
3.  **团队习惯**：团队成员对新特性接受度低，且没有 TS 需求。

## 5. 总结

Composition API 并不是要完全取代 Options API，而是为了解决 Options API 在**大规模应用**和**逻辑复用**上的短板。

*   **Options API** 是**规定好的框架**，你往里面填空。
*   **Composition API** 是**工具箱**，你可以自由组合工具来构建你的逻辑。
