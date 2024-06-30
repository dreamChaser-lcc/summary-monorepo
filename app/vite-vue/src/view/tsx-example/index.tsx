import { defineComponent, PropType, ref, defineEmits, reactive } from 'vue';
import type { FunctionalComponent, SetupContext } from 'vue';
import MTsxFc from '@components/m-tsx-fc';
import './style.scss';

type FComponentProps = {
  message: string;
};

type Events = {};

/**函数式组件 */
const FComponent: FunctionalComponent<FComponentProps, Events> = (props, context) => {
  const { message = '我是message啊' } = props;
  // attrs(除props定义外传递的值)，slots(插槽列表)，emit(事件派发方法)
  const { attrs, slots, emit } = context;

  const modelValue = ref('v-model在tsx写法中使用');
  const modelValue1 = ref('v-model在tsx写法中使用1');
  // ref获取元素节点
  const divRef = ref();
  console.log('🚀 ~ divRef:可以获取到dom元素', divRef);

  // emit和props传递交互
  const handleCallback = (val) => {
    console.log('🚀 ~ handleCallback ~ val: 子组件调用触发的事件', val);
    window.alert('🚀 ~ handleCallback ~ val: 子组件调用触发的事件');
  };

  // 访问子组件内部变量
  const contentSlot = (val) => {
    console.log('🚀 ~ contentSlot ~ val: 子组件内部回传的值', val);
    return <>具名作用域插槽</>;
  };

  const MTsxFcSlots = {
    default: () => <div>默认插槽</div>,
    content: contentSlot,
  };

  // 指令的使用
  const list = [
    {
      showAble: false,
      value: 'item1',
    },
    {
      showAble: true,
      value: 'list item2',
    },
    {
      showAble: true,
      value: 'list item3',
    },
  ];

  // tsx中使用v-model
  const UseVModelComponents = (props, { emit }) => {
    // console.log('🚀 ~ UseVModelComponents ~ props:', props, emit);
    return (
      <input
        value={props.modelValue}
        onInput={(e: any) => {
          emit('update:modelValue', e?.target?.value);
        }}
      ></input>
    );
  };

  return (
    <m-layout>
      {{
        summary: () => {
          return (
            <ul>
              <li>示例主要内容如下：</li>
              <li>props传递值</li>
              <li>子组件emit向父组件派发事件</li>
              <li>插槽的使用</li>
              <li>v-if,v-for和自定义指令的使用</li>
            </ul>
          );
        },
        content: () => {
          return (
            <div ref={divRef} class='tsx-example-container'>
              <MTsxFc onCallback={handleCallback} v-slots={MTsxFcSlots}></MTsxFc>
              {/* v-for和v-if替代 */}
              <div class='tsx-list-container'>
                {list.map((item) => {
                  if (!item.showAble) return null;
                  return <div class='tsx-list-item'>{item.value}</div>;
                })}
              </div>
              {/*
                v-model 
                这个是由@vitejs/plugin-vue-jsx转换的
                可以参考这个文章
                https://blog.csdn.net/cookcyq__/article/details/131440253
               */}
              <UseVModelComponents v-model={[modelValue.value, 'modelValue']} />
              <div>{modelValue.value}</div>
              <input v-model={modelValue1.value}></input>
              <div>{modelValue1.value}</div>
            </div>
          );
        },
      }}
    </m-layout>
  );
};

/**-------为函数式组件标注类型, 下面是jsx中定义格式选择的方法，用了ts不需要这么定义-------- */
// FComponent.props = {
//   message: {
//     type: String,
//     required: false
//   }
// }
// FComponent.emits = {
//   sendMessage: (value: unknown) => typeof value === 'string'
// }
export default FComponent;
