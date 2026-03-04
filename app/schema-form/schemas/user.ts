import type { FormSchema } from '../types';

/**
 * 用户信息表单 Schema 示例
 * - 企业账号联动公司名称可见
 * - 邮箱必填与格式校验
 * - 年龄范围限制
 * - 城市下拉远程加载
 */
export const userForm: FormSchema = {
  labelWidth: 120,
  fields: [
    { type: 'radio', name: 'accountType', label: '账号类型', defaultValue: 'person',
      optionsSource: { type: 'static', options: [{label:'个人', value:'person'},{label:'企业', value:'company'}] } },
    { type: 'input', name: 'company', label: '公司名称',
      visibleWhen: { op: 'eq', field: 'accountType', value: 'company' },
      validators: [{ name: 'required' }, { name: 'minLength', args: { n: 2 } }] },
    { type: 'input', name: 'email', label: '邮箱',
      validators: [{ name: 'required' }, { name: 'email' }] },
    { type: 'number', name: 'age', label: '年龄', extra: { min: 18, max: 60 },
      validators: [{ name: 'min', args: { n: 18 } }, { name: 'max', args: { n: 60 } }] },
    { type: 'select', name: 'city', label: '所在城市',
      optionsSource: { type: 'http', url: '/api/cities', valueKey: 'id', labelKey: 'name', cache: true } },
    { type: 'checkbox', name: 'agree', label: '同意协议', validators: [{ name: 'required', message: '需同意协议' }] },
  ],
};*** End Patch```  } ***!
