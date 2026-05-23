'use client';

import { TextInput } from '@mantine/core';

interface UnifiedInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'url';
  required?: boolean;
  maxLength?: number;
  hint?: string;
}

export default function UnifiedInputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  maxLength,
  hint,
}: UnifiedInputFieldProps) {
  return (
    <TextInput
      label={label}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={placeholder}
      type={type}
      withAsterisk={required}
      maxLength={maxLength}
      description={hint}
    />
  );
}
