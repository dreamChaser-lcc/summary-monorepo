import { FC } from "react";

// 正常样式
import "./style.less";
// less和css 使用cssModule样式隔离
import cssModuleLess from "./style.module.less";
import cssModuleCss from "./style.module.css";

/**
 * CssModule样式隔离组件demo
 * webpack css-loader 解析后会生成新的hash类名
 */
const UseCssModule: FC = () => {
  // cssModule会将样式类名转换成类名键值对对象
  console.log('preview cssModule Object',cssModuleLess,cssModuleCss);

  return (
    <div className="use-css-module-container">
      <div>
        cssModule样式隔离demo:
      </div>
      <span className={cssModuleLess["less-container"]}>*.module.less </span>
      <span className={cssModuleCss["css-container"]}>*.module.css</span>
    </div>
  );
};
export default UseCssModule;
