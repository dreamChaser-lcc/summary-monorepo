import { FC } from 'react';
import { createPortal } from 'react-dom';
import './style.less';

interface IProps{
   imgUrl: string;
   onClose: ()=>void;
}
const PreviewImg:FC<IProps> = (props)=>{
    const { imgUrl,onClose } = props;
    
    return createPortal(<div className='preview-img-container' onClick={onClose}>
        <div className='mask'>
           <img src={imgUrl}/>
        </div>
    </div>,document.getElementById('root')|| document.body)
}
export default PreviewImg