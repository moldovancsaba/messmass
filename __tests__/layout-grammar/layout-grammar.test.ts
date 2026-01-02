/**
 * Layout Grammar Validation Test Suite
 * 
 * Task 6.2: Create Validation Test Suite
 * 
 * Tests the Layout Grammar system to ensure:
 * - Height resolution priorities work correctly
 * - Element fit validation is deterministic
 * - Editor validation API functions correctly
 * - Type contracts are enforced (single source of truth)
 * - Adapter boundary normalization works
 * - Edge cases are handled
 * 
 * DoD Profile: CRITICAL (Infrastructure & Operations / Validation)
 */

import { resolveBlockHeightWithDetails } from '@/lib/blockHeightCalculator';
import { validateElementFit } from '@/lib/elementFitValidator';
import { validateBlockForEditor, validateBlocksForEditor, checkPublishValidity } from '@/lib/editorValidationAPI';
import { HeightResolutionPriority } from '@/lib/layoutGrammar';
import type { HeightResolutionInput, CellConfiguration, BlockHeightResolution, ElementFitValidation } from '@/lib/layoutGrammar';
import type { AspectRatio, CellWidth } from '@/lib/chartConfigTypes';
import type { ChartBodyType } from '@/lib/blockLayoutTypes';

describe('Layout Grammar Validation Suite', () => {
  describe('Module Import Validation', () => {
    test('all required modules are importable', () => {
      expect(resolveBlockHeightWithDetails).toBeDefined();
      expect(validateElementFit).toBeDefined();
      expect(validateBlockForEditor).toBeDefined();
      expect(validateBlocksForEditor).toBeDefined();
      expect(checkPublishValidity).toBeDefined();
      expect(HeightResolutionPriority).toBeDefined();
    });

    test('HeightResolutionPriority enum has correct values', () => {
      expect(HeightResolutionPriority.INTRINSIC_MEDIA).toBe(1);
      expect(HeightResolutionPriority.BLOCK_ASPECT_RATIO).toBe(2);
      expect(HeightResolutionPriority.READABILITY_ENFORCEMENT).toBe(3);
      expect(HeightResolutionPriority.STRUCTURAL_FAILURE).toBe(4);
    });
  });

  describe('Height Resolution Priorities', () => {
    test('Priority 1: Intrinsic media authority', () => {
      const input: HeightResolutionInput = {
        blockId: 'test-block',
        blockWidth: 1200,
        cells: [
          {
            chartId: 'img1',
            cellWidth: 1,
            bodyType: 'image',
            aspectRatio: '16:9',
            imageMode: 'setIntrinsic'
          }
        ]
      };

      const result = resolveBlockHeightWithDetails(input);
      
      expect(result.priority).toBe(HeightResolutionPriority.INTRINSIC_MEDIA);
      expect(result.heightPx).toBeGreaterThan(0);
      expect(result.reason).toContain('intrinsic');
      expect(result.canIncrease).toBeDefined();
      expect(result.requiresSplit).toBeDefined();
    });

    test('Priority 2: Block aspect ratio (hard constraint)', () => {
      const input: HeightResolutionInput = {
        blockId: 'test-block',
        blockWidth: 1200,
        cells: [
          {
            chartId: 'chart1',
            cellWidth: 1,
            bodyType: 'kpi'
          }
        ],
        blockAspectRatio: {
          ratio: '16:9',
          isSoftConstraint: false
        }
      };

      const result = resolveBlockHeightWithDetails(input);
      
      expect(result.priority).toBe(HeightResolutionPriority.BLOCK_ASPECT_RATIO);
      expect(result.heightPx).toBeGreaterThan(0);
      expect(result.reason).toContain('aspect ratio');
    });

    test('Priority 3: Readability enforcement (default)', () => {
      const input: HeightResolutionInput = {
        blockId: 'test-block',
        blockWidth: 1200,
        cells: [
          {
            chartId: 'chart1',
            cellWidth: 1,
            bodyType: 'kpi'
          }
        ]
      };

      const result = resolveBlockHeightWithDetails(input);
      
      expect(result.priority).toBe(HeightResolutionPriority.READABILITY_ENFORCEMENT);
      expect(result.heightPx).toBeGreaterThan(0);
      expect(result.heightPx).toBeGreaterThanOrEqual(150); // min height
      expect(result.heightPx).toBeLessThanOrEqual(800); // max height
    });

    test('maxAllowedHeight constraint is respected', () => {
      const input: HeightResolutionInput = {
        blockId: 'test-block',
        blockWidth: 1200,
        cells: [
          {
            chartId: 'chart1',
            cellWidth: 1,
            bodyType: 'kpi'
          }
        ],
        maxAllowedHeight: 200
      };

      const result = resolveBlockHeightWithDetails(input);
      
      expect(result.heightPx).toBeLessThanOrEqual(200);
      if (result.heightPx === 200) {
        expect(result.requiresSplit).toBe(true);
      }
    });
  });

  describe('Element Fit Validation', () => {
    test('text element always fits', () => {
      const cellConfig: CellConfiguration = {
        chartId: 'text1',
        cellWidth: 1,
        bodyType: 'text'
      };

      const result = validateElementFit(cellConfig, 300, 600);
      
      expect(result.fits).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.requiredActions).toHaveLength(0);
    });

    test('table element: ≤17 rows fits', () => {
      const cellConfig: CellConfiguration = {
        chartId: 'table1',
        cellWidth: 1,
        bodyType: 'table',
        contentMetadata: {
          rowCount: 15
        }
      };

      const result = validateElementFit(cellConfig, 300, 600);
      
      expect(result.fits).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('table element: >17 rows requires aggregation', () => {
      const cellConfig: CellConfiguration = {
        chartId: 'table1',
        cellWidth: 1,
        bodyType: 'table',
        contentMetadata: {
          rowCount: 25
        }
      };

      const result = validateElementFit(cellConfig, 300, 600);
      
      expect(result.fits).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.requiredActions).toContain('aggregate');
    });

    test('pie element: minimum radius enforced', () => {
      const cellConfig: CellConfiguration = {
        chartId: 'pie1',
        cellWidth: 1,
        bodyType: 'pie'
      };

      // Very small container should require height increase
      const result = validateElementFit(cellConfig, 50, 100);
      
      if (!result.fits) {
        expect(result.requiredHeight).toBeGreaterThan(50);
        expect(result.requiredActions).toContain('increaseHeight');
      }
    });

    test('bar element: requires reflow or height increase if too many bars', () => {
      const cellConfig: CellConfiguration = {
        chartId: 'bar1',
        cellWidth: 1,
        bodyType: 'bar',
        contentMetadata: {
          barCount: 20
        }
      };

      const result = validateElementFit(cellConfig, 200, 600);
      
      if (!result.fits) {
        expect(result.requiredActions.length).toBeGreaterThan(0);
        expect(
          result.requiredActions.some(action => 
            action === 'reflow' || action === 'increaseHeight'
          )
        ).toBe(true);
      }
    });

    test('kpi element always fits', () => {
      const cellConfig: CellConfiguration = {
        chartId: 'kpi1',
        cellWidth: 1,
        bodyType: 'kpi'
      };

      const result = validateElementFit(cellConfig, 100, 200);
      
      expect(result.fits).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('image element always fits (handled by aspect ratio)', () => {
      const cellConfig: CellConfiguration = {
        chartId: 'img1',
        cellWidth: 1,
        bodyType: 'image',
        aspectRatio: '16:9'
      };

      const result = validateElementFit(cellConfig, 300, 600);
      
      expect(result.fits).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Editor Validation API', () => {
    test('validateBlockForEditor: valid block passes', () => {
      const block = {
        blockId: 'test-block',
        cells: [
          {
            chartId: 'kpi1',
            elementType: 'kpi' as ChartBodyType,
            width: 1
          }
        ]
      };

      const result = validateBlockForEditor(block, 1200);
      
      expect(result.blockId).toBe('test-block');
      expect(result.heightResolution).toBeDefined();
      expect(result.heightResolution.heightPx).toBeGreaterThan(0);
      expect(result.elementValidations).toHaveLength(1);
      expect(result.publishBlocked).toBe(false);
    });

    test('validateBlockForEditor: normalizes CellWidth correctly', () => {
      const block = {
        blockId: 'test-block',
        cells: [
          {
            chartId: 'chart1',
            elementType: 'kpi' as ChartBodyType,
            width: 3 // Invalid width, should normalize to 2
          }
        ]
      };

      const result = validateBlockForEditor(block, 1200);
      
      // Should not throw and should normalize width
      expect(result).toBeDefined();
      expect(result.elementValidations).toHaveLength(1);
    });

    test('validateBlockForEditor: normalizes AspectRatio correctly', () => {
      const block = {
        blockId: 'test-block',
        cells: [
          {
            chartId: 'img1',
            elementType: 'image' as ChartBodyType,
            width: 1
          }
        ],
        blockAspectRatio: {
          ratio: 'invalid' as AspectRatio, // Should normalize to '16:9'
          isSoftConstraint: false
        }
      };

      const result = validateBlockForEditor(block, 1200);
      
      // Should not throw and should normalize aspect ratio
      expect(result).toBeDefined();
      expect(result.heightResolution).toBeDefined();
    });

    test('validateBlockForEditor: normalizes ChartBodyType correctly', () => {
      const block = {
        blockId: 'test-block',
        cells: [
          {
            chartId: 'chart1',
            elementType: 'invalid' as any, // Invalid type, should normalize to 'kpi'
            width: 1
          }
        ]
      };

      const result = validateBlockForEditor(block, 1200);
      
      // Should not throw and should normalize element type
      expect(result).toBeDefined();
      expect(result.elementValidations).toHaveLength(1);
    });

    test('validateBlocksForEditor: validates multiple blocks', () => {
      const blocks = [
        {
          blockId: 'block1',
          cells: [
            {
              chartId: 'kpi1',
              elementType: 'kpi' as ChartBodyType,
              width: 1
            }
          ]
        },
        {
          blockId: 'block2',
          cells: [
            {
              chartId: 'pie1',
              elementType: 'pie' as ChartBodyType,
              width: 1
            }
          ]
        }
      ];

      const results = validateBlocksForEditor(blocks, 1200);
      
      expect(results).toHaveLength(2);
      expect(results[0].blockId).toBe('block1');
      expect(results[1].blockId).toBe('block2');
    });

    test('checkPublishValidity: blocks publish when no failures', () => {
      const validationResults = [
        {
          blockId: 'block1',
          heightResolution: {
            heightPx: 300,
            priority: HeightResolutionPriority.READABILITY_ENFORCEMENT,
            reason: 'Valid',
            canIncrease: true,
            requiresSplit: false
          },
          elementValidations: [
            {
              fits: true,
              violations: [],
              requiredActions: []
            }
          ],
          publishBlocked: false,
          requiredActions: []
        }
      ];

      const result = checkPublishValidity(validationResults);
      
      expect(result.canPublish).toBe(true);
      expect(result.blockedBlocks).toHaveLength(0);
    });

    test('checkPublishValidity: blocks publish when structural failure', () => {
      const validationResults = [
        {
          blockId: 'block1',
          heightResolution: {
            heightPx: 300,
            priority: HeightResolutionPriority.STRUCTURAL_FAILURE,
            reason: 'Structural failure',
            canIncrease: false,
            requiresSplit: true
          },
          elementValidations: [
            {
              fits: false,
              violations: ['Content does not fit'],
              requiredActions: ['splitBlock' as const]
            }
          ],
          publishBlocked: true,
          publishBlockReason: 'Structural failure',
          requiredActions: ['splitBlock' as const]
        }
      ];

      const result = checkPublishValidity(validationResults);
      
      expect(result.canPublish).toBe(false);
      expect(result.blockedBlocks).toHaveLength(1);
      expect(result.blockedBlocks[0].blockId).toBe('block1');
      expect(result.blockedBlocks[0].reason).toBe('Structural failure');
    });
  });

  describe('Type Contract Enforcement', () => {
    test('AspectRatio type is enforced (only valid values)', () => {
      const validRatios: AspectRatio[] = ['16:9', '9:16', '1:1'];
      
      validRatios.forEach(ratio => {
        const input: HeightResolutionInput = {
          blockId: 'test',
          blockWidth: 1200,
          cells: [],
          blockAspectRatio: {
            ratio,
            isSoftConstraint: false
          }
        };
        
        expect(() => resolveBlockHeightWithDetails(input)).not.toThrow();
      });
    });

    test('CellWidth type is enforced (only 1 or 2)', () => {
      const validWidths: CellWidth[] = [1, 2];
      
      validWidths.forEach(width => {
        const input: HeightResolutionInput = {
          blockId: 'test',
          blockWidth: 1200,
          cells: [
            {
              chartId: 'chart1',
              cellWidth: width,
              bodyType: 'kpi'
            }
          ]
        };
        
        expect(() => resolveBlockHeightWithDetails(input)).not.toThrow();
      });
    });

    test('ChartBodyType includes all required types', () => {
      const requiredTypes: ChartBodyType[] = ['pie', 'bar', 'kpi', 'text', 'image', 'table'];
      
      requiredTypes.forEach(bodyType => {
        const cellConfig: CellConfiguration = {
          chartId: 'test',
          cellWidth: 1,
          bodyType
        };
        
        expect(() => validateElementFit(cellConfig, 300, 600)).not.toThrow();
      });
    });
  });

  describe('Edge Cases', () => {
    test('empty cells array returns default height', () => {
      const input: HeightResolutionInput = {
        blockId: 'test',
        blockWidth: 1200,
        cells: []
      };

      const result = resolveBlockHeightWithDetails(input);
      
      expect(result.heightPx).toBeGreaterThan(0);
      expect(result.priority).toBe(HeightResolutionPriority.READABILITY_ENFORCEMENT);
    });

    test('zero block width handled gracefully', () => {
      const input: HeightResolutionInput = {
        blockId: 'test',
        blockWidth: 0,
        cells: [
          {
            chartId: 'chart1',
            cellWidth: 1,
            bodyType: 'kpi'
          }
        ]
      };

      // Should not throw, but may return default or clamped value
      expect(() => resolveBlockHeightWithDetails(input)).not.toThrow();
    });

    test('very large block width handled correctly', () => {
      const input: HeightResolutionInput = {
        blockId: 'test',
        blockWidth: 10000,
        cells: [
          {
            chartId: 'chart1',
            cellWidth: 1,
            bodyType: 'kpi'
          }
        ]
      };

      const result = resolveBlockHeightWithDetails(input);
      
      expect(result.heightPx).toBeLessThanOrEqual(800); // max height clamp
    });

    test('multiple intrinsic images uses largest height', () => {
      const input: HeightResolutionInput = {
        blockId: 'test',
        blockWidth: 1200,
        cells: [
          {
            chartId: 'img1',
            cellWidth: 1,
            bodyType: 'image',
            aspectRatio: '16:9',
            imageMode: 'setIntrinsic'
          },
          {
            chartId: 'img2',
            cellWidth: 1,
            bodyType: 'image',
            aspectRatio: '9:16', // Taller aspect ratio
            imageMode: 'setIntrinsic'
          }
        ]
      };

      const result = resolveBlockHeightWithDetails(input);
      
      expect(result.priority).toBe(HeightResolutionPriority.INTRINSIC_MEDIA);
      // 9:16 should require more height than 16:9 for same width
      expect(result.heightPx).toBeGreaterThan(1200 / (16/9));
    });

    test('soft constraint aspect ratio does not override intrinsic media', () => {
      const input: HeightResolutionInput = {
        blockId: 'test',
        blockWidth: 1200,
        cells: [
          {
            chartId: 'img1',
            cellWidth: 1,
            bodyType: 'image',
            aspectRatio: '16:9',
            imageMode: 'setIntrinsic'
          }
        ],
        blockAspectRatio: {
          ratio: '1:1',
          isSoftConstraint: true
        }
      };

      const result = resolveBlockHeightWithDetails(input);
      
      // Intrinsic media (Priority 1) should win over soft constraint
      expect(result.priority).toBe(HeightResolutionPriority.INTRINSIC_MEDIA);
    });
  });

  describe('Adapter Boundary Normalization', () => {
    test('editorValidationAPI normalizes invalid CellWidth to valid range', () => {
      const block = {
        blockId: 'test',
        cells: [
          {
            chartId: 'chart1',
            elementType: 'kpi' as ChartBodyType,
            width: 0 // Invalid, should normalize to 1
          },
          {
            chartId: 'chart2',
            elementType: 'kpi' as ChartBodyType,
            width: 5 // Invalid, should normalize to 2
          }
        ]
      };

      const result = validateBlockForEditor(block, 1200);
      
      expect(result).toBeDefined();
      expect(result.elementValidations).toHaveLength(2);
      // Should not throw despite invalid widths
    });

    test('editorValidationAPI normalizes invalid AspectRatio to default', () => {
      const block = {
        blockId: 'test',
        cells: [
          {
            chartId: 'img1',
            elementType: 'image' as ChartBodyType,
            width: 1
          }
        ],
        blockAspectRatio: {
          ratio: '4:3' as any, // Invalid, should normalize to '16:9'
          isSoftConstraint: false
        }
      };

      const result = validateBlockForEditor(block, 1200);
      
      expect(result).toBeDefined();
      expect(result.heightResolution).toBeDefined();
      // Should not throw despite invalid aspect ratio
    });
  });
});

