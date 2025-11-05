// app/api-docs/page.tsx
// WHAT: Public-facing API documentation page
// WHY: Make API_PUBLIC.md accessible via web browser for external developers

import React from 'react';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import styles from './page.module.css';

export const metadata = {
  title: 'MessMass Public API Documentation',
  description: 'REST API reference for MessMass partner and event data integration',
};

// WHAT: Server component that reads and renders API_PUBLIC.md
// WHY: No build step needed, just reads markdown at runtime
export default async function APIDocsPage() {
  // WHAT: Read API_PUBLIC.md from project root
  const docsPath = path.join(process.cwd(), 'API_PUBLIC.md');
  const markdown = fs.readFileSync(docsPath, 'utf-8');
  
  // WHAT: Convert markdown to HTML with GitHub-flavored markdown
  const html = await marked(markdown, {
    gfm: true,
    breaks: true,
  });

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div 
          className={styles.markdown}
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      </div>
    </div>
  );
}
