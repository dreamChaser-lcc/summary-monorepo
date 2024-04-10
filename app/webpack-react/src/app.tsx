import { FC } from "react";
import RemQrCode from '@/rem-transform-page/qr-code';
import VwQrCode from '@/vw-transform-page/qr-code';
import { CONSTANT_VERSION, testUtil } from '@summary-monorepo/utils';
import underscore from './underscore-umd-min.js';

import "./assets/index.less";
import "./assets/global.less";

const App:FC = ()=> {
  
  console.log("🚀 ~ CONSTANT_VERSION:", CONSTANT_VERSION,testUtil())

  console.log("umd 模块导入", underscore.create)
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