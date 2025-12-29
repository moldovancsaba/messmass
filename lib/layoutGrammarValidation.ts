// lib/layoutGrammarValidation.ts
// WHAT: Input validation framework for layout grammar
// WHY: Prevent invalid inputs that could cause security issues or layout failures
// HOW: Validate all inputs before processing, return clear error messages
// SECURITY: Phase 0 Task 0.2 - Input Validation Framework

import type { CellConfiguration } from './blockLayoutTypes';

/**
 * WHAT: Validation result for any input
 * WHY: Standardized format for validation errors and warnings
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * WHAT: Validation error with actionable message
 * WHY: Help developers/users understand what's wrong and how to fix it
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string; // Machine-readable error code
}

/**
 * WHAT: Validation warning (non-blocking)
 * WHY: Alert to potential issues without blocking execution
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * WHAT: Height constraints for block resolution
 * WHY: Define valid ranges for height calculations
 */
export interface HeightConstraints {
  minHeight?: number;
  maxHeight?: number;
  minFontSize?: number;
  maxFontSize?: number;
}

/**
 * WHAT: Validate block configuration
 * WHY: Ensure block configuration is valid before height resolution
 * HOW: Check all required fields, valid ranges, and constraints
 * 
 * @param block - Block configuration to validate
 * @returns Validation result with errors and warnings
 * 
 * @example
 * ```typescript
 * const result = validateBlockConfiguration(block);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateBlockConfiguration(
  block: {
    blockId?: string;
    blockWidth?: number;
    aspectRatio?: string;
    maxHeight?: number;
    minHeight?: number;
  }
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // WHAT: Validate block width
  // WHY: Block width must be positive and reasonable
  if (block.blockWidth !== undefined) {
    if (typeof block.blockWidth !== 'number' || isNaN(block.blockWidth)) {
      errors.push({
        field: 'blockWidth',
        message: 'Block width must be a valid number',
        code: 'INVALID_BLOCK_WIDTH_TYPE',
      });
    } else if (block.blockWidth <= 0) {
      errors.push({
        field: 'blockWidth',
        message: 'Block width must be greater than 0',
        code: 'INVALID_BLOCK_WIDTH_RANGE',
      });
    } else if (block.blockWidth > 10000) {
      warnings.push({
        field: 'blockWidth',
        message: 'Block width is unusually large (>10000px). This may cause performance issues.',
        code: 'LARGE_BLOCK_WIDTH',
      });
    }
  }

  // WHAT: Validate aspect ratio format
  // WHY: Aspect ratio must be in format "width:height" (e.g., "16:9")
  if (block.aspectRatio !== undefined) {
    if (typeof block.aspectRatio !== 'string') {
      errors.push({
        field: 'aspectRatio',
        message: 'Aspect ratio must be a string',
        code: 'INVALID_ASPECT_RATIO_TYPE',
      });
    } else {
      const aspectRatioRegex = /^\d+:\d+$/;
      if (!aspectRatioRegex.test(block.aspectRatio)) {
        errors.push({
          field: 'aspectRatio',
          message: 'Aspect ratio must be in format "width:height" (e.g., "16:9")',
          code: 'INVALID_ASPECT_RATIO_FORMAT',
        });
      } else {
        // WHAT: Validate aspect ratio values are positive
        // WHY: Prevent division by zero or negative dimensions
        const [width, height] = block.aspectRatio.split(':').map(Number);
        if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
          errors.push({
            field: 'aspectRatio',
            message: 'Aspect ratio width and height must be positive numbers',
            code: 'INVALID_ASPECT_RATIO_VALUES',
          });
        }
      }
    }
  }

  // WHAT: Validate height constraints
  // WHY: Ensure min/max heights are valid and min < max
  if (block.minHeight !== undefined) {
    if (typeof block.minHeight !== 'number' || isNaN(block.minHeight)) {
      errors.push({
        field: 'minHeight',
        message: 'Minimum height must be a valid number',
        code: 'INVALID_MIN_HEIGHT_TYPE',
      });
    } else if (block.minHeight < 0) {
      errors.push({
        field: 'minHeight',
        message: 'Minimum height must be non-negative',
        code: 'INVALID_MIN_HEIGHT_RANGE',
      });
    }
  }

  if (block.maxHeight !== undefined) {
    if (typeof block.maxHeight !== 'number' || isNaN(block.maxHeight)) {
      errors.push({
        field: 'maxHeight',
        message: 'Maximum height must be a valid number',
        code: 'INVALID_MAX_HEIGHT_TYPE',
      });
    } else if (block.maxHeight <= 0) {
      errors.push({
        field: 'maxHeight',
        message: 'Maximum height must be greater than 0',
        code: 'INVALID_MAX_HEIGHT_RANGE',
      });
    }
  }

  // WHAT: Validate min < max if both are defined
  // WHY: Prevent impossible constraints
  if (
    block.minHeight !== undefined &&
    block.maxHeight !== undefined &&
    block.minHeight >= block.maxHeight
  ) {
    errors.push({
      field: 'heightConstraints',
      message: `Minimum height (${block.minHeight}) must be less than maximum height (${block.maxHeight})`,
      code: 'INVALID_HEIGHT_CONSTRAINTS',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * WHAT: Validate height resolution result
 * WHY: Ensure resolved height is valid and within constraints
 * HOW: Check height is positive, within min/max, and constraints are valid
 * 
 * @param height - Resolved height value
 * @param constraints - Height constraints to validate against
 * @returns Validation result
 */
