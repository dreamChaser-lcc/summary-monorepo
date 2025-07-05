interface Iname {
  name: string;
}

/**
 * 一个示例类，包含私有和公共方法
 */
class ExampleClass {
  private name: string;
  private age: number;

  /**
   * 构造函数 theme_implements
   * @param name 姓名
   * @param age 年龄
   * @param a 配置
   */
  constructor(name: string, age: number, a: Iname) {
    console.log(a)
    this.name = name;
    this.age = age;
  }

  /**
   * 公共方法：获取用户信息
   * @returns 用户信息字符串
   */
  public getUserInfo(): string {
    return `${this.name} is ${this.age} years old`;
  }

  /**
   * 公共方法：更新年龄
   * @param newAge 新的年龄
   */
  public updateAge(newAge: number): void {
    this.validateAge(newAge);
    this.age = newAge;
  }

  /**
   * 私有方法：验证年龄是否有效
   * @param age 要验证的年龄
   * @throws 如果年龄无效则抛出错误
   */
  private validateAge(age: number): void {
    if (age < 0 || age > 150) {
      throw new Error('Invalid age');
    }
  }

  /**
   * 私有方法：格式化名字
   * @returns 格式化后的名字
   */
  private formatName(): string {
    return this.name.trim().toLowerCase();
  }
}

// 使用示例
// const user = new ExampleClass('张三', 25);
// console.log(user.getUserInfo()); // 输出：张三 is 25 years old
// user.updateAge(26); // 使用公共方法更新年龄