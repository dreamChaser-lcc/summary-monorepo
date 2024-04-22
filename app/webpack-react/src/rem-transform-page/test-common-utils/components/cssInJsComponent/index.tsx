import { FC } from "react";
import styled from 'styled-components';

/**
 * CssInJs 样式隔离Demo组件 
 */
const CssInJsComponent:FC = ()=>{
  const CustomComponent = styled.div`
    color: blue;
  `
  return <>
    <CustomComponent>
      我是cssInJs的组件,会生成hash的类名
    </CustomComponent>
  </>
}
export default CssInJsComponent;