import { type LabelHTMLAttributes, type ReactNode } from 'react';

interface LabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'className'> {
  children: ReactNode;
  className?: string;
}

const Label = ({
  children,
  className = '',
  ...labelProps
}: LabelProps) => {
  return (
    <label
      {...labelProps}
      className={`text-sm font-medium ${className}`}
    >
      {children}
    </label>
  );
};

export default Label;



