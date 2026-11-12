'use client';
import { TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { clsx } from 'clsx';

interface AccessibleTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ label, error, hint, id: providedId, className, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        {hint && (
          <p id={hintId} className="text-xs text-slate-500">{hint}</p>
        )}
        <textarea
          ref={ref}
          id={id}
          className={clsx(
            'border rounded px-3 py-2 text-base',
            'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1',
            error ? 'border-red-500' : 'border-slate-300',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

AccessibleTextarea.displayName = 'AccessibleTextarea';
