import { type InputHTMLAttributes, type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
  rightElement?: ReactNode;
}

const Input = ({
  label,
  icon: Icon,
  iconPosition = 'left',
  error,
  containerClassName = '',
  inputClassName = '',
  rightElement,
  ...inputProps
}: InputProps) => {
  const hasLeftIcon = Icon && iconPosition === 'left';
  const hasRightIcon = Icon && iconPosition === 'right';

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputProps.id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {hasLeftIcon && (
          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none z-10">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        {hasRightIcon && !rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          {...inputProps}
          style={{
            paddingRight: rightElement ? '6rem' : hasRightIcon ? '2.5rem' : '0.75rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
          }}
          className={`
            ${hasLeftIcon ? 'pl-10' : 'pl-2'}
            block 
            w-full 
            border 
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'} 
            rounded-lg 
            focus:ring-2 
            outline-none 
            transition-all
            text-gray-900 
            placeholder:text-gray-400
            placeholder:text-sm
            placeholder:font-semibold
            ${inputClassName}
          `}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center z-10">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
