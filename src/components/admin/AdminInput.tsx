import React from 'react';

interface AdminInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  readOnly?: boolean;
  /** Run on blur; return an error message or null when valid */
  validator?: (value: string) => string | null;
  onValidated?: (error: string | null) => void;
}

export function AdminInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  rows,
  readOnly,
  validator,
  onValidated
}: AdminInputProps) {
  const Component = type === 'textarea' ? 'textarea' : 'input';

  const handleBlur = () => {
    if (!validator) return;
    const message = validator(value);
    onValidated?.(message);
  };

  const fieldClass = `w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 transition-colors ${
    readOnly ? 'opacity-70 cursor-not-allowed' : ''
  } ${
    error
      ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500'
      : 'border-white/10 focus:ring-blue-500/50 focus:border-blue-500'
  }`;

  return (
    <FieldGroup label={label} required={required} error={error}>
      {Component === 'textarea' ? (
        <textarea
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows || 3}
          className={fieldClass}
        />
      ) : (
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={fieldClass}
        />
      )}
    </FieldGroup>
  );
}

function FieldGroup({
  label,
  required,
  error,
  children
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
