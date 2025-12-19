'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';
import { DynamicChart, ChartContainer } from '@/components/DynamicChart';
import { ChartConfiguration, ChartCalculationResult, HeroBlockSettings, BlockAlignmentSettings } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import ColoredCard from '@/components/ColoredCard';
import FormModal from '@/components/modals/FormModal';
import vizStyles from './Visualization.module.css';
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import MaterialIcon from '@/components/MaterialIcon';

// Available chart type for chart assignment
interface AvailableChart {
  chartId: string;
  title: string;
  type: string;
  order: number;
  isActive: boolean;
  emoji?: string;
}

interface ReportTemplate {
  _id: string;
  name: string;
  type: 'event' | 'partner' | 'global';
  isDefault: boolean;
  dataBlocks: Array<{ blockId: string; order: number }>;
  gridSettings: { desktopUnits: number; tabletUnits: number; mobileUnits: number };
  heroSettings?: HeroBlockSettings;
  alignmentSettings?: BlockAlignmentSettings;
}

export default function VisualizationPage() {
  const router = useRouter();
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [availableCharts, setAvailableCharts] = useState<AvailableChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState<DataVisualizationBlock | null>(null);
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  
  // WHAT: Template selection state
  // WHY: Allow editing different report templates on this page
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // WHAT: Template creation modal state
  // WHY: Allow creating new templates from this page
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    type: 'event' as 'event' | 'partner' | 'global',
    isDefault: false
  });
  
  // WHAT: Track which block editors are expanded (default: all collapsed)
  // WHY: Cleaner UX on page load - focus on chart previews, not implementation details
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // WHAT: Status message for smooth UX feedback (no alerts)
  // WHY: Non-blocking notifications, auto-dismiss after 5 seconds
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Live chart preview state (calculated using the same pipeline as stats pages)
  const [chartConfigs, setChartConfigs] = useState<ChartConfiguration[]>([]);
  const [previewResults, setPreviewResults] = useState<Record<string, ChartCalculationResult>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Grid settings for per-block preview alignment
  const [gridUnits, setGridUnits] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });
  const [gridForm, setGridForm] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });

  // HERO settings state for template configuration
  const [heroSettings, setHeroSettings] = useState<HeroBlockSettings>({
    showEmoji: true,
    showDateInfo: true,
    showExportOptions: true
  });
  const [alignmentSettings, setAlignmentSettings] = useState<BlockAlignmentSettings>({
    alignTitles: true,
    alignDescriptions: true,
    alignCharts: true,
    minElementHeight: undefined
  });



  // Form states for new data block
  const [blockForm, setBlockForm] = useState({
    name: '',
    charts: [] as BlockChart[],
    order: 0,
    isActive: true,
    showTitle: true // NEW: Default to showing title
  });

  // WHAT: Helper to show status messages
  // WHY: Replace all alert() calls with smooth, auto-dismissing messages
  const showMessage = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000); // Auto-dismiss after 5 seconds
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      const templates = await loadTemplates();
      await loadUserPreferences(templates); // Pass templates to avoid race condition
      loadAvailableCharts();
      loadChartConfigs();
    };
    
    initializeData();
  }, []);
  
  const loadTemplateConfig = useCallback(async (templateId: string) => {
    try {
      setLoading(true);
      const template = templates.find(t => t._id === templateId);
      if (!template) {
        console.log('❌ Template not found:', templateId);
        return;
      }
      
      console.log('📋 Loading template config for:', template.name);
      console.log('📋 Template dataBlocks:', template.dataBlocks);
      
      // Load data blocks for this template
      const blockIds = template.dataBlocks.map(b => b.blockId).filter((id): id is string => id != null);
      console.log('📋 Block IDs to load:', blockIds);
      
      if (blockIds.length > 0) {
        const response = await fetch('/api/data-blocks');
        const data = await response.json();
        if (data.success) {
          // Filter blocks that belong to this template and sort by order
          const templateBlocks = data.blocks
            .filter((b: DataVisualizationBlock) => b._id && blockIds.includes(b._id))
            .sort((a: DataVisualizationBlock, b: DataVisualizationBlock) => {
              const aRef = template.dataBlocks.find(ref => ref.blockId === a._id);
              const bRef = template.dataBlocks.find(ref => ref.blockId === b._id);
              return (aRef?.order || 0) - (bRef?.order || 0);
            });
          console.log('📋 Loaded template blocks:', templateBlocks.length);
          setDataBlocks(templateBlocks);
        }
      } else {
        console.log('📋 No data blocks configured for this template');
        setDataBlocks([]);
      }
      
      // Set grid settings from template
      setGridUnits({
        desktop: template.gridSettings.desktopUnits,
        tablet: template.gridSettings.tabletUnits,
        mobile: template.gridSettings.mobileUnits
      });
      setGridForm({
        desktop: template.gridSettings.desktopUnits,
        tablet: template.gridSettings.tabletUnits,
        mobile: template.gridSettings.mobileUnits
      });

      // Set HERO settings from template (with defaults if not present)
      setHeroSettings({
        showEmoji: template.heroSettings?.showEmoji ?? true,
        showDateInfo: template.heroSettings?.showDateInfo ?? true,
        showExportOptions: template.heroSettings?.showExportOptions ?? true
      });
      // WHAT: Convert null to undefined for TypeScript compatibility
      // WHY: MongoDB stores undefined as null, but TypeScript expects undefined
      setAlignmentSettings({
        alignTitles: template.alignmentSettings?.alignTitles ?? true,
        alignDescriptions: template.alignmentSettings?.alignDescriptions ?? true,
        alignCharts: template.alignmentSettings?.alignCharts ?? true,
        minElementHeight: template.alignmentSettings?.minElementHeight || undefined
      });
      
    } catch (error) {
      console.error('Failed to load template config:', error);
    } finally {
      setLoading(false);
    }
  }, [templates]);

  // WHAT: Load blocks and grid for selected template
  // WHY: Each template has its own visualization config
  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateConfig(selectedTemplateId);
    }
  }, [selectedTemplateId, loadTemplateConfig]);

  // WHAT: Load user preferences (last selected template)
  // WHY: Remember user's last choice across browsers and sessions
  const loadUserPreferences = async (availableTemplates: ReportTemplate[]) => {
    try {
      const response = await fetch('/api/user-preferences');
      const data = await response.json();
      
      // Handle authentication errors gracefully
      if (!data.success) {
        // Fall through to default template selection
      } else if (data.preferences?.lastSelectedTemplateId) {
        const preferredTemplateId = data.preferences.lastSelectedTemplateId;
        
        // Verify the preferred template still exists
        const templateExists = availableTemplates.some(t => t._id === preferredTemplateId);
        
        if (templateExists) {
          setSelectedTemplateId(preferredTemplateId);
          return;
        }
      }
      
      // Fall back to default template if no preference or preference is invalid
      const defaultTemplate = availableTemplates.find((t: ReportTemplate) => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate._id);
      } else if (availableTemplates.length > 0) {
        setSelectedTemplateId(availableTemplates[0]._id);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      // Fall back to default template on error
      const defaultTemplate = availableTemplates.find((t: ReportTemplate) => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate._id);
      } else if (availableTemplates.length > 0) {
        setSelectedTemplateId(availableTemplates[0]._id);
      }
    }
  };

  // WHAT: Save template selection to preferences
  // WHY: Persist user choice across sessions and browsers
  const handleTemplateChange = async (templateId: string) => {
    if (!templateId || templateId === selectedTemplateId) return;
    
    console.log('Setting template to:', templateId);
    setSelectedTemplateId(templateId);
    
    // Save to preferences (fire and forget, ignore auth errors)
    fetch('/api/user-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastSelectedTemplateId: templateId })
    }).catch(() => {}); // Ignore errors silently
  };

  // WHAT: Load templates and select default on mount
  // WHY: Populate template selector
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/report-templates?includeAssociations=false');
      const data = await response.json();
      
      if (data.success && data.templates) {
        setTemplates(data.templates);
        return data.templates; // Return templates for use in initialization
      } else {
        console.error('Templates API returned error:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  };
  

  // WHAT: Reload template config after changes
  // WHY: Keep UI in sync with database
  const reloadCurrentTemplate = async () => {
    if (selectedTemplateId) {
      await loadTemplateConfig(selectedTemplateId);
    }
  };
  
  const loadAvailableCharts = async () => {
    try {
      const response = await fetch('/api/chart-configs');
      const data = await response.json();
      if (data.success) {
        setAvailableCharts(data.configs);
      }
    } catch (error) {
      console.error('Failed to load available charts:', error);
    }
  };

  // Load chart configurations used by stats pages (public subset)
  const loadChartConfigs = async () => {
    try {
      const response = await fetch('/api/chart-config/public');
      const data = await response.json();
      if (data.success) {
        setChartConfigs(data.configurations);
      }
    } catch (error) {
      console.error('Failed to load chart configurations:', error);
    }
  };

  // WHAT: Save updated template configuration
  // WHY: Persist changes to selected template
  const saveTemplateConfig = async (updatedDataBlocks?: DataVisualizationBlock[]) => {
    if (!selectedTemplateId) return;
    
    const template = templates.find(t => t._id === selectedTemplateId);
    if (!template) return;
    
    const blocksToSave = updatedDataBlocks || dataBlocks;
    const dataBlockRefs = blocksToSave
      .filter(block => block._id)
      .map((block, index) => ({
        blockId: block._id!,
        order: index
      }));
    
    try {
      const response = await fetch(`/api/report-templates?templateId=${selectedTemplateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataBlocks: dataBlockRefs,
          gridSettings: {
            desktopUnits: gridUnits.desktop,
            tabletUnits: gridUnits.tablet,
            mobileUnits: gridUnits.mobile
          },
          heroSettings,
          alignmentSettings
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Update local templates state
        setTemplates(prev => prev.map(t => 
          t._id === selectedTemplateId 
            ? { 
                ...t, 
                dataBlocks: dataBlockRefs, 
                gridSettings: {
                  desktopUnits: gridUnits.desktop,
                  tabletUnits: gridUnits.tablet,
                  mobileUnits: gridUnits.mobile
                },
                heroSettings,
                alignmentSettings
              }
            : t
        ));
      }
    } catch (error) {
      console.error('Failed to save template config:', error);
    }
  };

  // WHAT: Save HERO settings to template immediately (like blocks do)
  // WHY: Follow the same pattern as block updates - save immediately on change
  const saveHeroSettings = useCallback(async (newHeroSettings: HeroBlockSettings, newAlignmentSettings: BlockAlignmentSettings) => {
    if (!selectedTemplateId) return;
    
    try {
      // WHAT: Convert minElementHeight to undefined if it's null or 0
      // WHY: MongoDB stores undefined as null, causing TypeScript type errors
      const cleanedAlignmentSettings = {
        ...newAlignmentSettings,
        minElementHeight: newAlignmentSettings.minElementHeight || undefined
      };
      
      const response = await fetch(`/api/report-templates?templateId=${selectedTemplateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroSettings: newHeroSettings,
          alignmentSettings: cleanedAlignmentSettings
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        console.error('Failed to save HERO settings:', data.error);
      }
      // Don't update local templates state to avoid triggering loadTemplateConfig
      // The settings are already updated in the component state by the onChange handlers
    } catch (error) {
      console.error('Failed to save HERO settings:', error);
    }
  }, [selectedTemplateId]);
  
  // Data Block Management Functions
  const handleUpdateBlock = async (block: DataVisualizationBlock) => {
    console.log('🟢🟢🟢 UPDATING BLOCK IN DATABASE:', {
      blockName: block.name,
      blockId: block._id,
      chartCount: block.charts.length,
      chartIds: block.charts.map(c => c.chartId)
    });
    
    try {
      const data = await apiPut('/api/data-blocks', block);
      
      if (data.success) {
        console.log('✅✅✅ BLOCK SAVED SUCCESSFULLY:', block.name);
        const updatedBlocks = dataBlocks.map(b => b._id === block._id ? block : b);
        setDataBlocks(updatedBlocks);
        await saveTemplateConfig(updatedBlocks);
        setEditingBlock(null);
        showMessage('success', 'Block updated successfully!');
      } else {
        console.error('❌❌❌ BLOCK SAVE FAILED:', data.error);
        showMessage('error', 'Failed to update block: ' + data.error);
      }
    } catch (error) {
      console.error('❌❌❌ BLOCK SAVE ERROR:', error);
      showMessage('error', 'Failed to update block');
    }
  };
  
  const handleDeleteBlock = async (blockId: string) => {
    // TODO: Replace confirm() with modal dialog in future enhancement
    if (!confirm('Are you sure you want to delete this data block?')) {
      return;
    }
    
    try {
      const data = await apiDelete(`/api/data-blocks?id=${blockId}`);
      
      if (data.success) {
        const updatedBlocks = dataBlocks.filter(b => b._id !== blockId);
        setDataBlocks(updatedBlocks);
        await saveTemplateConfig(updatedBlocks);
        showMessage('success', 'Block deleted successfully!');
      } else {
        showMessage('error', 'Failed to delete block: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
      showMessage('error', 'Failed to delete block');
    }
  };
  
  const handleCreateBlock = async () => {
    if (!blockForm.name.trim()) {
      showMessage('error', 'Block name is required');
      return;
    }
    
    if (!selectedTemplateId) {
      showMessage('error', 'Please select a template first');
      return;
    }
    
    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      const data = await apiPost('/api/data-blocks', blockForm);
      
      if (data.success) {
        // Add new block to current template
        const newBlock = data.block;
        const updatedBlocks = [...dataBlocks, newBlock];
        setDataBlocks(updatedBlocks);
        
        // Save to template
        await saveTemplateConfig(updatedBlocks);
        
        setShowCreateBlock(false);
        setBlockForm({
          name: '',
          charts: [],
          order: 0,
          isActive: true,
          showTitle: true
        });
        showMessage('success', 'Data block created and added to template!');
      } else {
        showMessage('error', 'Failed to create block: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create block:', error);
      showMessage('error', 'Failed to create block');
    }
  };
  
  
  
  // Calculate preview results for a given block's charts using the same pipeline as stats pages
  const calculatePreviewForBlock = useCallback((block: DataVisualizationBlock) => {
    if (!chartConfigs || chartConfigs.length === 0) return;

    try {
      setIsCalculating(true);
      // Build a fake baseline stats object that covers all fields with non-zero values
      // Why: Admin preview must render charts even without a specific project loaded
      const baselineStats: any = {
        remoteImages: 120, hostessImages: 80, selfies: 40,
        indoor: 200, outdoor: 150, stadium: 50,
        female: 180, male: 220,
        genAlpha: 60, genYZ: 180, genX: 100, boomer: 60,
        merched: 90, jersey: 70, scarf: 40, flags: 30, baseballCap: 25, other: 15,
        approvedImages: 180, rejectedImages: 20,
        visitQrCode: 120, visitShortUrl: 40, visitWeb: 300, visitFacebook: 80, visitInstagram: 120,
        visitYoutube: 40, visitTiktok: 50, visitX: 35, visitTrustpilot: 10,
        eventAttendees: 12000, eventTicketPurchases: 9500,
        eventResultHome: 2, eventResultVisitor: 1,
        eventValuePropositionVisited: 600, eventValuePropositionPurchases: 75,
        jerseyPrice: 70, scarfPrice: 15, flagsPrice: 20, capPrice: 25, otherPrice: 10
      };

      // Add sample image and text data for report content charts
      for (let i = 1; i <= 100; i++) {
        baselineStats[`reportImage${i}`] = `https://picsum.photos/400/300?random=${i}`;
        baselineStats[`reportText${i}`] = `Sample text content ${i}`;
      }

      // Calculate using the shared calculator
      const results = calculateActiveCharts(chartConfigs, baselineStats);
      // Normalize into a map for quick lookup by chartId
      const map: Record<string, ChartCalculationResult> = {};
      results.forEach(r => { map[r.chartId] = r; });
      setPreviewResults(prev => ({ ...prev, ...map }));
    } catch (err) {
      console.error('Failed to calculate preview charts:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [chartConfigs]);

  // Auto-calculate previews when both chart configurations and blocks are available
  // Why: The admin needs to see an immediate WYSIWYG preview without any interactions
  useEffect(() => {
    if (chartConfigs.length > 0 && dataBlocks.length > 0) {
      dataBlocks.forEach(b => calculatePreviewForBlock(b));
    }
  }, [chartConfigs, dataBlocks, calculatePreviewForBlock]);

  const addChartToBlock = (block: DataVisualizationBlock, chartId: string) => {
    const chart = availableCharts.find(c => c.chartId === chartId);
    if (!chart) return;
    
    const newChart: BlockChart = {
      chartId,
      width: 1,
      order: block.charts.length
    };
    
    const updatedBlock = {
      ...block,
      charts: [...block.charts, newChart]
    };
    
    console.log('🔵🔵🔵 ADDING CHART TO BLOCK:', {
      blockName: block.name,
      blockId: block._id,
      addingChart: chartId,
      newTotalCharts: updatedBlock.charts.length,
      allChartIds: updatedBlock.charts.map(c => c.chartId)
    });
    
    // WHAT: Show visible status message when adding chart
    // WHY: Console logs are being lost due to 11k+ message overflow
    showMessage('info', `Adding "${chart.title}" to ${block.name}...`);
    
    handleUpdateBlock(updatedBlock);
    // Recalculate preview for this block so the new chart immediately appears
    calculatePreviewForBlock(updatedBlock);
  };
  
  const removeChartFromBlock = (block: DataVisualizationBlock, chartIndex: number) => {
    const updatedCharts = block.charts.filter((_, index) => index !== chartIndex);
    // Reorder remaining charts
    const reorderedCharts = updatedCharts.map((chart, index) => ({ ...chart, order: index }));
    
    const updatedBlock = {
      ...block,
      charts: reorderedCharts
    };
    
    handleUpdateBlock(updatedBlock);
  };
  
  const updateChartWidth = (block: DataVisualizationBlock, chartIndex: number, newWidth: number) => {
    const updatedCharts = [...block.charts];
    // WHAT: Clamp width to 1 or 2 units (Spec v2.0)
    // WHY: Deterministic layout requires simplified unit system
    // HOW: Accept user input but clamp to [1, 2] range
    updatedCharts[chartIndex] = { ...updatedCharts[chartIndex], width: Math.min(Math.max(newWidth, 1), 2) };
    
    const updatedBlock = {
      ...block,
      charts: updatedCharts
    };
    
    handleUpdateBlock(updatedBlock);
    // No need to recalc data; width change affects only layout span, preview already computed
  };
  
  const resetBlockForm = () => {
    setBlockForm({
      name: '',
      charts: [],
      order: 0,
      isActive: true,
      showTitle: true // NEW: Default to showing title
    });
  };
  
  // WHAT: Toggle block editor visibility
  // WHY: Single function handles add/remove from Set for any block
  const toggleBlockEditor = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };
  
  // WHAT: Create new template
  // WHY: Allow creating templates with empty config, then auto-select
  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim()) {
      showMessage('error', 'Template name is required');
      return;
    }
    
    try {
      const response = await fetch('/api/report-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateForm.name.trim(),
          description: templateForm.description.trim(),
          type: templateForm.type,
          isDefault: templateForm.isDefault,
          dataBlocks: [],
          gridSettings: {
            desktopUnits: 4,
            tabletUnits: 2,
            mobileUnits: 1
          }
        })
      });
      
      const data = await response.json();
      if (data.success && data.template) {
        // Reload templates list
        await loadTemplates();
        // Auto-select newly created template
        setSelectedTemplateId(data.template._id);
        // Close modal and reset form
        setShowCreateTemplate(false);
        setTemplateForm({
          name: '',
          description: '',
          type: 'event',
          isDefault: false
        });
        showMessage('success', 'Template created successfully!');
      } else {
        showMessage('error', data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      showMessage('error', 'Failed to create template');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <ColoredCard accentColor="#6366f1" hoverable={false} className="p-8 text-center">
          <div className="loading-spinner-viz"></div>
          <p>Loading data visualization blocks...</p>
        </ColoredCard>
      </div>
    );
  }

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="👁️ Visualization Manager"
        subtitle="Manage data visualization blocks and chart layouts"
        backLink="/admin"
        showSearch={false}
      />
      
      {/* WHAT: Status Message - Smooth UX feedback without page reloads
          WHY: Replace alert() dialogs with auto-dismissing status messages */}
      {statusMessage && (
        <div className={`${vizStyles.statusMessage} ${statusMessage.type === 'success' ? vizStyles.statusSuccess : vizStyles.statusError}`}>
          {statusMessage.type === 'success' ? '✅' : '❌'} {statusMessage.text}
        </div>
      )}
      
      {/* WHAT: Template Selector Card
          WHY: Allow selecting which template to edit */}
      <ColoredCard accentColor="#3b82f6" hoverable={false}>
        <div className={vizStyles.templateSelector}>
          <div className={vizStyles.templateSelectorHeader}>
            <h3 className={vizStyles.templateSelectorTitle}>📊 Select Report Template</h3>
            <p className={vizStyles.templateSelectorSubtitle}>
              Choose a template to configure its visualization blocks and charts
            </p>
            
          </div>
          
          <div className={vizStyles.templateSelectorControls}>
            
            <div className={vizStyles.templateSelectorRow}>
              <select
                className={vizStyles.templateDropdown}
                value={selectedTemplateId || ''}
                onChange={(e) => {
                  console.log('Template dropdown changed to:', e.target.value);
                  const selectedTemplate = templates.find(t => t._id === e.target.value);
                  console.log('Selected template:', selectedTemplate?.name);
                  handleTemplateChange(e.target.value);
                }}
              >
                <option value="" disabled>Select a template...</option>
                {templates.map(template => {
                  const isLivePartnerReportTemplate = template.name === 'Default Event Report' && template.type === 'event';
                  const isPartnerTemplate = template.type === 'partner';
                  return (
                    <option key={template._id} value={template._id}>
                      {template.isDefault && '⭐ '}
                      {isLivePartnerReportTemplate && '🎯 '}
                      {template.name} ({template.type})
                      {isLivePartnerReportTemplate && ' - Fallback Template for Partner Reports'}
                      {isPartnerTemplate && ' - Partner-Specific Template'}
                    </option>
                  );
                })}
              </select>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Find and select the Default Event Report template
                  const defaultEventTemplate = templates.find(t => t.name === 'Default Event Report' && t.type === 'event');
                  if (defaultEventTemplate) {
                    const confirmed = confirm(
                      'This will switch to "Default Event Report" template, which is the fallback template for partner reports.\n\n' +
                      'Click OK to edit the fallback template, or Cancel to continue editing your current selection (which may be used by specific partners).'
                    );
                    if (confirmed) {
                      handleTemplateChange(defaultEventTemplate._id);
                    }
                  }
                }}
                type="button"
                className="btn btn-small btn-secondary"
                style={{ marginRight: '0.5rem' }}
              >
                🎯 Edit Live Partner Reports
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreateTemplate(true);
                }}
                type="button"
                className="btn btn-small btn-primary"
              >
                ➕ New Template
              </button>
            </div>
            
            {selectedTemplateId && (
              <div className={vizStyles.templateInfo}>
                <span className={vizStyles.templateInfoItem}>
                  📊 {dataBlocks.length} blocks
                </span>
                <span className={vizStyles.templateInfoItem}>
                  🔲 {gridUnits.desktop}x grid
                </span>
              </div>
            )}
          </div>
        </div>
      </ColoredCard>
      
      {/* WHAT: Create Template Modal
          WHY: Allow creating new report templates with empty config */}
      <FormModal
        isOpen={showCreateTemplate}
        onClose={() => {
          setShowCreateTemplate(false);
          setTemplateForm({ name: '', description: '', type: 'event', isDefault: false });
        }}
        onSubmit={handleCreateTemplate}
        title="➕ Create New Report Template"
        size="md"
      >
        <div className="form-section">
          <div className="form-group mb-4">
            <label className="form-label-block">Template Name *</label>
            <input
              type="text"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              placeholder="e.g., Partner Annual Report, Event Dashboard"
              className="form-input"
            />
          </div>
          
          <div className="form-group mb-4">
            <label className="form-label-block">Description</label>
            <textarea
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              placeholder="Optional description of this template's purpose"
              className="form-input"
              rows={3}
            />
          </div>
          
          <div className="form-group mb-4">
            <label className="form-label-block">Template Type *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="templateType"
                  value="event"
                  checked={templateForm.type === 'event'}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as 'event' | 'partner' | 'global' })}
                />
                <span>Event Report</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="templateType"
                  value="partner"
                  checked={templateForm.type === 'partner'}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as 'event' | 'partner' | 'global' })}
                />
                <span>Partner Report</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="templateType"
                  value="global"
                  checked={templateForm.type === 'global'}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as 'event' | 'partner' | 'global' })}
                />
                <span>Global Default</span>
              </label>
            </div>
          </div>
          
          <div className="form-group mb-4">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={templateForm.isDefault}
                onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
              />
              <span>Set as default template</span>
            </label>
          </div>
        </div>
      </FormModal>
      
      {!selectedTemplateId && (
        <ColoredCard accentColor="#f59e0b">
          <div className="info-box">
            <h4 className="info-box-title">⚠️ No Template Selected</h4>
            <p>Please select a report template above to configure its visualization blocks.</p>
          </div>
        </ColoredCard>
      )}

      {/* WHAT: HERO Block Settings Section
          WHY: Allow configuring report header elements at template level */}
      {selectedTemplateId && (
        <ColoredCard accentColor="#f59e0b" hoverable={false}>
          <h2 className="section-title mb-6">🏒 HERO Block Settings</h2>
          <p className="section-subtitle mb-6">
            Control which elements appear in the report header for all reports using this template
          </p>
          
          <div className="form-section">
            <div className="form-group mb-6">
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>Header Element Visibility</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={heroSettings.showEmoji}
                    onChange={(e) => {
                      const newHeroSettings = { ...heroSettings, showEmoji: e.target.checked };
                      setHeroSettings(newHeroSettings);
                      saveHeroSettings(newHeroSettings, alignmentSettings);
                    }}
                  />
                  <span>Show Emoji (🏒)</span>
                </label>
                
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={heroSettings.showDateInfo}
                    onChange={(e) => {
                      const newHeroSettings = { ...heroSettings, showDateInfo: e.target.checked };
                      setHeroSettings(newHeroSettings);
                      saveHeroSettings(newHeroSettings, alignmentSettings);
                    }}
                  />
                  <span>Show Date Info (Created/Updated)</span>
                </label>
                
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={heroSettings.showExportOptions}
                    onChange={(e) => {
                      const newHeroSettings = { ...heroSettings, showExportOptions: e.target.checked };
                      setHeroSettings(newHeroSettings);
                      saveHeroSettings(newHeroSettings, alignmentSettings);
                    }}
                  />
                  <span>Show Export Options (PDF/Excel buttons)</span>
                </label>
              </div>
            </div>
            
            <div className="form-group mb-6">
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>Block Element Alignment</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={alignmentSettings.alignTitles}
                    onChange={(e) => {
                      const newAlignmentSettings = { ...alignmentSettings, alignTitles: e.target.checked };
                      setAlignmentSettings(newAlignmentSettings);
                      saveHeroSettings(heroSettings, newAlignmentSettings);
                    }}
                  />
                  <span>Align Titles</span>
                </label>
                
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={alignmentSettings.alignDescriptions}
                    onChange={(e) => {
                      const newAlignmentSettings = { ...alignmentSettings, alignDescriptions: e.target.checked };
                      setAlignmentSettings(newAlignmentSettings);
                      saveHeroSettings(heroSettings, newAlignmentSettings);
                    }}
                  />
                  <span>Align Descriptions</span>
                </label>
                
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={alignmentSettings.alignCharts}
                    onChange={(e) => {
                      const newAlignmentSettings = { ...alignmentSettings, alignCharts: e.target.checked };
                      setAlignmentSettings(newAlignmentSettings);
                      saveHeroSettings(heroSettings, newAlignmentSettings);
                    }}
                  />
                  <span>Align Charts</span>
                </label>
              </div>
              
              <div className="form-row mt-4">
                <label className="form-label">Minimum Element Height (px)</label>
                <input
                  type="number"
                  value={alignmentSettings.minElementHeight || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    const newAlignmentSettings = { ...alignmentSettings, minElementHeight: value };
                    setAlignmentSettings(newAlignmentSettings);
                    saveHeroSettings(heroSettings, newAlignmentSettings);
                  }}
                  placeholder="Optional (e.g., 100)"
                  className="form-input"
                  style={{ width: '200px' }}
                />
              </div>
            </div>
            
            <div className="info-note mt-4">
              💡 <strong>Tip:</strong> These settings control what appears in report headers and how elements are aligned within blocks. 
              Changes are saved automatically and apply to all reports using this template.
            </div>
          </div>
        </ColoredCard>
      )}

      {/* WHAT: Data Visualization Blocks Section
          WHY: Only show when template is selected */}
      {selectedTemplateId && (
        <ColoredCard accentColor="#6366f1" hoverable={false}>
          <h2 className="section-title mb-6">Data Visualization Blocks</h2>
        
        {/* Responsive Grid Info */}
        <div className="info-box">
          <h4 className="info-box-title">
            📐 Responsive Grid System
          </h4>
          <div className="info-grid">
            <div className="info-grid-item">
              <span className="info-grid-emoji">📱</span>
              <div>
                <strong>Mobile:</strong><br />
                2 units per row
              </div>
            </div>
            <div className="info-grid-item">
              <span className="info-grid-emoji">📱</span>
              <div>
                <strong>Tablet:</strong><br />
                3 units per row
              </div>
            </div>
            <div className="info-grid-item">
              <span className="info-grid-emoji">💻</span>
              <div>
                <strong>Desktop (Stats Page):</strong><br />
                Up to 6 units per row (block-configurable)
              </div>
            </div>
          </div>
          <p className="info-note">
            Preview below uses the same responsive grid as stats pages. A width=2 chart spans two columns within the block; columns per block are capped at 2 on tablet and up to 6 on desktop.
          </p>
        </div>
        
        {/* Create New Block Button */}
        <div className="section-header">
          <h3 className="section-header-title">Current Blocks ({dataBlocks.length})</h3>
          <button
            onClick={() => {
              setShowCreateBlock(true);
              resetBlockForm();
            }}
            className="btn btn-small btn-primary"
          >
            ➕ New Block
          </button>
        </div>
        
        {/* Create Block Form */}
        {showCreateBlock && (
          <div className="success-box">
            <h4 className="success-box-title">➕ Create New Data Block</h4>
            
            <div className="form-section">
              <div className="form-row">
                <div>
                  <label className="form-label">Block Name</label>
                  <input
                    type="text"
                    value={blockForm.name}
                    onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                    placeholder="e.g., Main Dashboard, Performance Metrics"
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="form-label">Order</label>
                  <input
                    type="number"
                    value={blockForm.order}
                    onChange={(e) => setBlockForm({ ...blockForm, order: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="flex-row">
                <button
                  onClick={handleCreateBlock}
                  className="btn btn-small btn-primary"
                >
                  Create Block
                </button>
                <button
                  onClick={() => {
                    setShowCreateBlock(false);
                    resetBlockForm();
                  }}
                  className="btn btn-small btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Existing Blocks with Full Management (Drag-and-Drop Reordering) */}
        {dataBlocks.length === 0 ? (
          <div className="empty-state">
            <h4 className="empty-state-title">📊 No Data Blocks Yet</h4>
            <p className="empty-state-text">
              Create your first data visualization block to organize and display your charts.
            </p>
          </div>
        ) : (
          <div className="content-grid"
            onDragOver={(e) => e.preventDefault()}
          >
            {dataBlocks
              .sort((a, b) => a.order - b.order)
              .map((block, idx) => (
              <div 
                key={block._id}
                className="block-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(idx));
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const fromIdx = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10);
                  if (isNaN(fromIdx) || fromIdx === idx) return;
                  const ordered = [...dataBlocks].sort((a,b)=>a.order-b.order);
                  const [moved] = ordered.splice(fromIdx, 1);
                  ordered.splice(idx, 0, moved);
                  // Reassign sequential order
                  const reindexed = ordered.map((b, i) => ({ ...b, order: i }));
                  setDataBlocks(reindexed);
                  // Persist sequentially
                  for (const b of reindexed) {
                    await handleUpdateBlock(b);
                  }
                }}
                onMouseEnter={() => calculatePreviewForBlock(block)}
              >
                {/* Block Header */}
                <div className="block-header">
                  <div>
                    <h4 className="block-title">{block.name}</h4>
                    <div className="block-meta">
                      <span><strong>Charts:</strong> {block.charts?.length || 0}</span>
                      <span><strong>Order:</strong> {block.order}</span>
                    </div>
                  </div>
                  
                  {/* WHAT: Action buttons stacked vertically on right
                   * WHY: Consistent with hashtags, categories, variables, design pages */}
                  <div className="block-actions">
                    <div className={`status-badge ${block.isActive ? 'status-badge-active' : 'status-badge-inactive'}`}>
                      {block.isActive ? 'Active' : 'Inactive'}
                    </div>
                    
                    <div className="action-buttons-container">
                      <button
                        onClick={() => setEditingBlock(block)}
                        className="btn btn-small btn-primary action-button"
                      >
                        <MaterialIcon name="edit" variant="outlined" style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block._id!)}
                        className="btn btn-small btn-danger action-button"
                      >
                        <MaterialIcon name="delete" variant="outlined" style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                        Delete
                      </button>
                      <span className="drag-handle" title="Drag to reorder">⮕️</span>
                    </div>
                  </div>
                </div>
                
                {/* Charts in this Block */}
                <div>
                  {!block.charts || block.charts.length === 0 ? (
                    <div className="empty-charts">
                      <p>No charts assigned to this block yet</p>
                      <p>Use &quot;Add Chart&quot; to assign charts from available options</p>
                    </div>
                  ) : (
                    <>
                      {/* Live Preview Grid - matches UnifiedDataVisualization */}
                      {/* WHAT: Apply CSS module base classes + dynamic grid ID for per-block responsive styling
                           WHY: Static styles use CSS modules; dynamic responsive grid uses inline <style> with block ID */}
                      <div className={`charts-grid charts-grid-${block._id || 'preview'} viz-preview-grid ${vizStyles.chartsGridBase}`}>
                        {block.charts
                          .sort((a, b) => a.order - b.order)
                          .map((chart) => {
                            const result = previewResults[chart.chartId];
                            if (!result) return null;
                            return (
                              <div key={`${block._id}-${chart.chartId}`} className={vizStyles.chartItem}>
                                <ChartContainer
                                  title={result.title}
                                  subtitle={result.subtitle}
                                  emoji={result.emoji}
                                  className={vizStyles.unifiedChartItem}
                                  chartWidth={chart.width}
                                >
                                  <DynamicChart result={result} chartWidth={chart.width} />
                                </ChartContainer>
                              </div>
                            );
                          })
                          .filter(Boolean)
                        }
                      </div>

                      {/* WHAT: Dynamic responsive grid styling per block ID
                           WHY: Match UnifiedDataVisualization fr-based proportional grid system
                           HOW: Build fr units from chart widths (e.g., [2, 2, 3] → "2fr 2fr 3fr") */}
                      <style jsx>{`
                        /* Desktop: Auto-calculated fr units from chart widths (matches report pages) */
                        .charts-grid-${block._id || 'preview'} { 
                          grid-template-columns: ${block.charts
                            .sort((a, b) => a.order - b.order)
                            .map(c => `${Math.max(1, c.width || 1)}fr`)
                            .join(' ')} !important;
                          justify-items: stretch !important;
                          align-items: start;
                        }
                        /* Tablet: Auto-wrap with 300px minimum width per chart */
                        @media (max-width: 1023px) {
                          .charts-grid-${block._id || 'preview'} { 
                            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; 
                          }
                        }
                        /* Mobile: Force single column */
                        @media (max-width: 767px) {
                          .charts-grid-${block._id || 'preview'} { 
                            grid-template-columns: 1fr !important; 
                          }
                        }
                        /* Chart container overrides */
                        .charts-grid-${block._id || 'preview'} :global(.chart-container) { 
                          min-width: 0 !important; 
                          max-width: none !important; 
                          width: 100% !important; 
                        }
                        .charts-grid-${block._id || 'preview'} :global(.chart-legend) { 
                          min-width: 0 !important; 
                          width: 100% !important; 
                          max-width: 100% !important; 
                          overflow: hidden; 
                        }
                      `}</style>
                    </>
                  )}
                  
                  {/* WHAT: Toggle button for show/hide editor settings */}
                  {/* WHY: Positioned between preview and editor for clear visual separation */}
                  <button
                    onClick={() => toggleBlockEditor(block._id!)}
                    className={vizStyles.toggleButton}
                    aria-expanded={expandedBlocks.has(block._id!)}
                    aria-controls={`editor-${block._id}`}
                  >
                    {expandedBlocks.has(block._id!) ? '⚙️ Hide Settings' : '⚙️ Show Settings'}
                  </button>
                  
                  {/* WHAT: Collapsible editor section containing chart controls + add buttons */}
                  {/* WHY: Hidden by default to reduce cognitive load, shown on demand */}
                  <div
                    id={`editor-${block._id}`}
                    className={`${vizStyles.editorSection} ${
                      expandedBlocks.has(block._id!) ? '' : vizStyles.editorSectionHidden
                    }`}
                  >
                    {/* Controls */}
                    <div className="chart-controls-grid">
                    {block.charts.map((chart, index) => {
                      const chartConfig = availableCharts.find(c => c.chartId === chart.chartId);
                      return (
                        <div key={`${chart.chartId}-${index}`} className="chart-control-item">
                          <div className="chart-info">
                            <span className="chart-emoji">{chartConfig?.emoji || '📊'}</span>
                            <div>
                              <div className="chart-details">
                                {chartConfig?.title || chart.chartId}
                              </div>
                              <div className="chart-meta">
                                Width: {chart.width} unit{chart.width > 1 ? 's' : ''} • Order: {chart.order}
                                <br />
                                <span className="chart-sub-meta">
                                  Preview updates instantly to reflect unit width and block columns
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="chart-controls">
                            {/* WHAT: Chart width selector (Spec v2.0 - simplified to 1 or 2 units)
                                WHY: Deterministic layout requires 1-unit (compact) or 2-unit (detailed) cells
                                HOW: Image aspect ratios drive row height, not unit counts
                                MIGRATION: Values >2 auto-clamped to 2 on save */}
                            <select
                              value={Math.min(chart.width, 2)}
                              onChange={(e) => updateChartWidth(block, index, parseFloat(e.target.value))}
                              className="chart-select"
                            >
                              <option value={1}>Width: 1 unit (compact)</option>
                              <option value={2}>Width: 2 units (detailed)</option>
                            </select>
                            
                            <button
                              onClick={() => removeChartFromBlock(block, index)}
                              className="btn btn-small btn-danger"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Chart to Block */}
                  {/* WHAT: Separate regular charts, report images, and report texts for better UX */}
                  {/* WHY: Visual thumbnails for images and text previews make selection easier */}
                  {(() => {
                    const unassignedCharts = availableCharts.filter(chart => 
                      !block.charts.some(blockChart => blockChart.chartId === chart.chartId)
                    );
                    
                    // WHAT: Detect report content charts by chartId pattern OR title pattern
                    // WHY: Support both new auto-generated (report-image-N) and old manual ([stats.reportImageN])
                    // HOW: Add null safety checks for title field to prevent "undefined.includes" errors
                    const regularCharts = unassignedCharts.filter(c => 
                      !c.chartId.startsWith('report-image-') && 
                      !c.chartId.startsWith('report-text-') &&
                      !(c.title && c.title.includes('[stats.reportImage')) &&
                      !(c.title && c.title.includes('[stats.reportText'))
                    );
                    const reportImages = unassignedCharts.filter(c => 
                      c.chartId.startsWith('report-image-') || 
                      (c.title && c.title.includes('[stats.reportImage'))
                    );
                    const reportTexts = unassignedCharts.filter(c => 
                      c.chartId.startsWith('report-text-') || 
                      (c.title && c.title.includes('[stats.reportText'))
                    );
                    
                    return (
                      <>
                        {/* Regular Charts */}
                        {regularCharts.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--mm-gray-700)' }}>
                              Standard Charts
                            </h4>
                            <div className="flex-row flex-wrap" style={{ marginBottom: '1.5rem' }}>
                              {regularCharts.map(chart => (
                                <button
                                  key={chart.chartId}
                                  onClick={() => addChartToBlock(block, chart.chartId)}
                                  className="btn btn-small btn-secondary"
                                >
                                  {chart.emoji || '📊'} {chart.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Report Images with Thumbnails */}
                        {reportImages.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--mm-gray-700)' }}>
                              Report Images
                            </h4>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                              gap: '0.75rem',
                              marginBottom: '1.5rem'
                            }}>
                              {reportImages.map(chart => {
                                // WHAT: Show placeholder thumbnail for report images
                                // WHY: Actual image URLs would require fetching project data
                                // HOW: Use chart icon and title for now (future: fetch sample project)
                                
                                return (
                                  <button
                                    key={chart.chartId}
                                    onClick={() => addChartToBlock(block, chart.chartId)}
                                    style={{
                                      border: '2px solid var(--mm-gray-300)',
                                      borderRadius: 'var(--mm-radius-md)',
                                      padding: '0.5rem',
                                      background: 'var(--mm-white)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--mm-blue-500)';
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--mm-gray-300)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <div style={{
                                      width: '100%',
                                      height: '80px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      borderRadius: 'var(--mm-radius-sm)',
                                      fontSize: '2rem'
                                    }}>
                                      🖼️
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--mm-gray-700)', textAlign: 'center' }}>
                                      {chart.title}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Report Texts with Previews */}
                        {reportTexts.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--mm-gray-700)' }}>
                              Report Texts
                            </h4>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                              gap: '0.75rem',
                              marginBottom: '1.5rem'
                            }}>
                              {reportTexts.map(chart => {
                                // WHAT: Show placeholder for report texts
                                // WHY: Actual text content would require fetching project data
                                // HOW: Show chart title and type info
                                
                                return (
                                  <button
                                    key={chart.chartId}
                                    onClick={() => addChartToBlock(block, chart.chartId)}
                                    style={{
                                      border: '2px solid var(--mm-gray-300)',
                                      borderRadius: 'var(--mm-radius-md)',
                                      padding: '0.75rem',
                                      background: 'var(--mm-white)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-start',
                                      gap: '0.5rem',
                                      transition: 'all 0.2s',
                                      textAlign: 'left',
                                      minHeight: '100px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--mm-blue-500)';
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--mm-gray-300)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--mm-gray-900)' }}>
                                      {chart.title}
                                    </span>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      color: 'var(--mm-gray-600)',
                                      lineHeight: '1.4',
                                      background: 'var(--mm-gray-50)',
                                      padding: '0.5rem',
                                      borderRadius: 'var(--mm-radius-sm)',
                                      fontStyle: 'italic'
                                    }}>
                                      📝 Text content block
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  
                  {availableCharts.filter(chart => !block.charts.some(blockChart => blockChart.chartId === chart.chartId)).length === 0 && (
                    <p className="info-note">
                      All available charts have been assigned to this block.
                    </p>
                  )}
                  </div>
                  {/* End of collapsible editor section */}
                </div>
              </div>
            ))}
          </div>
        )}
      </ColoredCard>
      )}

      {/* WHAT: Edit Block Modal migrated to unified FormModal
       * WHY: Consistent modal behavior across all admin pages */}
      {editingBlock && (
        <FormModal
          isOpen={!!editingBlock}
          onClose={() => setEditingBlock(null)}
          onSubmit={async () => {
            await handleUpdateBlock(editingBlock);
          }}
          title={`Edit Data Block: ${editingBlock.name}`}
          submitText="Update Block"
          size="lg"
        >
            <div className="form-section">
              <div className="form-row">
                <div>
                  <label className="form-label">Block Name</label>
                  <input
                    type="text"
                    value={editingBlock.name}
                    onChange={(e) => setEditingBlock({ ...editingBlock, name: e.target.value })}
                    placeholder="e.g., Main Dashboard, Performance Metrics"
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="form-label">Order</label>
                  <input
                    type="number"
                    value={editingBlock.order}
                    onChange={(e) => setEditingBlock({ ...editingBlock, order: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
                
              </div>
              <p className="info-note">
                💡 Grid columns auto-calculated from chart widths (e.g., widths 2+2+3 = &ldquo;2fr 2fr 3fr&rdquo; grid).<br/>
                Tablet: auto-wrap at 300px min-width | Mobile: single column
              </p>
              
              <div>
                <label className="flex-row checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingBlock.isActive}
                    onChange={(e) => setEditingBlock({ ...editingBlock, isActive: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span className="form-label">Active</span>
                </label>
                <p className="info-note">
                  Inactive blocks will not be displayed on the frontend
                </p>
              </div>
              
              <div>
                <label className="flex-row checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingBlock.showTitle !== false}
                    onChange={(e) => setEditingBlock({ ...editingBlock, showTitle: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span className="form-label">Show Title</span>
                </label>
                <p className="info-note">
                  When unchecked, the block title will not be displayed on stat pages
                </p>
              </div>
            </div>
        </FormModal>
      )}
    </div>
  );
}
