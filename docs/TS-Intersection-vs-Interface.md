# TypeScript 进阶：交叉类型 vs Interface 继承

在 TypeScript 中，我们经常需要组合多个类型。主要有两种方式：使用 `interface` 的 `extends` 继承，或者使用 `type` 的 `&` (交叉类型)。

虽然它们在 90% 的情况下可以互换，但在处理**冲突**和**扩展性**上有着本质区别。

## 1. 基础语法对比

**目标**：创建一个包含 `name` 和 `age` 的类型。

### Interface 方式 (继承)
```typescript
interface Name {
  name: string;
}

interface User extends Name {
  age: number;
}
```

### 交叉类型方式 (组合)
```typescript
type Name = {
  name: string;
};

type User = Name & {
  age: number;
};
```

---

## 2. 核心区别

### 2.1 处理同名属性冲突 (Conflict Handling)

这是两者最大的行为差异。

*   **Interface**: 严格检查。如果子接口重写了父接口属性，类型必须兼容（子类型），否则**直接报错**。
*   **交叉类型**: 暴力合并。它会尝试把两个类型“交”在一起。如果不兼容（如 `string & number`），该属性类型变为 `never`。

```typescript
interface A {
  id: number;
  fn: (x: string) => void;
}

// -------------------------------------------
// ❌ Interface 报错
// -------------------------------------------
// Error: Interface 'B' incorrectly extends interface 'A'.
// Property 'id' is incompatible. Type 'string' is not assignable to type 'number'.
interface B extends A {
  id: string; 
}

// -------------------------------------------
// ✅ 交叉类型 不报错 (但产生 never)
// -------------------------------------------
type C = A & {
  id: string;
};

// 结果：
// C.id 的类型是 `number & string`，即 `never`。
// 这意味着你无法给 id 赋值任何东西。
const c: C = {
  id: "123", // ❌ Error: Type 'string' is not assignable to type 'never'.
  fn: (x) => {}
};
```

### 2.2 声明合并 (Declaration Merging)

这是 `interface` 的独门绝技。你可以多次定义同一个 `interface`，TS 会自动把它们合并。

```typescript
// 文件 A
interface Window {
  title: string;
}

// 文件 B
interface Window {
  ts: TypeScriptAPI;
}

// ✅ 最终 Window 包含了 title 和 ts 两个属性
const w: Window = window;
w.title = "Hello";
w.ts = ...;
```

**Type Alias (`type`) 不支持声明合并**，重复定义会报错 `Duplicate identifier`。

### 2.3 索引签名 (Index Signatures)

`interface` 可以包含索引签名，但在某些边缘情况下，交叉类型对索引签名的处理与 `interface` 略有不同，这通常涉及到类型推断的细节。不过在现代 TS 版本中，这种差异已经很不明显。

---

## 3. 性能与显示

*   **显示**: 在编辑器 hover 查看类型时，`interface` 通常显示名字（如 `User`），而交叉类型有时会显示完整的结构（如 `Name & { age: number }`），这在类型很复杂时可能会让错误信息变得难读。
*   **性能**: 一般认为 `interface` 的类型检查性能略优于交叉类型，因为 `interface` 建立了明确的缓存层级关系，而交叉类型需要每次递归计算属性。

## 4. 最佳实践：该用哪个？

### ✅ 优先使用 Interface 的场景
1.  **定义对象结构**：尤其是对外发布的库或 API。
2.  **需要声明合并**：扩展全局对象（如 `Window`, `NodeJS.Process`）或第三方库类型。
3.  **面向对象编程**：当你确实是在描述 "Is-A" (继承) 关系时。

### ✅ 优先使用 交叉类型 (`&`) 的场景
1.  **临时组合**：比如在 React 组件 Props 中：`type Props = BaseProps & { extra: string }`。
2.  **组合非对象类型**：`type ID = string | number; type NewID = ID & {};`。
3.  **不需要层级关系**：只是单纯地想把两个数据结构拼在一起，不在乎它们是不是父子关系。

## 总结

| 特性 | Interface (`extends`) | 交叉类型 (`&`) |
| :--- | :--- | :--- |
| **同名属性冲突** | **报错** (严格) | 合并为 **never** (宽松) |
| **声明合并** | **支持** | 不支持 |
| **类型显示** | 显示接口名 | 可能显示完整结构 |
| **用途** | 对象结构、API 定义 | 临时组合、复杂类型运算 |
