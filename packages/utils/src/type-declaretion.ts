/**
 * implements 接口(interface)的类型的继承并要实现
 */
class Control {
  private state: any;
}

interface SelectableControl extends Control {
  select(): void;
}

class Button extends Control implements SelectableControl {
  select() { }
}

class TextBox extends Control {
  select() { }
}

// // 错误：“Image”类型缺少“state”属性。
// class Image implements SelectableControl {
//   select() { }
// }

// class Location {

// }

/** ----------------------分割线------------------------------ */