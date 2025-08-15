'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [activeTab, setActiveTab] = useState('today');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');

  const messMenu = {
    today: {
      breakfast: ['Idli Sambar', 'Coconut Chutney', 'Filter Coffee', 'Banana'],
      lunch: ['Rice', 'Dal Tadka', 'Mixed Veg Curry', 'Pickle', 'Buttermilk'],
      dinner: ['Chapati', 'Paneer Butter Masala', 'Jeera Rice', 'Raita']
    },
    tomorrow: {
      breakfast: ['Poha', 'Green Chutney', 'Tea', 'Orange'],
      lunch: ['Biryani', 'Raita', 'Boiled Egg', 'Pickle', 'Papad'],
      dinner: ['Roti', 'Chicken Curry', 'Dal Rice', 'Salad']
    }
  };

  const currentMenu = messMenu[activeTab as keyof typeof messMenu];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>MessMass</h1>
          <p className={styles.subtitle}>Unmess the mess - Your hostel menu at your fingertips</p>
        </div>

        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tab} ${activeTab === 'today' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('today')}
          >
            Today
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'tomorrow' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('tomorrow')}
          >
            Tomorrow
          </button>
        </div>

        <div className={styles.mealSelector}>
          {['breakfast', 'lunch', 'dinner'].map((meal) => (
            <button
              key={meal}
              className={`${styles.mealButton} ${selectedMeal === meal ? styles.activeMeal : ''}`}
              onClick={() => setSelectedMeal(meal)}
            >
              {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.menuCard}>
          <h3 className={styles.