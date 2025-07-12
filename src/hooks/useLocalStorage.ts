import { useState } from 'react';

/**
 * A custom hook that provides type-safe access to localStorage with automatic JSON parsing/stringifying
 * @param key The key to store/retrieve the data in localStorage
 * @param initialValue The initial value to use if no data exists in localStorage
 * @returns A tuple containing the current value and a function to update it
 */
type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: SetValue<T>) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists
  // the new value to localStorage
  const setValue = (value: SetValue<T>) => {
    try {
      // Handle both direct values and updater functions
      const newValue = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(newValue);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
