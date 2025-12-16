# Implementation Plan

- [x] 1. Extend database schema for HERO block visibility settings
  - Add heroSettings fields to template configuration collection
  - Add alignmentSettings fields for block element alignment
  - Create database migration script for existing templates
  - Set default values for backward compatibility (all HERO elements visible)
  - _Requirements: 1.5, 3.2, 5.1_

- [x] 2. Update ChartAlgorithmManager with HERO visibility controls
  - Add new "HERO Block Settings" section to template editor
  - Create checkbox controls for emoji visibility (showEmoji)
  - Create checkbox controls for date info visibility (showDateInfo)  
  - Create checkbox controls for export options visibility (showExportOptions)
  - Integrate controls with existing form validation and save logic
  - _Requirements: 1.1, 3.1, 3.2_

- [x] 2.1 Write property test for HERO visibility control
  - **Property 1: HERO element visibility control**
  - **Validates: Requirements 1.2, 1.3, 1.4, 4.1**

- [x] 3. Implement template configuration API extensions
  - Extend PUT /api/chart-config to handle heroSettings
  - Extend GET /api/chart-config to return heroSettings
  - Add validation for boolean HERO visibility fields
  - Ensure backward compatibility with existing template data
  - _Requirements: 3.2, 3.3, 5.1_

- [x] 3.1 Write property test for template settings persistence
  - **Property 2: Template settings persistence round-trip**
  - **Validates: Requirements 3.2, 3.3**

- [ ] 4. Update report rendering components to respect HERO visibility
  - Modify report header component to conditionally render emoji
  - Modify report header component to conditionally render date information
  - Modify report header component to conditionally render export buttons
  - Ensure proper layout flow when elements are hidden
  - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.2_

- [ ] 4.1 Write property test for hidden element layout flow
  - **Property 7: Hidden element layout flow**
  - **Validates: Requirements 4.2**

- [x] 5. Implement CSS alignment system for report blocks
  - Create CSS Grid/Flexbox layout for consistent element alignment
  - Ensure titles align at same height within each block
  - Ensure descriptions align at same height within each block
  - Ensure charts align at same height within each block
  - Allow different overall block heights based on content
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5.1 Write property test for block element alignment
  - **Property 3: Block element alignment consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3, 4.3**

- [ ] 6. Add real-time preview functionality to template editor
  - Update template editor to show live preview of HERO visibility changes
  - Implement immediate preview updates without page refresh
  - Add visual feedback for alignment changes in block preview
  - Ensure preview accurately reflects final report appearance
  - _Requirements: 3.4_

- [ ] 6.1 Write property test for real-time preview updates
  - **Property 6: Real-time preview updates**
  - **Validates: Requirements 3.4**

- [ ] 7. Ensure template independence and isolation
  - Verify that changes to one template don't affect others
  - Test multiple template configurations simultaneously
  - Ensure proper data isolation in database operations
  - Validate template-specific settings persistence
  - _Requirements: 3.5_

- [ ] 7.1 Write property test for template independence
  - **Property 4: Template independence**
  - **Validates: Requirements 3.5**

- [ ] 8. Implement print and export compatibility
  - Ensure HERO visibility settings apply to printed reports
  - Ensure alignment settings preserved in exported reports
  - Test PDF export with various HERO visibility combinations
  - Verify layout consistency across different output formats
  - _Requirements: 4.5_

- [ ] 8.1 Write property test for export format preservation
  - **Property 5: Layout preservation across output formats**
  - **Validates: Requirements 4.5**

- [ ] 9. Add comprehensive error handling and validation
  - Implement validation for HERO settings boolean values
  - Add fallback behavior for invalid template configurations
  - Create user-friendly error messages for template editor
  - Ensure graceful degradation when settings are malformed
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Create backward compatibility migration
  - Write migration script for existing templates without HERO settings
  - Set default values (all HERO elements visible) for legacy templates
  - Test migration with existing production template data
  - Verify no breaking changes to current report functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 11. Final integration testing and validation
  - Test complete workflow from template editor to report rendering
  - Verify all HERO visibility combinations work correctly
  - Test block alignment across different chart types and content lengths
  - Ensure template independence across multiple concurrent users
  - Validate performance impact of new alignment and visibility features
  - _Requirements: All requirements_

- [ ] 11.1 Write integration tests for complete workflow
  - Test template creation, configuration, and report rendering pipeline
  - Verify end-to-end functionality with various template configurations
  - _Requirements: All requirements_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.