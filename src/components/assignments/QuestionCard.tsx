import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

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

interface QuestionCardProps {
  question: any;
  questionNumber: number;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  onEdit,
  onDelete,
}) => {
  const handleEdit = () => {
    const questionToEdit: Question = {
      ...question,
      mark: question.mark || 1,
      options: question.question_type === 'mcq' && question.options 
        ? question.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            is_correct: opt.is_correct,
          }))
        : undefined,
    };
    onEdit(questionToEdit);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">
          Question {questionNumber}
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit Question"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(question)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-600">
          Type: {question.question_type?.toUpperCase() || 'TEXT'}
        </span>
        {question.mark && (
          <span className="text-xs font-semibold text-gray-600">
            Marks: {question.mark}
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-900 mb-3">{question.question_text}</p>
      
      {question.question_type === 'mcq' && question.options && question.options.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Options:</p>
          {question.options.map((opt: any, optIdx: number) => (
            <div key={optIdx} className="mb-2 last:mb-0">
              <span className="text-xs text-gray-700">
                {optIdx + 1}. {opt.text}
                {opt.is_correct && (
                  <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;





