'use client';

import React, { useState } from 'react';
import { apiPost } from '@/lib/apiClient';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');
    try {
      await apiPost('/api/contact', { name, email, message });
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <section className={styles.contact} id="contact">
      <div className={styles.contactInner}>
        <h2 className={styles.contactTitle}>Get in touch</h2>
        <p className={styles.contactSub}>Your message will be reviewed by our team.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Name
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={status === 'sending'}
              autoComplete="name"
              maxLength={200}
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'sending'}
              autoComplete="email"
              maxLength={320}
            />
          </label>
          <label className={styles.label}>
            Message
            <textarea
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={status === 'sending'}
              rows={4}
              maxLength={10000}
            />
          </label>
          {status === 'success' && (
            <p className={styles.feedbackSuccess}>Message sent. We’ll get back to you soon.</p>
          )}
          {status === 'error' && (
            <p className={styles.feedbackError}>{errorMessage}</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </section>
  );
}
