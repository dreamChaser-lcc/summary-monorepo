import { FC, Suspense, lazy } from "react";
import RemQrCode from '@/rem-transform-page/qr-code';
import {VwQrCode} from '@/vw-transform-page/qr-code';
import { useNavigate, useLocation } from "react-router-dom";

import "./assets/index.less";
import "./assets/global.less";
import { Outlet } from "react-router-dom";

const App:FC = ()=> {
  const navigate = useNavigate();
  let location = useLocation();
  const tabList = [
    {
      link: '/rem',
      name: 'rem适配'
    },
    {
      link: '/vw',
      name: 'vw适配'
    },
    {
      link: '/rem-test-common-utils',
      name: '公共包引用'
    }
  ];

  const jumpTo = (link)=>{
    navigate(link);
  }

  return (
    <div className="app-container">
      <div className="tab-nav">
        {
          tabList.map(item=>{
            return <div className={`tab-item ${item.link === location.pathname ? 'active' : ''}`} key={item.link} onClick={()=>jumpTo(item.link)}>
             {item.name}
            </div>
          })
        }
      </div>
      <Outlet />
      {/* vw适配方案 */}
      {/* <VwQrCode/> */}
      {/* rem适配方案 */}
      {/* <RemQrCode/> */}
    </div>
  );
}
export default App;