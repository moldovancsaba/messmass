'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [showMessage, setShowMessage] = useState(false);

  const handleClick = () => {
    setShowMessage(!showMessage);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Hello World!</h1>
        <p className={styles.description}>
          Welcome to your Next.js application. This is a beautiful Hello World app built with modern React and Next.js.
        </p>
        <button className={styles.button} onClick={handleClick}>
          Click Me!
        </button>
        {showMessage && (
          <div className={styles.message}>
            🎉 Congratulations! Your Next.js app is working perfectly!
          </div>
        )}
      </div>
    </main>
  );
}