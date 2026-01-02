/**
 * AutoRejectionRulesSection Component - Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.12, 4.13
 * 
 * Displays and allows configuration of flexible auto-rejection rules for job postings.
 * Features:
 * - Enable/disable toggle for auto-rejection
 * - Multiple rule support with different fields (experience, location, skills, education, salary)
 * - Field-specific operators (numeric, text, array)
 * - AND/OR logic between rules
 * - Add/remove rule functionality
 * - Clear display of configured rules
 */

import { useState } from 'react';

// Supported candidate fields for auto-rejection
export type RuleField = 'experience' | 'location' | 'skills' | 'education' | 'salary_expectation';

// Operators by field type
export type NumericOperator = 'less_than' | 'greater_than' | 'equals' | 'not_equals' | 'between';
export type TextOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains';
export type ArrayOperator = 'contains' | 'not_contains' | 'contains_all' | 'contains_any';
export type RuleOperator = NumericOperator | TextOperator | ArrayOperator;

// Logic connector for multiple rules
export type LogicConnector = 'AND' | 'OR';

// Individual auto-rejection rule
export interface AutoRejectionRule {
  id: string;
  field: RuleField;
  operator: RuleOperator;
  value: number | string | string[] | [number, number];
  logicConnector?: LogicConnector;
}

// Complete auto-rejection rules configuration
export interface AutoRejectionRules {
  enabled: boolean;
  rules: AutoRejectionRule[];
}

// Field configuration for UI
const RULE_FIELDS: { value: RuleField; label: string; type: 'numeric' | 'text' | 'array' }[] = [
  { value: 'experience', label: 'Experience (Years)', type: 'numeric' },
  { value: 'location', label: 'Location', type: 'text' },
  { value: 'skills', label: 'Skills', type: 'array' },
  { value: 'education', label: 'Education', type: 'text' },
  { value: 'salary_expectation', label: 'Salary Expectation', type: 'numeric' },
];

// Operators by field type
const OPERATORS_BY_TYPE: Record<'numeric' | 'text' | 'array', { value: RuleOperator; label: string }[]> = {
  numeric: [
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
  ],
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
  ],
  array: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'contains_all', label: 'Contains all of' },
    { value: 'contains_any', label: 'Contains any of' },
  ],
};

// Default auto-rejection rules
export const DEFAULT_AUTO_REJECTION_RULES: AutoRejectionRules = {
  enabled: false,
  rules: [],
};

export interface AutoRejectionRulesSectionProps {
  value?: AutoRejectionRules;
  onChange?: (rules: AutoRejectionRules) => void;
  readOnly?: boolean;
}

