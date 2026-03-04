export type FieldType = 'input' | 'number' | 'select' | 'checkbox' | 'radio' | 'date';

export interface VisibleRule {
  op: 'eq' | 'ne' | 'in' | 'nin' | 'and' | 'or' | 'not';
  field?: string;
  value?: any;
  rules?: VisibleRule[];
}

export type ValidatorName = 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email';

export interface Validator {
  name: ValidatorName;
  message?: string;
  args?: Record<string, any>;
}

export interface OptionsSource {
  type: 'static' | 'http';
  options?: Array<{ label: string; value: any }>;
  url?: string;
  method?: 'GET' | 'POST';
  valueKey?: string;
  labelKey?: string;
  cache?: boolean;
  timeoutMs?: number;
}

export interface FieldSchema {
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  disabled?: boolean;
  readOnly?: boolean;
  visibleWhen?: VisibleRule;
  validators?: Validator[];
  optionsSource?: OptionsSource;
  extra?: Record<string, any>;
}

export interface FormSchema {
  fields: FieldSchema[];
  labelWidth?: number;
  i18nNs?: string;
}*** End Patch``` } -->
