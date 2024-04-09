import { FC } from "react";
import RemQrCode from './rem-transform-page/qr-code';
import VwQrCode from './vw-transform-page/qr-code';
// @ts-ignore
import  *  as allUtils from '@summary-monorepo/utils';
// @ts-ignore
import underscore from './underscore-umd-min.js';

import "./assets/index.less";
import "./assets/global.less";

const App:FC = ()=> {
  allUtils.testUtil();
  console.log("🚀 ~ underscore:", underscore.create)
  console.log('我要打印答应1',allUtils.VERSION,allUtils)
  return (
    <div className="app-container">
      {/* vw适配方案 */}
      <VwQrCode/>
      {/* rem适配方案 */}
      {/* <RemQrCode/> */}
    </div>
  );
}
export default App;