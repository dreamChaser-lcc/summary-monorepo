import { createApp, defineComponent, ref, h } from 'vue';
import { SchemaForm } from './SchemaForm';
import { userForm } from './schemas/user';

/**
 * 创建并挂载一个演示应用
 * @param el 根容器选择器
 */
export function mountDemo(el: string) {
  const App = defineComponent({
    name: 'DemoApp',
    setup() {
      const model = ref<Record<string, any>>({});

      /**
       * 处理表单提交
       * @param payload 提交的数据
       */
      function onSubmit(payload: Record<string, any>) {
        console.log('submit', payload);
      }

      return () => h('div', { style: 'padding:16px' }, [
        h('h3', 'Schema 表单示例'),
        h(SchemaForm as any, {
          schema: userForm,
          modelValue: model.value,
          'onUpdate:modelValue': (v: any) => (model.value = v),
          onSubmit,
        }),
      ]);
    },
  });

  createApp(App).mount(el);
}*** End Patch```  } -->
