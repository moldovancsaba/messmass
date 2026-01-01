/**
 * BuilderMode Validation Integration
 * 
 * This module provides validation utilities for integrating
 * the Editor Validation API into BuilderMode component.
 * 
 * Task 5.2: Prevent Invalid States (Minimal Editor UI)
 * - Save/publish is BLOCKED when publishBlocked = true
 * - Allowed only when publishBlocked = false
 * 
 * @module builderModeValidation
 */

import { validateEditorBlocks, checkEditorPublishValidity, type BlockConfiguration } from './editorBlockValidator';
import type { EditorBlock, EditorChart } from './editorBlockValidator';
import type { BlockValidationResult } from './editorValidationAPI';

export interface BuilderModeValidationState {
  validationResults: BlockValidationResult[];
  publishBlocked: boolean;
  blockedBlocks: Array<{
    blockId: string;
    reason: string;
  }>;
  errorMessages: string[];
}

/**
 * Validates blocks in BuilderMode context
 * 
 * This function should be called:
 * - On template/charts/stats changes
 * - On block configuration changes
 * - Before save/publish actions
 * 
 * @param blocks - Editor blocks from BuilderMode state
 * @param charts - Map of chartId -> chart data
 * @param blockWidth - Width of blocks in pixels (typically from container width)
 * @param blockConfigurations - Optional block-level configurations
 * @returns Validation state for BuilderMode
 */
export function validateBuilderModeBlocks(
  blocks: EditorBlock[],
  charts: Map<string, EditorChart>,
  blockWidth: number,
  blockConfigurations?: BlockConfiguration[]
): BuilderModeValidationState {
  const validationResults = validateEditorBlocks(
    blocks,
    charts,
    blockWidth,
    blockConfigurations
  );

  const publishCheck = checkEditorPublishValidity(validationResults);

  const errorMessages: string[] = [];
  if (publishCheck.publishBlocked) {
    publishCheck.blockedBlocks.forEach(block => {
      errorMessages.push(`Block "${block.blockId}": ${block.reason}`);
    });
  }

  return {
    validationResults,
    publishBlocked: publishCheck.publishBlocked,
    blockedBlocks: publishCheck.blockedBlocks,
    errorMessages
  };
}

/**
 * Wrapper function for save/publish actions that blocks invalid states
 * 
 * Usage in BuilderMode:
 * ```tsx
 * const handleSave = handleSaveWithValidation(
 *   () => onSave(template, charts, stats),
 *   validationState
 * );
 * ```
 * 
 * @param saveAction - Original save/publish action
 * @param validationState - Current validation state
 * @returns Wrapped save function that blocks on invalid states
 */
export function handleSaveWithValidation(
  saveAction: () => void | Promise<void>,
  validationState: BuilderModeValidationState
): () => void | Promise<void> {
  return () => {
    // Save/publish is BLOCKED when publishBlocked = true
    // Allowed only when publishBlocked = false
    if (validationState.publishBlocked) {
      // Do not call saveAction - block the save
      console.warn('Save/publish blocked due to validation failures:', validationState.errorMessages);
      return;
    }

    // Only proceed if publishBlocked = false
    return saveAction();
  };
}

/**
 * Generates error message for display in BuilderMode UI
 * 
 * @param validationState - Current validation state
 * @returns Formatted error message string, or null if no errors
 */
export function getValidationErrorMessage(
  validationState: BuilderModeValidationState
): string | null {
  if (!validationState.publishBlocked) {
    return null;
  }

  if (validationState.errorMessages.length === 0) {
    return 'Cannot save: Layout validation failed.';
  }

  return `Cannot save: ${validationState.errorMessages.join('; ')}`;
}

