import { FC } from 'react';
import weChatImg from '@/assets/images/wechat-bottom.png';
import paymentCode from '@/assets/images/payment-code.jpg';

import './style.less';

interface IProps {
  qrCode?: string
}

const VwQrCode: FC<IProps> = (props) => {
  const { 
    qrCode=paymentCode
  } = props;
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