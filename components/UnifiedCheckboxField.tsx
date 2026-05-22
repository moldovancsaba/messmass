'use client';

interface UnifiedCheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
}

export default function UnifiedCheckboxField({
  id,
  label,
  checked,
  onChange,
  hint,
  disabled = false,
}: UnifiedCheckboxFieldProps) {
  return (
    <div className="editor-toggle-field">
      <div className="editor-toggle-row">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          className="editor-checkbox"
        />
        <label
          htmlFor={id}
          className={`editor-toggle-label ${disabled ? 'editor-toggle-label-disabled' : ''}`}
        >
          {label}
        </label>
      </div>
      {hint ? <p className="editor-toggle-hint">{hint}</p> : null}
    </div>
  );
}
