# JavaScript 隐式转换规则速查

## 总体原则
- JS 在需要时会自动进行类型转换，通常分三步：先做 ToPrimitive（对象变原始值），再按语境做 ToNumber / ToString / ToBoolean。
- 触发时机由操作符和语境决定：算术运算、比较、字符串拼接、条件判断都会触发不同的转换。

## 三类转换
- ToBoolean（布尔语境）
  - falsy：false、0、-0、0n、NaN、""、null、undefined
  - 其他都是真值：[]、{}、"0"、"false" 都是 truthy
- ToNumber（数值语境）
  - "42"→42；"  \n"→0；""→0；"0xF"→15；"1e3"→1000
  - true→1，false→0；null→0；undefined→NaN
  - []→0；[1]→1；[1,2]→NaN；{}→NaN
- ToString（字符串语境）
  - 数字→其字符串表示；对象→先 ToPrimitive，再用 toString 或 valueOf 的结果
  - 数组→元素用逗号拼接："[1,2]" 实际是 "1,2"

## 对象转原始（ToPrimitive）
- 提示（hint）：多数算术是 "number"；字符串拼接是 "string"；部分比较是 "default"
- 顺序：有 Symbol.toPrimitive 则用它；否则按 hint 调用 valueOf / toString（Date 优先 toString）
- 可通过实现 Symbol.toPrimitive / valueOf / toString 控制对象在不同语境下的表现

## 操作符行为
- 加法 +
  - 若任一操作数最终为字符串 → 字符串拼接
  - 否则 → 转数字后做加法
  - 示例："5"+3 → "53"；"5"-3 → 2；[]+1 → "1"
- 其他算术（- * / % **）
  - 强制数值化（ToNumber）
  - 示例：true+1 → 2；"6"*2 → 12
- 关系比较（< > <= >=）
  - 两边都是字符串时按字典序比较；否则转数字比较
  - 示例："2" > 10 → false；"a" < "b" → true
- 等号
  - === 不做转换（类型和值都相等）
  - == 做宽松转换，重要规则：
    - null == undefined → true（且与其他都不相等）
    - Number == String → 比较 Number 与 ToNumber(String)
    - Boolean == 任何 → 先把 Boolean 转 Number
    - Object == 原始值 → 先 ToPrimitive(Object)
    - BigInt 与 Number：1n == 1 → true；1.1 == 1n → false
    - NaN 与任何比较都不相等（包括自身）

## 典型示例

```javascript
"5" + 3      // "53"
"5" - 3      // 2
true + 1     // 2
[] + {}      // "[object Object]"
[] == 0      // true    （[] -> "" -> 0）
"0" == false // true    （"0" -> 0，false -> 0）
NaN == NaN   // false   （用 Number.isNaN 或 Object.is 判断）
[1] + 2      // "12"    （[1] -> "1"，拼接）
[1,2] + 3    // "1,23"
```

## 常见陷阱
- "+" 的双重语义：既能数值相加又能字符串拼接，易因隐式转换导致错误
- []、{} 在不同语境下的表现差异大；尤其空数组/对象参与 == 或 +
- BigInt 与 Number 的宽松比较：避免跨类型数值比较，优先统一类型

## 实践建议
- 用 === / !== 代替 ==
- 显式转换，避免隐式：Number(x)、String(x)、Boolean(x)
- 字符串拼接用模板字符串："total: ${n}"
- 自定义对象的转换行为需明确实现：

```javascript
const obj = {
  [Symbol.toPrimitive](hint) {
    if (hint === 'string') return 'OBJ';
    return 42;
  }
};
'' + obj   // "OBJ"
obj + 1    // 43
```
