import React from 'react';
import { X, Plus } from 'lucide-react';

interface MCQOption {
  id?: number;
  text: string;
  is_correct: boolean;
}

interface Question {
  id?: number;
  question_text: string;
  question_type: 'text' | 'mcq';
  mark?: number;
  options?: MCQOption[];
}

interface QuestionFormProps {
  question: Question;
  questionNumber: number;
  onUpdate: (field: string, value: any) => void;
  onTypeChange: (type: 'text' | 'mcq') => void;
  onAddOption: () => void;
  onUpdateOption: (optionIndex: number, field: 'text' | 'is_correct', value: string | boolean) => void;
  onRemoveOption: (optionIndex: number) => void;
  onToggleCorrect: (optionIndex: number) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  questionNumber,
  onUpdate,
  onTypeChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onToggleCorrect,
  onClose,
  onSave,
  isSaving = false,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Question {questionNumber}
          {!question.id && <span className="text-purple-600 ml-2">(New)</span>}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-red-600 hover:bg-red-50 rounded transition"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onTypeChange('mcq')}
              className={`flex-1 px-4 py-2 rounded-lg border transition ${
                question.question_type === 'mcq'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              MCQ
            </button>
            <button
              type="button"
              onClick={() => onTypeChange('text')}
              className={`flex-1 px-4 py-2 rounded-lg border transition ${
                question.question_type === 'text'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Text
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Text
          </label>
          <textarea
            placeholder="Enter question text"
            value={question.question_text || ''}
            onChange={(e) => onUpdate('question_text', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Marks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marks
          </label>
          <input
            type="number"
            placeholder="Enter marks"
            value={question.mark || ''}
            onChange={(e) => {
              const markValue = parseInt(e.target.value, 10) || 0;
              onUpdate('mark', markValue);
            }}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* MCQ Options */}
        {question.question_type === 'mcq' && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Options
              </label>
              <button
                type="button"
                onClick={onAddOption}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            </div>
            
            {question.options?.map((option, optIndex) => (
              <div key={optIndex} className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder={`Option ${optIndex + 1}`}
                  value={option.text}
                  onChange={(e) => onUpdateOption(optIndex, 'text', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => onToggleCorrect(optIndex)}
                  className={`px-4 py-2 rounded-lg border transition text-sm font-medium ${
                    option.is_correct
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.is_correct ? '✓ Correct' : 'Mark Correct'}
                </button>
                {question.options!.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(optIndex)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="Remove Option"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition ${
            isSaving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              {question.id ? 'Updating...' : 'Saving...'}
            </span>
          ) : (
            question.id ? 'Update Question' : 'Save Question'
          )}
        </button>
      </div>
    </div>
  );
};

export default QuestionForm;





