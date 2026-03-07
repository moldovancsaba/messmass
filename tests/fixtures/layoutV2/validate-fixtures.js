#!/usr/bin/env node
/**
 * X-LAYOUT-01: Validate LayoutV2 fixtures against schema + contract.
 * Run from repo root: node tests/fixtures/layoutV2/validate-fixtures.js
 */

const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = __dirname;
const FIXTURE_FILES = [
  '1-unit-block.json',
  '2-unit-block.json',
  'mixed-block.json',
  '4-unit-max.json',
  'text-block-with-aspect-ratio.json'
];

function validateBlockCapacity(block) {
  const charts = block.charts || [];
  const total = charts.reduce((sum, c) => sum + (c.width || 1), 0);
  return { valid: total <= 4, total };
}

function validateBlockAspectRatio(block) {
  const ar = block.blockAspectRatio;
  if (!ar) return { valid: true };
  const match = String(ar).match(/^4:(\d+)$/);
  if (!match) return { valid: false, error: 'blockAspectRatio must be 4:1 to 4:10' };
  const n = parseInt(match[1], 10);
  if (n < 1 || n > 10) return { valid: false, error: 'blockAspectRatio must be 4:1 to 4:10' };
  return { valid: true };
}

function validateFixture(blocks) {
  const errors = [];
  (blocks || []).forEach((block, idx) => {
    const cap = validateBlockCapacity(block);
    if (!cap.valid) errors.push(`Block ${idx}: capacity ${cap.total} exceeds 4`);
    const ar = validateBlockAspectRatio(block);
    if (!ar.valid) errors.push(`Block ${idx}: ${ar.error}`);
    (block.charts || []).forEach((c, cIdx) => {
      if (c.width !== 1 && c.width !== 2) errors.push(`Block ${idx} chart ${cIdx}: width must be 1 or 2`);
    });
  });
  return { valid: errors.length === 0, errors };
}

let failed = 0;
console.log('LayoutV2 fixture validation (X-LAYOUT-01)\n');

FIXTURE_FILES.forEach(file => {
  const filePath = path.join(FIXTURES_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${file}: (file not found)`);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let blocks;
  try {
    blocks = JSON.parse(raw);
  } catch (e) {
    console.log(`❌ ${file}: Invalid JSON`);
    failed++;
    return;
  }
  if (!Array.isArray(blocks)) {
    console.log(`❌ ${file}: Root must be an array of blocks`);
    failed++;
    return;
  }
  const result = validateFixture(blocks);
  if (result.valid) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}:`);
    result.errors.forEach(e => console.log(`   - ${e}`));
    failed++;
  }
});

console.log('');
process.exit(failed > 0 ? 1 : 0);
