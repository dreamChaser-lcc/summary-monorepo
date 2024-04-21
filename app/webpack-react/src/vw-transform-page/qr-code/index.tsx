import { FC, useEffect } from 'react';
import weChatImg from '@/assets/images/wechat-bottom.png';
import paymentCode from '@/assets/images/payment-code.jpg';
import * as utils from '@summary-monorepo/utils';

import './style.less';

interface IProps {
  qrCode?: string
}

export const VwQrCode: FC<IProps> = (props) => {

  const { 
    qrCode=paymentCode
  } = props;

  console.log('公共方法 CONSTANT_VERSION', utils.isPc());
  useEffect(()=>{
    if(utils.isPc()){
      alert("将切换VW适配方案目录，PC端暂未做适配，切换到rem适配，或切换到移动端并刷新页面调试");
    }
  },[])

  return (<div className='vw-qr-code-container'>
    <div className='title'>推荐使用微信支付</div>
    <div className='name'>lcc</div>
    <div className='time'>开始时间: 2024.04.01 12:00:00</div>
    <div className='qr-code-wrap'>
      <img className='qr-code' src={qrCode} alt="二维码" />
    </div>
    <img className='logo' src={weChatImg} alt="logo" />
  </div>)
}
export default VwQrCode;