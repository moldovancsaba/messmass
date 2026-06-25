'use client';

import { Checkbox, Select, Stack, TextInput } from '@mantine/core';
import { FormModal } from '@/components/modals';
import type { AdminEntityFormSchema } from '@/lib/adminEntitySystem';

type EntityFormValue = string | boolean | null | undefined;

interface EntityFormModalProps<TForm extends Record<string, EntityFormValue>> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  schema: AdminEntityFormSchema<TForm>;
  values: TForm;
  onChange: <TKey extends keyof TForm & string>(key: TKey, value: TForm[TKey]) => void;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
}

export default function EntityFormModal<TForm extends Record<string, EntityFormValue>>({
  isOpen,
  onClose,
  onSubmit,
  schema,
  values,
  onChange,
  isSubmitting = false,
  disableSubmit = false,
}: EntityFormModalProps<TForm>) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={schema.title}
      submitText={schema.submitText}
      isSubmitting={isSubmitting}
      disableSubmit={disableSubmit}
      size="md"
    >
      <Stack gap="md">
        {schema.fields.map((field) => {
          const value = values[field.key];

          if (field.type === 'select') {
            return (
              <Select
                key={field.key}
                label={field.label}
                description={field.description}
                data={field.options || []}
                value={String(value ?? '')}
                onChange={(nextValue) => onChange(field.key, (nextValue ?? '') as TForm[typeof field.key])}
                withAsterisk={field.required}
                allowDeselect={false}
                comboboxProps={{ withinPortal: true, zIndex: 1200 }}
              />
            );
          }

          if (field.type === 'checkbox') {
            return (
              <Checkbox
                key={field.key}
                label={field.label}
                description={field.description}
                checked={Boolean(value)}
                onChange={(event) => onChange(field.key, event.currentTarget.checked as TForm[typeof field.key])}
              />
            );
          }

          return (
            <TextInput
              key={field.key}
              label={field.label}
              description={field.description}
              value={String(value ?? '')}
              onChange={(event) => onChange(field.key, event.currentTarget.value as TForm[typeof field.key])}
              placeholder={field.placeholder}
              withAsterisk={field.required}
              readOnly={field.type === 'readonly'}
              disabled={field.type === 'readonly'}
              autoFocus={field === schema.fields[0]}
            />
          );
        })}
      </Stack>
    </FormModal>
  );
}
