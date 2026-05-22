'use client';

interface UnifiedSelectFieldOption {
  value: string;
  label: string;
}

interface UnifiedSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: UnifiedSelectFieldOption[];
  disabled?: boolean;
}

export default function UnifiedSelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: UnifiedSelectFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label-block">{label}</label>
      <select
        className="form-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
