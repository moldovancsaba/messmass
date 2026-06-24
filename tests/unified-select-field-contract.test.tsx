import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import UnifiedSelectField from '@/components/UnifiedSelectField';

jest.mock('@mantine/core', () => ({
  Select: (props: any) => (
    <div
      data-label={props.label}
      data-value={props.value}
      data-error={props.error || ''}
      data-within-portal={String(props.comboboxProps?.withinPortal)}
    />
  ),
}));

describe('UnifiedSelectField contract', () => {
  it('passes modal-safe combobox portal configuration when requested', () => {
    const html = renderToStaticMarkup(
      <UnifiedSelectField
        label="Time Period"
        value="all_time"
        onChange={jest.fn()}
        options={[{ value: 'all_time', label: 'All Time' }]}
        error="Select a supported time period."
        withinPortal={false}
      />
    );

    expect(html).toContain('data-label="Time Period"');
    expect(html).toContain('data-within-portal="false"');
    expect(html).toContain('data-error="Select a supported time period."');
  });
});
