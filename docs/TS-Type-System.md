# TypeScript 类型系统核心：联合、收窄与可辨识联合

本文档详细解析 TypeScript 中处理复杂数据结构的核心机制。理解这些概念是编写类型安全且灵活代码的基础。

## 1. 类型别名 (Type Alias)
**关键字**：`type`

类型别名就是给一个类型（无论是简单的基础类型，还是复杂的对象结构）起一个新的名字。

```typescript
// 给基础类型起别名
type ID = string | number;

// 给对象结构起别名
type User = {
  id: ID;
  name: string;
  age?: number;
};

// 给函数起别名
type Callback = (data: string) => void;
```
*注意：`type` 和 `interface` 很像，但 `type` 更灵活，可以定义联合类型，而 `interface` 只能定义对象结构。*

---

## 2. 联合类型 (Union Types)
**语法**：`TypeA | TypeB`

表示一个值可以是几种类型中的**任意一种**。就像是“或者”的关系。

```typescript
function printId(id: number | string) {
  console.log("Your ID is: " + id);
}

printId(101);    // ✅ OK
printId("202");  // ✅ OK
// printId(true); // ❌ Error
```

**痛点**：当你拿到一个联合类型的值时，TypeScript 只能允许你访问所有可能类型的**共有成员**。
```typescript
function getLength(obj: string | string[]) {
  return obj.length; // ✅ OK，因为 string 和 数组 都有 length 属性
}

function format(obj: string | number) {
  // return obj.toUpperCase(); // ❌ Error，因为 number 没有 toUpperCase
}
```
为了解决这个痛点，我们需要**类型收窄**。

---

## 3. 类型收窄 (Type Narrowing)

类型收窄是指 TypeScript 根据代码中的逻辑控制流（如 `if`, `switch`, `typeof`, `instanceof`），自动将宽泛的类型推断为更具体的类型。

### 3.1 `typeof` 收窄
适用于基础类型（string, number, boolean, symbol）。

```typescript
function padLeft(padding: number | string, input: string) {
  if (typeof padding === "number") {
    // ✨ 在这个块里，TS 知道 padding 是 number
    return " ".repeat(padding) + input;
  }
  // ✨ 在这里，TS 知道 padding 只能是 string
  return padding + input;
}
```

### 3.2 `in` 操作符收窄
适用于对象类型，判断属性是否存在。

```typescript
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim(); // ✅ TS 知道这是 Fish
  } else {
    animal.fly();  // ✅ TS 知道这是 Bird
  }
}
```

---

## 4. 可辨识联合 (Discriminated Unions)

这是处理复杂业务逻辑最强大的模式（也叫标签联合 Tagged Unions）。
它结合了**联合类型**和**字面量类型**，让类型收窄变得极其简单。

**核心思想**：给每个类型加一个共同的字段（通常叫 `kind` 或 `type`），作为“身份证”。

### 示例：图形计算

```typescript
// 1. 定义各个接口，每个都有唯一的 kind
interface Circle {
  kind: "circle"; // 身份证
  radius: number;
}

interface Square {
  kind: "square"; // 身份证
  sideLength: number;
}

interface Rectangle {
  kind: "rectangle"; // 身份证
  width: number;
  height: number;
}

// 2. 创建联合类型
type Shape = Circle | Square | Rectangle;

// 3. 使用可辨识联合进行收窄
function getArea(shape: Shape) {
  switch (shape.kind) {
    case "circle":
      // ✨ 自动收窄为 Circle
      return Math.PI * shape.radius ** 2;
      
    case "square":
      // ✨ 自动收窄为 Square
      return shape.sideLength ** 2;
      
    case "rectangle":
      // ✨ 自动收窄为 Rectangle
      return shape.width * shape.height;
      
    default:
      // 穷尽性检查 (Exhaustiveness Checking)
      // 如果将来加了 Triangle 但没写 case，这里会报错
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

### 为什么它比普通联合类型好？
*   **语义清晰**：一眼就知道当前处理的是什么类型。
*   **安全**：配合 `switch` 和 `never` 类型，可以确保你处理了所有可能的情况，防止遗漏。
*   **易维护**：新增类型时，编译器会引导你修改所有相关的地方。

---

## 5. 泛型 (Generics)

泛型是类型系统中的“函数参数”。它允许我们编写**可重用**的组件，而不是为每种数据类型都写一份代码。

### 5.1 基础概念

如果不使用泛型，我们可能需要写多个功能相同但类型不同的函数：

```typescript
function identityNumber(arg: number): number { return arg; }
function identityString(arg: string): string { return arg; }
```

使用泛型，我们可以把类型也变成一个变量（通常用 `<T>` 表示）：

```typescript
// T 捕获了用户传入的类型
function identity<T>(arg: T): T {
  return arg;
}

// 使用
const output1 = identity<string>("myString"); // output1 是 string
const output2 = identity(123); // output2 是 number (类型自动推断)
```

### 5.2 泛型接口与类

```typescript
// 泛型接口
interface Box<Type> {
  contents: Type;
}

let stringBox: Box<string> = { contents: "hello" };
let numberBox: Box<number> = { contents: 42 };

// 泛型类
class DataHolder<T> {
  value: T;
  constructor(v: T) {
    this.value = v;
  }
}
```

### 5.3 泛型约束 (Constraints)

有时候我们不希望 `T` 是任意类型，而是必须包含某些属性（比如 `.length`）。我们可以使用 `extends` 关键字来约束泛型。

```typescript
interface Lengthwise {
  length: number;
}

// T 必须包含 length 属性
function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length); // ✅ OK，因为我们约束了 T 肯定有 length
  return arg;
}

loggingIdentity({ length: 10, value: 3 }); // ✅ OK
// loggingIdentity(3); // ❌ Error，数字没有 length 属性
```
