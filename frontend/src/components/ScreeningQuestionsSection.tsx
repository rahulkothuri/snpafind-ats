/**
 * ScreeningQuestionsSection Component
 * 
 * Allows recruiters to add screening questions when creating/editing a job.
 * Candidates must answer these questions before submitting their application.
 * 
 * Features:
 * - Add/remove questions
 * - Multiple question types: text, textarea, single choice, multiple choice, yes/no, number
 * - Mark questions as required
 * - Add options for choice-based questions
 * - Set ideal answers for knockout/scoring
 */

import { useState } from 'react';
import type { ScreeningQuestion, ScreeningQuestionType } from '../types';

const QUESTION_TYPES: { value: ScreeningQuestionType; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'yes_no', label: 'Yes/No' },
  { value: 'number', label: 'Number' },
];

export interface ScreeningQuestionsSectionProps {
  value: ScreeningQuestion[];
  onChange: (questions: ScreeningQuestion[]) => void;
  readOnly?: boolean;
}

export function ScreeningQuestionsSection({
  value = [],
  onChange,
  readOnly = false,
}: ScreeningQuestionsSectionProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const generateId = () => `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = () => {
    const newQuestion: ScreeningQuestion = {
      id: generateId(),
      question: '',
      type: 'text',
      required: true,
      options: [],
    };
    onChange([...value, newQuestion]);
    setExpandedQuestionId(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<ScreeningQuestion>) => {
    onChange(
      value.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    onChange(value.filter((q) => q.id !== id));
    if (expandedQuestionId === id) {
      setExpandedQuestionId(null);
    }
  };

  const addOption = (questionId: string) => {
    const question = value.find((q) => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: [...(question.options || []), ''],
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, newValue: string) => {
    const question = value.find((q) => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = newValue;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = value.find((q) => q.id === questionId);
    if (question && question.options) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= value.length) return;
    
    const newQuestions = [...value];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    onChange(newQuestions);
  };

  const needsOptions = (type: ScreeningQuestionType) => 
    type === 'single_choice' || type === 'multiple_choice';

  return (
    <div className="form-section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="form-section-header">Screening Questions</h3>
          <p className="form-section-subtitle">
            Add questions that candidates must answer before applying. These help filter candidates early in the process.
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b6cf0] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
        )}
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 bg-[#f8fafc] rounded-lg border border-dashed border-[#e2e8f0]">
          <svg className="w-12 h-12 mx-auto text-[#94a3b8] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#64748b] text-sm">No screening questions added yet</p>
          <p className="text-[#94a3b8] text-xs mt-1">Click "Add Question" to create your first screening question</p>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((question, index) => (
            <div
              key={question.id}
              className="border border-[#e2e8f0] rounded-lg bg-white overflow-hidden"
            >
              {/* Question Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-[#f8fafc] cursor-pointer"
                onClick={() => setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id)}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0b6cf0] text-white text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">
                    {question.question || 'Untitled Question'}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {QUESTION_TYPES.find((t) => t.value === question.type)?.label}
                    {question.required && ' • Required'}
                  </p>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveQuestion(index, 'up'); }}
                      disabled={index === 0}
                      className="p-1.5 text-[#64748b] hover:text-[#111827] hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveQuestion(index, 'down'); }}
                      disabled={index === value.length - 1}
                      className="p-1.5 text-[#64748b] hover:text-[#111827] hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeQuestion(question.id); }}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
                <svg
                  className={`w-5 h-5 text-[#64748b] transition-transform ${expandedQuestionId === question.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Question Details (Expanded) */}
              {expandedQuestionId === question.id && !readOnly && (
                <div className="px-4 py-4 space-y-4 border-t border-[#e2e8f0]">
                  {/* Question Text */}
                  <div className="form-group">
                    <label className="form-label">Question Text</label>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                      onKeyDown={(e) => {
                        // Prevent form submission when pressing Enter in question input
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      className="form-input"
                      placeholder="Enter your question..."
                    />
                  </div>

                  {/* Question Type & Required */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Question Type</label>
                      <select
                        value={question.type}
                        onChange={(e) => {
                          const newType = e.target.value as ScreeningQuestionType;
                          updateQuestion(question.id, {
                            type: newType,
                            options: needsOptions(newType) ? (question.options?.length ? question.options : ['']) : [],
                          });
                        }}
                        className="form-select"
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Required</label>
                      <div className="flex items-center h-[42px]">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b6cf0]"></div>
                          <span className="ml-3 text-sm text-[#374151]">
                            {question.required ? 'Yes' : 'No'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Options for Choice Questions */}
                  {needsOptions(question.type) && (
                    <div className="form-group">
                      <label className="form-label">Answer Options</label>
                      <div className="space-y-2">
                        {(question.options || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <span className="text-xs text-[#64748b] w-6">{optIndex + 1}.</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                              onKeyDown={(e) => {
                                // Prevent form submission when pressing Enter in option input
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                }
                              }}
                              className="form-input flex-1"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(question.id, optIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                              disabled={(question.options?.length || 0) <= 1}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          className="text-sm text-[#0b6cf0] hover:text-[#0958c7] flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScreeningQuestionsSection;
