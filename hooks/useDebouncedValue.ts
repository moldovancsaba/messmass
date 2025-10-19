// hooks/useDebouncedValue.ts
// WHAT: Generic debounced value hook
// WHY: Centralize debouncing behavior across admin pages (projects, partners, bitly, hashtags)
// HOW: Returns a debounced version of the input value after the specified delay

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
