import { FC } from "react";
import RemQrCode from './rem-transform-page/qr-code';
import VwQrCode from './vw-transform-page/qr-code';

import "./assets/index.less";
import "./assets/global.less";

const App:FC = ()=> {
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