import { FC, useEffect, useState } from "react";
import { CONSTANT_VERSION, testUtil } from "@summary-monorepo/utils";
import underscore from "@/underscore-umd-min.js";
import * as utils from "@summary-monorepo/utils";
import paymentCode from "@/assets/images/payment-code.jpg";
import PreviewImg from "@/rem-transform-page/test-common-utils/components/previewImg";

// cssModule样式隔离Demo组件
import UseCssModule from '@/rem-transform-page/test-common-utils/components/useCssModule';
// cssInJs样式隔离Demo组件
import CssInJsComponent from '@/rem-transform-page/test-common-utils/components/cssInJsComponent';

// import { CONSTANT_VERSION } from "@summary-monorepo/utils/setup";

import "./style.less";

interface IProps {}

const TestCommonUtils: FC<IProps> = () => {
  // console.log('使用umd模块, underscore', underscore);
  console.log("公共方法 CONSTANT_VERSION", CONSTANT_VERSION, utils.isPc());

  const [poster, setPoster] = useState<string>("");
  const [previewAble, setPreviewAble] = useState<boolean>(false);
  const [canvasBackground, setCanvasBackground] = useState<string>('');

  const canvasConfig = {
    cardWidth: 500,
    cardHeight: 600,
  };

  // 画一张海报
  useEffect(() => {
    utils.drawCard({
      bgUrl: canvasBackground, // 海报背景
      cardWidth: canvasConfig.cardWidth,
      cardHeight: canvasConfig.cardHeight,
      contents: [
        // 头像
        {
          type: "image",
          url: paymentCode,
          style: {
            left: 32,
            top: 28,
            width: 72,
            height: 72,
            // 下面是裁剪圆形图片的设置
            isClip: true,
            x: 32,
            y: 28,
            r: 36,
            w: 72,
            h: 72,
          },
        },
        // 用户名
        {
          type: "singleText",
          text: "用户名lcc",
          style: {
            left: 120,
            top: 80,
            font: 32,
            color: "#000",
            fontWeight: "bold",
            bolder: true,
            align: "left",
          },
        },
        // 描述
        {
          type: "multiText",
          text: "这是一个多行会换行的用户描述最多三行，很长很长很长很长，很长很长很长很长很长很长很长很长",
          style: {
            left: 36,
            top: 150,
            font: 16,
            color: "#000",
            fontWeight: "bold",
            bolder: true,
            align: "left",
            width: 420,
            maxLine: 3,
            lineHeight: 32,
          },
        },
      ],
      cb: (dataUrl) => {
        console.log(dataUrl);
        setPoster(dataUrl);
      },
      imgType: "image/png",
    });
  }, [canvasBackground]);

  const onChangePreview = () => {
    setPreviewAble(prev=>{
      return !prev;
    });
  };

  function handleFileChange(event) {
    const file = event.target.files[0];
    // 处理上传的文件
    var reader = new FileReader();
    if (file) {
      reader.readAsDataURL(file);
    }
    reader.onload = ()=>{
      console.log('reader result', reader.result);
      setCanvasBackground(reader.result as string)
    }
  }

  return (
    <div className="test-common-utils-container">
      <div>公共方法库版本：{CONSTANT_VERSION}</div>
      <div>当前窗口模式：{utils.isPc() ? "PC" : "移动端H5"}</div>
      <div className="canvas-wrap">
        <div>canvas生成海报库（点击下方预览）</div>
        <img
          className="canvas-poster"
          onClick={onChangePreview}
          src={poster}
          alt="canvas生成的图片，点击预览"
        />
        <div className="canvas-actions">
          上传替换海报背景：<br/>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
      </div>
      {previewAble && <PreviewImg imgUrl={poster} onClose={onChangePreview} />}
      <UseCssModule/>
      <CssInJsComponent/>
    </div>
  );
};

export default TestCommonUtils;
