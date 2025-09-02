// Widget Configuration Validator utility
import { WidgetConfig } from './WidgetFactory';

export interface ValidationRule {
  field: keyof WidgetConfig | string;
  validate: (value: any, config: WidgetConfig) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Predefined validation rules
export const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'instanceId',
    validate: (value) => typeof value === 'string' && value.length > 0,
    message: 'Instance ID must be a non-empty string'
  },
  {
    field: 'widgetId',
    validate: (value) => typeof value === 'string' && value.length > 0,
    message: 'Widget ID must be a non-empty string'
  },
  {
    field: 'name',
    validate: (value) => typeof value === 'string' && value.trim().length > 0,
    message: 'Widget name must be a non-empty string'
  },
  {
    field: 'componentName',
    validate: (value) => typeof value === 'string' && value.length > 0,
    message: 'Component name must be a non-empty string'
  },
  {
    field: 'tabId',
    validate: (value) => typeof value === 'string' && value.length > 0,
    message: 'Tab ID must be a non-empty string'
  },
  {
    field: 'layout.w',
    validate: (value) => typeof value === 'number' && value > 0,
    message: 'Layout width must be a positive number'
  },
  {
    field: 'layout.h',
    validate: (value) => typeof value === 'number' && value > 0,
    message: 'Layout height must be a positive number'
  },
  {
    field: 'position',
    validate: (value) => typeof value === 'number' && value >= 0,
    message: 'Position must be a non-negative number'
  }
];

// Layout-specific validation rules
export const LAYOUT_VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'layout',
    validate: (value, config) => {
      if (config.layout.minW && config.layout.w < config.layout.minW) {
        return false;
      }
      return true;
    },
    message: 'Widget width is below minimum constraint'
  },
  {
    field: 'layout',
    validate: (value, config) => {
      if (config.layout.minH && config.layout.h < config.layout.minH) {
        return false;
      }
      return true;
    },
    message: 'Widget height is below minimum constraint'
  },
  {
    field: 'layout',
    validate: (value, config) => {
      if (config.layout.maxW && config.layout.w > config.layout.maxW) {
        return false;
      }
      return true;
    },
    message: 'Widget width exceeds maximum constraint'
  },
  {
    field: 'layout',
    validate: (value, config) => {
      if (config.layout.maxH && config.layout.h > config.layout.maxH) {
        return false;
      }
      return true;
    },
    message: 'Widget height exceeds maximum constraint'
  }
];

export class WidgetConfigValidator {
  private rules: ValidationRule[];

  constructor(customRules: ValidationRule[] = []) {
    this.rules = [...DEFAULT_VALIDATION_RULES, ...LAYOUT_VALIDATION_RULES, ...customRules];
  }

  /**
   * Validates a widget configuration against all rules
   * @param config Widget configuration to validate
   * @returns Validation result
   */
  validate(config: WidgetConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      try {
        const fieldValue = this.getFieldValue(config, rule.field);
        if (!rule.validate(fieldValue, config)) {
          errors.push(rule.message);
        }
      } catch (error) {
        warnings.push(`Validation rule failed for field ${rule.field}: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates multiple widget configurations
   * @param configs Array of widget configurations
   * @returns Array of validation results
   */
  validateMany(configs: WidgetConfig[]): ValidationResult[] {
    return configs.map(config => this.validate(config));
  }

  /**
   * Adds a custom validation rule
   * @param rule Validation rule to add
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Removes a validation rule by field name
   * @param field Field name to remove rules for
   */
  removeRule(field: string): void {
    this.rules = this.rules.filter(rule => rule.field !== field);
  }

  /**
   * Gets field value from nested object path
   * @param obj Object to get value from
   * @param path Dot-separated path to field
   * @returns Field value
   */
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Predefined validator instances
export const defaultValidator = new WidgetConfigValidator();

// Category-specific validators
export const dashboardWidgetValidator = new WidgetConfigValidator([
  {
    field: 'category',
    validate: (value) => value === 'Dashboard',
    message: 'Widget must be in Dashboard category'
  }
]);

export const systemWidgetValidator = new WidgetConfigValidator([
  {
    field: 'category',
    validate: (value) => value === 'System',
    message: 'Widget must be in System category'
  },
  {
    field: 'settings.showTitle',
    validate: (value) => value === true,
    message: 'System widgets must show title'
  }
]);