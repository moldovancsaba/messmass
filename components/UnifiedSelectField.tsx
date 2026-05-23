'use client';

import { Select } from '@mantine/core';

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
    <Select
      label={label}
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? '')}
      data={options}
      disabled={disabled}
      allowDeselect={false}
    />
  );
}
