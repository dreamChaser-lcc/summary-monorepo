import { FunctionalComponent } from 'vue';

interface IProps {}
type TEmitEvent = {
  callback: (value: any) => void;
};
/*
 * @Author: lcc
 * @Date: 2024-06-30 16:27:39
 * @LastEditTime: 2024-06-30 21:02:04
 * @LastEditors: lcc
 * @Description: tsx函数组件
 */
const MTsxFc: FunctionalComponent<IProps, TEmitEvent> = (props, context) => {
  const { attrs, slots, emit } = context;

  // 作用域回传给父组件的值(渲染的时候就会回传)
  const scopeValue = 'subValue';

  return (
    <>
      {slots['default']?.(scopeValue)}
      {slots['content']?.(scopeValue)}
      <div>
        <m-button onClick={() => emit('callback', '我是回传的值')}>
          子组件的tsx函数组件 button,点我试试
        </m-button>
      </div>
    </>
  );
};
export default MTsxFc;
