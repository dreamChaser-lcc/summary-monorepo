# TypeScript 面向对象核心：多态、重载、继承与重写

本文档详细解析 TypeScript 中的四大面向对象编程 (OOP) 概念，帮助开发者区分容易混淆的 **重载 (Overload)** 与 **重写 (Override)**。

## 1. 继承 (Inheritance)
**定义**：子类继承父类的属性和方法，实现代码复用。

```typescript
class Animal {
  move(distance: number) {
    console.log(`Animal moved ${distance}m.`);
  }
}

class Dog extends Animal {
  bark() {
    console.log('Woof!');
  }
}

const dog = new Dog();
dog.bark(); // 自己的方法
dog.move(10); // 继承自父类的方法
```

---

## 2. 重写 (Override)
**定义**：子类**重新实现**父类中已经存在的方法。这是实现运行时多态的关键。
**关键词**：`override` (TS 4.3+ 推荐显式使用此关键字，编译器会帮你检查父类是否真的有这个方法，防止拼写错误)。

```typescript
class Animal {
  makeSound() {
    console.log('Some generic sound');
  }
}

class Cat extends Animal {
  // ✅ 显式标记 override，如果父类没有 makeSound 方法，TS 会报错
  override makeSound() {
    console.log('Meow!');
  }
}

const cat = new Cat();
cat.makeSound(); // 输出: Meow! (执行的是子类的逻辑)
```

---

## 3. 重载 (Overload)
**定义**：同一个函数名，根据**参数列表（类型、数量）的不同**，执行不同的逻辑或返回不同的类型。
**注意**：TypeScript 的重载是**伪重载**。它只是类型系统的约束，最终编译成的 JavaScript 只有一个函数体。

```typescript
// 1. 重载签名 (Overload Signatures) - 只定义类型，不实现
function makeDate(timestamp: number): Date;
function makeDate(m: number, d: number, y: number): Date;

// 2. 实现签名 (Implementation Signature) - 真正的函数体
// 参数必须兼容上面所有的重载签名
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
  if (d !== undefined && y !== undefined) {
    return new Date(y, mOrTimestamp, d);
  } else {
    return new Date(mOrTimestamp);
  }
}

const d1 = makeDate(12345678);        // ✅ 匹配第一个签名
const d2 = makeDate(5, 5, 2022);      // ✅ 匹配第二个签名
// const d3 = makeDate(1, 3);         // ❌ 报错：没有匹配 2 个参数的签名
```

### 重载 vs 重写
| 特性 | 重载 (Overload) | 重写 (Override) |
| :--- | :--- | :--- |
| **发生位置** | 同一个类/函数中 | 父子类之间 |
| **关注点** | 参数列表必须不同 | 方法签名(参数/返回)必须兼容 |
| **目的** | 提供多种调用方式 (静态多态) | 修改父类行为 (动态多态) |

---

## 4. 多态 (Polymorphism)
**定义**：同一操作作用于不同的对象，可以有不同的解释，产生不同的执行结果。通常通过“父类引用指向子类对象”来实现。

```typescript
// 父类 (或接口)
abstract class Shape {
  abstract getArea(): number;
}

// 子类 1
class Circle extends Shape {
  constructor(private radius: number) { super(); }
  
  override getArea() {
    return Math.PI * this.radius ** 2;
  }
}

// 子类 2
class Square extends Shape {
  constructor(private side: number) { super(); }
  
  override getArea() {
    return this.side * this.side;
  }
}

// 多态的使用场景
function printArea(shape: Shape) {
  // 这里的 shape 既可能是 Circle 也可能是 Square
  // 运行时会自动调用对应子类的 getArea 方法
  console.log(`Area is: ${shape.getArea()}`);
}

const c = new Circle(5);
const s = new Square(10);

printArea(c); // Area is: 78.53... (调用 Circle.getArea)
printArea(s); // Area is: 100      (调用 Square.getArea)
```

**总结**：多态让我们的代码只依赖于抽象（`Shape`），而不需要依赖具体的实现（`Circle` 或 `Square`），极大地提高了代码的可扩展性。
