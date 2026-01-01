/**
 * BlockEditor Component
 * 
 * Provides UI controls for block-level configurations in the editor.
 * Controls map ONLY to allowed mechanisms (increase height, split block,
 * set block aspect ratio, set image mode) and never bypass validation.
 * 
 * @module BlockEditor
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { BlockConfiguration } from '../lib/editorBlockValidator';
import type { BlockValidationResult } from '../lib/editorValidationAPI';

export interface BlockEditorProps {
  blockId: string;
  currentConfig?: BlockConfiguration;
  validationResult?: BlockValidationResult;
  onConfigChange: (config: BlockConfiguration) => void;
}

export default function BlockEditor({
  blockId,
  currentConfig,
  validationResult,
  onConfigChange
}: BlockEditorProps) {
  const [aspectRatio, setAspectRatio] = useState<string>(
    currentConfig?.aspectRatio?.ratio || '16:9'
  );
  const [isSoftConstraint, setIsSoftConstraint] = useState<boolean>(
    currentConfig?.aspectRatio?.isSoftConstraint ?? true
  );
  const [maxHeight, setMaxHeight] = useState<number | undefined>(
    currentConfig?.maxAllowedHeight
  );

  useEffect(() => {
    if (currentConfig) {
      setAspectRatio(currentConfig.aspectRatio?.ratio || '16:9');
      setIsSoftConstraint(currentConfig.aspectRatio?.isSoftConstraint ?? true);
      setMaxHeight(currentConfig.maxAllowedHeight);
    }
  }, [currentConfig]);

  const handleAspectRatioChange = (ratio: string) => {
    setAspectRatio(ratio);
    onConfigChange({
      blockId,
      aspectRatio: {
        ratio,
        isSoftConstraint
      },
      maxAllowedHeight: maxHeight
    });
  };

  const handleSoftConstraintToggle = (soft: boolean) => {
    setIsSoftConstraint(soft);
    onConfigChange({
      blockId,
      aspectRatio: {
        ratio: aspectRatio,
        isSoftConstraint: soft
      },
      maxAllowedHeight: maxHeight
    });
  };

  const handleMaxHeightChange = (height: number | undefined) => {
    setMaxHeight(height);
    onConfigChange({
      blockId,
      aspectRatio: currentConfig?.aspectRatio,
      maxAllowedHeight: height
    });
  };

  const handleImageModeChange = (chartId: string, mode: 'cover' | 'setIntrinsic') => {
    onConfigChange({
      blockId,
      aspectRatio: currentConfig?.aspectRatio,
      maxAllowedHeight: maxHeight,
      imageModes: {
        ...currentConfig?.imageModes,
        [chartId]: mode
      }
    });
  };

  return (
    <div className="block-editor" data-block-id={blockId}>
      <div className="block-editor-section">
        <label>
          Block Aspect Ratio:
          <select
            value={aspectRatio}
            onChange={(e) => handleAspectRatioChange(e.target.value)}
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={isSoftConstraint}
            onChange={(e) => handleSoftConstraintToggle(e.target.checked)}
          />
          Soft Constraint (can be overridden)
        </label>
      </div>

      <div className="block-editor-section">
        <label>
          Maximum Block Height (px):
          <input
            type="number"
            value={maxHeight || ''}
            onChange={(e) => handleMaxHeightChange(
              e.target.value ? parseInt(e.target.value, 10) : undefined
            )}
            min={100}
            max={2000}
          />
        </label>
      </div>

      {validationResult && (
        <div className="block-editor-validation">
          <div className="validation-status">
            <strong>Height Resolution:</strong>
            <span>Priority {validationResult.heightResolution.priority}</span>
            <span>{validationResult.heightResolution.reason}</span>
            <span>{validationResult.heightResolution.heightPx}px</span>
          </div>
          {validationResult.publishBlocked && (
            <div className="validation-error">
              <strong>Publish Blocked:</strong> {validationResult.publishBlockReason || 'Structural failure'}
            </div>
          )}
          {validationResult.requiredActions.length > 0 && (
            <div className="validation-actions">
              <strong>Required Actions:</strong>
              <ul>
                {validationResult.requiredActions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

