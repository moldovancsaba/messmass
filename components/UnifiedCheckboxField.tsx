'use client';

import { Checkbox } from '@mantine/core';

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
    <Checkbox
      id={id}
      checked={checked}
      onChange={(event) => onChange(event.currentTarget.checked)}
      disabled={disabled}
      label={label}
      description={hint}
    />
  );
}
