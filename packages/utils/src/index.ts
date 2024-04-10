/** 
 * tips:
 * 导出语法解析看这里
 * https://mp.weixin.qq.com/s/duSQ_f4KmF8gvrQ5NRjJ5w
 */

/**
 * 等价于 
 * import { CONSTANT_VERSION } from './_setup.js';
 * export { CONSTANT_VERSION };
 * 合成了一步骤，省略了import
 */
export { CONSTANT_VERSION } from './_setup';

/**
 * 等价于 
 * import * as testUtil from './testUtils.js';
 * export { testUtil };
 * 合成了一步骤，省略了import
 */
export { default as testUtil } from './testUtils';
