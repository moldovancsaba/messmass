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
}

export default function UnifiedSelectField({
  label,
  value,
  onChange,
  options,
}: UnifiedSelectFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label-block">{label}</label>
      <select
        className="form-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