export function validateHeightResolution(
  height: number,
  constraints?: HeightConstraints
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // WHAT: Validate height is a number
  // WHY: Prevent NaN or invalid types
  if (typeof height !== 'number' || isNaN(height)) {
    errors.push({
      field: 'height',
      message: 'Height must be a valid number',
      code: 'INVALID_HEIGHT_TYPE',
    });
    return { valid: false, errors, warnings };
  }

  // WHAT: Validate height is positive
  // WHY: Negative heights are impossible
  if (height <= 0) {
    errors.push({
      field: 'height',
      message: `Height must be greater than 0, got ${height}`,
      code: 'INVALID_HEIGHT_RANGE',
    });
  }

  // WHAT: Validate constraints if provided
  // WHY: Ensure height meets all constraints
  if (constraints) {
    if (constraints.minHeight !== undefined) {
      if (typeof constraints.minHeight !== 'number' || isNaN(constraints.minHeight)) {
        errors.push({
          field: 'constraints.minHeight',
          message: 'Minimum height constraint must be a valid number',
          code: 'INVALID_MIN_HEIGHT_CONSTRAINT_TYPE',
        });
      } else if (height < constraints.minHeight) {
        errors.push({
          field: 'height',
          message: `Height ${height} is less than minimum ${constraints.minHeight}`,
          code: 'HEIGHT_BELOW_MINIMUM',
        });
      }
    }

    if (constraints.maxHeight !== undefined) {
      if (typeof constraints.maxHeight !== 'number' || isNaN(constraints.maxHeight)) {
        errors.push({
          field: 'constraints.maxHeight',
          message: 'Maximum height constraint must be a valid number',
          code: 'INVALID_MAX_HEIGHT_CONSTRAINT_TYPE',
        });
      } else if (height > constraints.maxHeight) {
        errors.push({
          field: 'height',
          message: `Height ${height} exceeds maximum ${constraints.maxHeight}`,
          code: 'HEIGHT_EXCEEDS_MAXIMUM',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * WHAT: Validate typography input (font size)
 * WHY: Ensure font sizes are within valid ranges and prevent invalid values
 * HOW: Check font size is number, positive, and within min/max bounds
 * 
 * @param fontSize - Font size to validate
 * @param min - Minimum allowed font size (default: 0.75rem = 12px)
 * @param max - Maximum allowed font size (default: 2.5rem = 40px)
 * @returns Validation result
 */
export function validateTypographyInput(
  fontSize: number,
  min: number = 0.75, // 12px minimum for readability
  max: number = 2.5   // 40px maximum for visual balance
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // WHAT: Validate font size is a number
  // WHY: Prevent NaN or invalid types
  if (typeof fontSize !== 'number' || isNaN(fontSize)) {
    errors.push({
      field: 'fontSize',
      message: 'Font size must be a valid number',
      code: 'INVALID_FONT_SIZE_TYPE',
    });
    return { valid: false, errors, warnings };
  }

  // WHAT: Validate font size is positive
  // WHY: Negative font sizes are impossible
  if (fontSize <= 0) {
    errors.push({
      field: 'fontSize',
      message: `Font size must be greater than 0, got ${fontSize}`,
      code: 'INVALID_FONT_SIZE_RANGE',
    });
  }

  // WHAT: Validate font size is within bounds
  // WHY: Ensure readability and visual balance
  if (fontSize < min) {
    errors.push({
      field: 'fontSize',
      message: `Font size ${fontSize}rem is below minimum ${min}rem (readability threshold)`,
      code: 'FONT_SIZE_BELOW_MINIMUM',
    });
  }

  if (fontSize > max) {
    warnings.push({
      field: 'fontSize',
      message: `Font size ${fontSize}rem exceeds recommended maximum ${max}rem (may cause visual imbalance)`,
      code: 'FONT_SIZE_EXCEEDS_MAXIMUM',
    });
  }

  // WHAT: Validate min < max
  // WHY: Prevent impossible constraints
  if (min >= max) {
    errors.push({
      field: 'typographyConstraints',
      message: `Minimum font size (${min}) must be less than maximum (${max})`,
      code: 'INVALID_TYPOGRAPHY_CONSTRAINTS',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * WHAT: Validate element content
 * WHY: Ensure content is safe and valid for rendering
 * HOW: Check content type, length, and sanitization requirements
 * 
 * @param content - Content string to validate
 * @param type - Element type (text, table, etc.)
 * @returns Validation result
 */
export function validateElementContent(
  content: string,
  type: 'text' | 'table' | 'kpi' | 'pie' | 'bar' | 'image'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // WHAT: Validate content is a string
  // WHY: Prevent invalid types
  if (typeof content !== 'string') {
    errors.push({
      field: 'content',
      message: `Content must be a string, got ${typeof content}`,
      code: 'INVALID_CONTENT_TYPE',
    });
    return { valid: false, errors, warnings };
  }

  // WHAT: Validate content length
  // WHY: Prevent extremely long content that could cause performance issues
  const maxLength = type === 'text' ? 100000 : type === 'table' ? 50000 : 10000;
  if (content.length > maxLength) {
    warnings.push({
      field: 'content',
      message: `Content length (${content.length}) exceeds recommended maximum (${maxLength}) for ${type} elements. This may cause performance issues.`,
      code: 'CONTENT_LENGTH_EXCEEDS_MAXIMUM',
    });
  }

  // WHAT: Validate content is not empty (for required elements)
  // WHY: Some elements require content to be meaningful
  if (content.length === 0 && (type === 'text' || type === 'table')) {
    warnings.push({
      field: 'content',
      message: `${type} element has empty content. This may not render correctly.`,
      code: 'EMPTY_CONTENT_WARNING',
    });
  }

  // WHAT: Check for potentially malicious content patterns
  // WHY: Defense in depth against XSS (sanitization should catch these, but validate too)
  const suspiciousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      warnings.push({
        field: 'content',
        message: `Content contains potentially unsafe pattern: ${pattern.source}. Ensure content is sanitized before rendering.`,
        code: 'SUSPICIOUS_CONTENT_PATTERN',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * WHAT: Validate cell configuration
 * WHY: Ensure cell configuration is valid before layout calculation
 * HOW: Check cell width, body type, and aspect ratio
 * 
 * @param cell - Cell configuration to validate
 * @returns Validation result
 */
export function validateCellConfiguration(
  cell: CellConfiguration
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // WHAT: Validate cell width
  // WHY: Only 1-unit and 2-unit are allowed
  if (cell.cellWidth !== 1 && cell.cellWidth !== 2) {
    errors.push({
      field: 'cellWidth',
      message: `Cell width must be 1 or 2 units, got ${cell.cellWidth}`,
      code: 'INVALID_CELL_WIDTH',
    });
  }

  // WHAT: Validate body type
  // WHY: Body type must be a valid chart type
  const validBodyTypes = ['kpi', 'pie', 'bar', 'text', 'image', 'table'];
  if (!validBodyTypes.includes(cell.bodyType)) {
    errors.push({
      field: 'bodyType',
      message: `Body type must be one of: ${validBodyTypes.join(', ')}, got ${cell.bodyType}`,
      code: 'INVALID_BODY_TYPE',
    });
  }

  // WHAT: Validate aspect ratio for image elements
  // WHY: Image elements require aspect ratio
  if (cell.bodyType === 'image' && !cell.aspectRatio) {
    errors.push({
      field: 'aspectRatio',
      message: 'Image elements require an aspect ratio',
      code: 'MISSING_ASPECT_RATIO',
    });
  }

  // WHAT: Validate aspect ratio format if provided
  // WHY: Aspect ratio must be in format "width:height"
  if (cell.aspectRatio) {
    const aspectRatioRegex = /^\d+:\d+$/;
    if (!aspectRatioRegex.test(cell.aspectRatio)) {
      errors.push({
        field: 'aspectRatio',
        message: 'Aspect ratio must be in format "width:height" (e.g., "16:9")',
        code: 'INVALID_ASPECT_RATIO_FORMAT',
      });
    } else {
      const [width, height] = cell.aspectRatio.split(':').map(Number);
      if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
        errors.push({
          field: 'aspectRatio',
          message: 'Aspect ratio width and height must be positive numbers',
          code: 'INVALID_ASPECT_RATIO_VALUES',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * WHAT: Validate all cells in a block
 * WHY: Ensure all cells are valid before block height resolution
 * HOW: Validate each cell and aggregate results
 * 
 * @param cells - Array of cell configurations
 * @returns Validation result with aggregated errors and warnings
 */
export function validateBlockCells(
  cells: CellConfiguration[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // WHAT: Validate cells array is not empty
  // WHY: Blocks must have at least one cell
  if (!cells || cells.length === 0) {
    errors.push({
      field: 'cells',
      message: 'Block must have at least one cell',
      code: 'EMPTY_CELLS_ARRAY',
    });
    return { valid: false, errors, warnings };
  }

  // WHAT: Validate each cell
  // WHY: All cells must be valid
  cells.forEach((cell, index) => {
    const cellResult = validateCellConfiguration(cell);
    if (!cellResult.valid) {
      cellResult.errors.forEach(error => {
        errors.push({
          field: `cells[${index}].${error.field}`,
          message: error.message,
          code: error.code,
        });
      });
    }
    cellResult.warnings.forEach(warning => {
      warnings.push({
        field: `cells[${index}].${warning.field}`,
        message: warning.message,
        code: warning.code,
      });
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

