import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface CounterState {
  count: number;
  title: string;
}

interface UseCounterReturn {
  count: number;
  title: string;
  increment: () => void;
  decrement: () => void;
  setCount: (value: number) => void;
  setTitle: (value: string) => void;
  reset: () => void;
}

const DEFAULT_COUNTER_STATE: CounterState = {
  count: 0,
  title: 'Counter'
};

/**
 * A custom hook that manages counter state with localStorage persistence
 * Provides functions for incrementing, decrementing, and resetting the counter
 * Also manages the counter's title
 * @returns An object containing the counter state and management functions
 */
export function useCounter(): UseCounterReturn {
  const [state, setState] = useLocalStorage<CounterState>('counter-state', DEFAULT_COUNTER_STATE);

  const increment = useCallback(() => {
    setState((prevState: CounterState): CounterState => ({
      ...prevState,
      count: prevState.count + 1
    }));
  }, [setState]);

  const decrement = useCallback(() => {
    setState((prevState: CounterState): CounterState => ({
      ...prevState,
      count: Math.max(0, prevState.count - 1) // Prevent negative numbers
    }));
  }, [setState]);

  const setCount = useCallback((value: number) => {
    setState((prevState: CounterState): CounterState => ({
      ...prevState,
      count: Math.max(0, value) // Ensure count is not negative
    }));
  }, [setState]);

  const setTitle = useCallback((value: string) => {
    setState((prevState: CounterState): CounterState => ({
      ...prevState,
      title: value.trim() || DEFAULT_COUNTER_STATE.title // Fallback to default if empty
    }));
  }, [setState]);

  const reset = useCallback(() => {
    setState(DEFAULT_COUNTER_STATE);
  }, [setState]);

  return {
    count: state.count,
    title: state.title,
    increment,
    decrement,
    setCount,
    setTitle,
    reset
  };
}