// Generate unique ID for rules
const generateRuleId = () => `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Get field type
const getFieldType = (field: RuleField): 'numeric' | 'text' | 'array' => {
  return RULE_FIELDS.find(f => f.value === field)?.type || 'text';
};

// Get default operator for field type
const getDefaultOperator = (fieldType: 'numeric' | 'text' | 'array'): RuleOperator => {
  return OPERATORS_BY_TYPE[fieldType][0].value;
};

// Get default value for field type
const getDefaultValue = (fieldType: 'numeric' | 'text' | 'array'): number | string | string[] => {
  switch (fieldType) {
    case 'numeric': return 0;
    case 'array': return [];
    default: return '';
  }
};


export function AutoRejectionRulesSection({
  value = DEFAULT_AUTO_REJECTION_RULES,
  onChange,
  readOnly = false,
}: AutoRejectionRulesSectionProps) {
  // Ensure we always have a valid rules object
  const safeValue: AutoRejectionRules = {
    enabled: value?.enabled ?? false,
    rules: Array.isArray(value?.rules) ? value.rules : [],
  };

  const [skillInput, setSkillInput] = useState<Record<string, string>>({});

  const isEditable = onChange && !readOnly;

  const handleToggleEnabled = () => {
    if (onChange) {
      onChange({
        ...safeValue,
        enabled: !safeValue.enabled,
      });
    }
  };

  const handleAddRule = () => {
    if (onChange) {
      const newRule: AutoRejectionRule = {
        id: generateRuleId(),
        field: 'experience',
        operator: 'less_than',
        value: 0,
        logicConnector: 'OR',
      };
      onChange({
        ...safeValue,
        rules: [...safeValue.rules, newRule],
      });
    }
  };

  const handleRemoveRule = (ruleId: string) => {
    if (onChange) {
      onChange({
        ...safeValue,
        rules: safeValue.rules.filter(r => r.id !== ruleId),
      });
    }
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<AutoRejectionRule>) => {
    if (onChange) {
      onChange({
        ...safeValue,
        rules: safeValue.rules.map(r => {
          if (r.id !== ruleId) return r;
          
          // If field changed, reset operator and value to defaults
          if (updates.field && updates.field !== r.field) {
            const newFieldType = getFieldType(updates.field);
            return {
              ...r,
              ...updates,
              operator: getDefaultOperator(newFieldType),
              value: getDefaultValue(newFieldType),
            };
          }
          
          return { ...r, ...updates };
        }),
      });
    }
  };

  const handleAddSkill = (ruleId: string) => {
    const input = skillInput[ruleId]?.trim();
    if (!input) return;

    const rule = safeValue.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const currentSkills = Array.isArray(rule.value) ? (rule.value as string[]) : [];
    if (!currentSkills.includes(input)) {
      handleUpdateRule(ruleId, { value: [...currentSkills, input] });
    }
    setSkillInput(prev => ({ ...prev, [ruleId]: '' }));
  };

  const handleRemoveSkill = (ruleId: string, skill: string) => {
    const rule = safeValue.rules.find(r => r.id === ruleId);
    if (!rule || !Array.isArray(rule.value)) return;

    handleUpdateRule(ruleId, { value: (rule.value as string[]).filter(s => s !== skill) });
  };

  const renderValueInput = (rule: AutoRejectionRule) => {
    const fieldType = getFieldType(rule.field);

    if (fieldType === 'numeric') {
      return (
        <input
          type="number"
          min="0"
          step={rule.field === 'experience' ? '0.5' : '1000'}
          value={typeof rule.value === 'number' ? rule.value : 0}
          onChange={(e) => handleUpdateRule(rule.id, { value: parseFloat(e.target.value) || 0 })}
          disabled={!isEditable}
          className="w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-100"
          placeholder={rule.field === 'experience' ? 'Years' : 'Amount'}
        />
      );
    }

    if (fieldType === 'array') {
      const skills = Array.isArray(rule.value) ? (rule.value as string[]) : [];
      return (
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap gap-1 mb-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {skill}
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(rule.id, String(skill))}
                    className="hover:text-blue-900"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditable && (
            <div className="flex gap-1">
              <input
                type="text"
                value={skillInput[rule.id] || ''}
                onChange={(e) => setSkillInput(prev => ({ ...prev, [rule.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(rule.id))}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Add skill..."
              />
              <button
                type="button"
                onClick={() => handleAddSkill(rule.id)}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          )}
        </div>
      );
    }

    // Text field
    return (
      <input
        type="text"
        value={typeof rule.value === 'string' ? rule.value : ''}
        onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
        disabled={!isEditable}
        className="flex-1 min-w-[150px] px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-100"
        placeholder={rule.field === 'location' ? 'e.g., USA, Remote' : 'Enter value...'}
      />
    );
  };


  const renderRule = (rule: AutoRejectionRule, index: number) => {
    const fieldType = getFieldType(rule.field);
    const operators = OPERATORS_BY_TYPE[fieldType];

    return (
      <div key={rule.id} className="space-y-2">
        {/* Logic connector (shown between rules) */}
        {index > 0 && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-gray-200"></div>
            {isEditable ? (
              <select
                value={safeValue.rules[index - 1]?.logicConnector || 'OR'}
                onChange={(e) => handleUpdateRule(safeValue.rules[index - 1].id, { logicConnector: e.target.value as LogicConnector })}
                className="px-2 py-0.5 text-xs font-medium border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="OR">OR</option>
                <option value="AND">AND</option>
              </select>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                {safeValue.rules[index - 1]?.logicConnector || 'OR'}
              </span>
            )}
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
        )}

        {/* Rule row */}
        <div className="flex flex-wrap items-start gap-2 p-3 bg-white border border-gray-200 rounded-lg">
          {/* Field selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Field</label>
            {isEditable ? (
              <select
                value={rule.field}
                onChange={(e) => handleUpdateRule(rule.id, { field: e.target.value as RuleField })}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {RULE_FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-gray-700">
                {RULE_FIELDS.find(f => f.value === rule.field)?.label}
              </span>
            )}
          </div>

          {/* Operator selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Condition</label>
            {isEditable ? (
              <select
                value={rule.operator}
                onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as RuleOperator })}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-gray-700">
                {operators.find(op => op.value === rule.operator)?.label}
              </span>
            )}
          </div>

          {/* Value input */}
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase">Value</label>
            {renderValueInput(rule)}
          </div>

          {/* Delete button */}
          {isEditable && (
            <button
              type="button"
              onClick={() => handleRemoveRule(rule.id)}
              className="self-end p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Remove rule"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={safeValue.enabled}
              onChange={handleToggleEnabled}
              disabled={!isEditable}
              className="sr-only peer"
            />
            <div className={`
              w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 
              peer-focus:ring-blue-300 rounded-full peer 
              peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:border-gray-300 after:border after:rounded-full 
              after:h-5 after:w-5 after:transition-all 
              peer-checked:bg-blue-600
              ${!isEditable ? 'opacity-60 cursor-not-allowed' : ''}
            `}></div>
          </label>
          <div>
            <span className="text-sm font-medium text-gray-900">
              Enable Auto-Rejection
            </span>
            <p className="text-xs text-gray-500">
              Automatically reject candidates who don't meet specified criteria
            </p>
          </div>
        </div>
        
        {safeValue.enabled && safeValue.rules.length > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {safeValue.rules.length} rule{safeValue.rules.length !== 1 ? 's' : ''} configured
          </span>
        )}
      </div>


      {/* Rules Configuration - Only show when enabled */}
      {safeValue.enabled && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          {/* Rules list */}
          {safeValue.rules.length > 0 ? (
            <div className="space-y-2">
              {safeValue.rules.map((rule, index) => renderRule(rule, index))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No rules configured. Add a rule to start auto-rejecting candidates.
            </p>
          )}

          {/* Add Rule Button */}
          {isEditable && (
            <button
              type="button"
              onClick={handleAddRule}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Rule
            </button>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-amber-700">
              <p className="font-medium">Important:</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>Auto-rejection rules only apply to new applications</li>
                <li>Existing candidates will not be affected by rule changes</li>
                <li>Rejected candidates will be moved to the "Rejected" stage with a specific reason</li>
                <li>Use OR to reject if ANY rule matches, AND to reject only if ALL rules match</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary when disabled */}
      {!safeValue.enabled && (
        <p className="text-xs text-gray-400 italic">
          Auto-rejection is disabled. All candidates will be processed normally.
        </p>
      )}

      {/* Active Rules Summary when enabled */}
      {safeValue.enabled && safeValue.rules.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <h4 className="text-xs font-semibold text-blue-800 mb-2">Active Rules Summary</h4>
          <ul className="space-y-1">
            {safeValue.rules.map((rule, index) => {
              const fieldLabel = RULE_FIELDS.find(f => f.value === rule.field)?.label || rule.field;
              const operatorLabel = OPERATORS_BY_TYPE[getFieldType(rule.field)]
                .find(op => op.value === rule.operator)?.label || rule.operator;
              const valueStr = Array.isArray(rule.value) 
                ? rule.value.join(', ') || '(none)'
                : String(rule.value);
              const connector = index > 0 ? (safeValue.rules[index - 1]?.logicConnector || 'OR') : '';

              return (
                <li key={rule.id} className="flex items-center gap-2 text-xs text-blue-700">
                  {index > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-[10px] font-medium">
                      {connector}
                    </span>
                  )}
                  <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {fieldLabel} {operatorLabel.toLowerCase()} <strong>{valueStr}</strong>
                    {rule.field === 'experience' && ' years'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AutoRejectionRulesSection;
