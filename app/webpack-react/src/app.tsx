import { FC, useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./assets/index.less";
import "./assets/global.less";

const App: FC = () => {
  const navigate = useNavigate();
  let location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const tabList = [
    { link: '/rem', name: 'rem适配' },
    { link: '/concurrent', name: '并发渲染' },
    { link: '/deferred', name: 'DeferredValue' },
    { link: '/suspense', name: 'Suspense' },
    { link: '/vw', name: 'vw适配' },
    { link: '/rem-test-common-utils', name: '公共包引用' },
  ];

  const jumpTo = (link: string) => {
    navigate(link);
  }

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth / 2;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="app-container">
      {/* 保持原有的 .tab-nav 类名和层级结构，内部增加滚动容器 */}
      <div className="tab-nav">
        {showLeftArrow && (
          <div className="nav-arrow left-arrow" onClick={() => scroll('left')}>
            &lt;
          </div>
        )}
        
        <div 
          className="tab-nav-scroll" 
          ref={scrollContainerRef}
          onScroll={checkScroll}
        >
          {tabList.map(item => (
            <div 
              className={`tab-item ${item.link === location.pathname ? 'active' : ''}`} 
              key={item.link} 
              onClick={() => jumpTo(item.link)}
            >
              {item.name}
            </div>
          ))}
        </div>

        {showRightArrow && (
          <div className="nav-arrow right-arrow" onClick={() => scroll('right')}>
            &gt;
          </div>
        )}
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
