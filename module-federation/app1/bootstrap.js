/**需要异步导入共享的模块才行 */

// /**共享模块 */
import('app2_remote/commonUtils').then(({addContent}) => {
    console.log("🚀 ~ import ~ addContent:", addContent)
    return addContent();
})

import { addList } from './add-list';
addList();