"use client";

import React, { useState } from 'react';
import styles from './CounterCard.module.css';

interface CounterCardProps {
  title: string;
  initialValue?: number;
}

/**
 * CounterCard component that displays a title and manages a counter value
 * with increment/decrement functionality.
 */
export const CounterCard: React.FC<CounterCardProps> = ({
  title,
  initialValue = 0,
}) => {
  const [count, setCount] = useState(initialValue);

  const handleIncrement = () => {
    setCount((prevCount) => prevCount + 1);
  };

  const handleDecrement = () => {
    setCount((prevCount) => Math.max(0, prevCount - 1));
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.counter}>{count}</div>
      <div className={styles.controls}>
        <button
          onClick={handleDecrement}
          className={styles.button}
          aria-label="Decrease count"
        >
          -
        </button>
        <button
          onClick={handleIncrement}
          className={styles.button}
          aria-label="Increase count"
        >
          +
        </button>
      </div>
    </div>
  );
};
