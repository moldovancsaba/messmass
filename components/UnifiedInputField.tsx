'use client';

interface UnifiedInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date';
  required?: boolean;
}

export default function UnifiedInputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: UnifiedInputFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label-block">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        className="form-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
