import { defineComponent, h, ref, watch, onBeforeUnmount } from 'vue';
import type { FieldSchema, FormSchema, VisibleRule, FieldType } from './types';

const validatorMap: Record<string, (val: any, args?: Record<string, any>) => string | null> = {
  required: (v) => (v === undefined || v === null || v === '' ? '必填项' : null),
  minLength: (v, args) => (typeof v === 'string' && v.length < args?.n ? `至少 ${args?.n} 个字符` : null),
  maxLength: (v, args) => (typeof v === 'string' && v.length > args?.n ? `最多 ${args?.n} 个字符` : null),
  min: (v, args) => (typeof v === 'number' && v < args?.n ? `最小值 ${args?.n}` : null),
  max: (v, args) => (typeof v === 'number' && v > args?.n ? `最大值 ${args?.n}` : null),
  email: (v) => (v && !/.+@.+\..+/.test(v) ? '邮箱格式不正确' : null),
  pattern: (v, args) => (v && args?.re && !(new RegExp(args.re).test(v)) ? '格式不匹配' : null),
};

/**
 * 计算字段可见性
 * @param rule 可见性规则
 * @param model 当前表单数据
 * @returns 是否可见
 */
export function evaluateVisible(rule: VisibleRule | undefined, model: Record<string, any>): boolean {
  if (!rule) return true;
  const { op } = rule;
  if (op === 'and') return (rule.rules || []).every(r => evaluateVisible(r, model));
  if (op === 'or') return (rule.rules || []).some(r => evaluateVisible(r, model));
  if (op === 'not') return !(rule.rules && rule.rules[0] ? evaluateVisible(rule.rules[0], model) : true);
  const left = model[rule.field!];
  if (op === 'eq') return left === rule.value;
  if (op === 'ne') return left !== rule.value;
  if (op === 'in') return Array.isArray(rule.value) && rule.value.includes(left);
  if (op === 'nin') return Array.isArray(rule.value) && !rule.value.includes(left);
  return true;
}

type VNodeChild = any;

const registry: Record<FieldType, (p: {
  field: FieldSchema; value: any; onChange: (v: any) => void; options?: Array<{label: string; value: any}>;
}) => VNodeChild> = {
  input: ({ field, value, onChange }) => h('input', {
    value: value ?? '',
    placeholder: field.placeholder || '',
    onInput: (e: any) => onChange(e.target.value),
  }),
  number: ({ field, value, onChange }) => h('input', {
    type: 'number',
    value: value ?? '',
    placeholder: field.placeholder || '',
    min: field.extra?.min, max: field.extra?.max, step: field.extra?.step || 1,
    onInput: (e: any) => onChange(e.target.value === '' ? undefined : Number(e.target.value)),
  }),
  select: ({ field, value, onChange, options }) => h('select', {
    value: value ?? '',
    onChange: (e: any) => onChange(e.target.value),
  }, (options || []).map(o => h('option', { value: o.value }, o.label))),
  checkbox: ({ value, onChange }) => h('input', {
    type: 'checkbox',
    checked: !!value,
    onChange: (e: any) => onChange(!!e.target.checked),
  }),
  radio: ({ field, value, onChange, options }) =>
    h('div', {}, (options || []).map(o =>
      h('label', {}, [
        h('input', { type: 'radio', name: field.name, value: o.value, checked: value === o.value,
          onChange: (e: any) => e.target.checked && onChange(o.value) }),
        o.label,
      ])
    )),
  date: ({ value, onChange }) => h('input', {
    type: 'date',
    value: value ?? '',
    onInput: (e: any) => onChange(e.target.value),
  }),
};

const optionsCache = new Map<string, Array<{label: string; value: any}>>();

/**
 * 加载选项
 * @param field 字段定义
 * @param controller 取消控制器
 * @returns 选项列表
 */
export async function loadOptions(field: FieldSchema, controller: AbortController) {
  const key = `${field.name}:${field.optionsSource?.url}`;
  if (field.optionsSource?.cache && optionsCache.has(key)) return optionsCache.get(key)!;
  if (field.optionsSource?.type === 'static') return field.optionsSource.options || [];
  if (field.optionsSource?.type === 'http' && field.optionsSource.url) {
    const res = await fetch(field.optionsSource.url, { method: field.optionsSource.method || 'GET', signal: controller.signal });
    const data = await res.json();
    const vk = field.optionsSource.valueKey || 'value';
    const lk = field.optionsSource.labelKey || 'label';
    const list = (Array.isArray(data) ? data : data?.data || []).map((it: any) => ({ label: it[lk], value: it[vk] }));
    if (field.optionsSource.cache) optionsCache.set(key, list);
    return list;
  }
  return [];
}

/**
 * SchemaForm 组件：将 Schema 渲染为表单
 * @returns Vue 组件
 */
export const SchemaForm = defineComponent({
  name: 'SchemaForm',
  props: {
    schema: { type: Object as () => FormSchema, required: true },
    modelValue: { type: Object as () => Record<string, any>, required: true },
  },
  emits: ['update:modelValue', 'submit', 'validate'],
  setup(props, { emit }) {
    const model = ref({ ...props.modelValue });
    const errors = ref<Record<string, string[]>>({});
    const aborters = new Map<string, AbortController>();

    watch(() => props.modelValue, v => { model.value = { ...v }; });

    /**
     * 更新字段值
     * @param name 字段名
     * @param val 值
     */
    function update(name: string, val: any) {
      model.value = { ...model.value, [name]: val };
      emit('update:modelValue', model.value);
      validateField(name);
    }

    /**
     * 校验字段
     * @param name 字段名
     */
    function validateField(name: string) {
      const field = props.schema.fields.find(f => f.name === name);
      if (!field) return;
      const vis = evaluateVisible(field.visibleWhen, model.value);
      const res: string[] = [];
      if (vis && field.validators) {
        for (const v of field.validators) {
          const fn = validatorMap[v.name];
          if (!fn) continue;
          const msg = fn(model.value[name], v.args);
          if (msg) res.push(v.message || msg);
        }
      }
      errors.value = { ...errors.value, [name]: res };
      emit('validate', { name, valid: res.length === 0, messages: res });
    }

    /**
     * 表单提交
     * @param e 事件对象
     */
    function submit(e: Event) {
      e.preventDefault();
      const names = props.schema.fields.map(f => f.name);
      names.forEach(validateField);
      const allOk = Object.values(errors.value).every(arr => (arr?.length ?? 0) === 0);
      if (allOk) emit('submit', model.value);
    }

    onBeforeUnmount(() => {
      aborters.forEach(a => a.abort());
      aborters.clear();
    });

    return () => h('form', { onSubmit: submit }, props.schema.fields.map(field => {
      const visible = evaluateVisible(field.visibleWhen, model.value);
      if (!visible) return null;

      let options: Array<{label: string; value: any}> | undefined;
      if (field.type === 'select' || field.type === 'radio') {
        const controller = new AbortController();
        aborters.set(field.name, controller);
        loadOptions(field, controller).then(list => { options = list; }).catch(() => {});
      }

      const comp = registry[field.type];
      const node = comp({ field, value: model.value[field.name], onChange: (v) => update(field.name, v), options });
      const err = errors.value[field.name]?.[0];
      return h('div', { style: 'margin-bottom:12px' }, [
        h('label', { style: `display:inline-block;width:${props.schema.labelWidth || 100}px` }, field.label),
        node,
        err ? h('div', { style: 'color:#d03050;font-size:12px;margin-top:4px' }, err) : null,
      ]);
    }));
  },
});*** End Patch ```} -->
