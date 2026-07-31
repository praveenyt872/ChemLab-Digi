import { create } from 'zustand';
import rotameterConfig from '../data/experiments/rotameter.json';
import venturiConfig from '../data/experiments/venturi.json';
import orificeConfig from '../data/experiments/orifice.json';
import { calculateTable, calculateSummary } from '../engine/formulaEngine';
import { validateObservationData } from '../engine/validationEngine';
import { askAILabAssistant } from '../engine/aiService';

const EXPERIMENT_CONFIGS = {
  rotameter_calibration: rotameterConfig,
  venturi_meter: venturiConfig,
  orifice_meter: orificeConfig
};

export const useExperimentStore = create((set, get) => ({
  // Navigation & Active State
  currentSubject: 'fluid_mechanics',
  currentExperimentId: 'rotameter_calibration',
  experimentConfig: rotameterConfig,

  // Table Data State
  observationRows: rotameterConfig.sample_data || [],
  calculatedRows: calculateTable(
    rotameterConfig.sample_data || [],
    rotameterConfig.calculations,
    rotameterConfig.fixed_inputs
  ),
  validationFlags: validateObservationData(
    rotameterConfig,
    rotameterConfig.sample_data || [],
    calculateTable(rotameterConfig.sample_data || [], rotameterConfig.calculations, rotameterConfig.fixed_inputs)
  ),
  headlineResult: calculateSummary(
    calculateTable(rotameterConfig.sample_data || [], rotameterConfig.calculations, rotameterConfig.fixed_inputs),
    rotameterConfig.experiment_id === 'rotameter_calibration' ? 'Q' : 'Cd'
  ),

  // Modals & UI State
  isOnboardingOpen: false,
  isResetConfirmOpen: false,
  isReportModalOpen: false,
  isDerivationModalOpen: false,
  activeDerivationFormula: null,
  isValidationModalOpen: false,
  activeValidationFlag: null,

  // AI Chat Assistant State
  isChatOpen: false,
  chatMessages: [
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your ChemLab AI Assistant. Ask me anything about formulas, Bernoulli derivations, manometer readings, or troubleshooting your results!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  isAiThinking: false,

  // --- ACTIONS ---

  // Select Active Experiment
  setExperiment: (expId) => {
    const config = EXPERIMENT_CONFIGS[expId] || rotameterConfig;
    const initialRows = config.sample_data || [];
    const computedRows = calculateTable(initialRows, config.calculations, config.fixed_inputs);
    const flags = validateObservationData(config, initialRows, computedRows);
    const primaryKey = expId === 'rotameter_calibration' ? 'Q' : 'Cd';
    const summary = calculateSummary(computedRows, primaryKey);

    set({
      currentExperimentId: expId,
      experimentConfig: config,
      observationRows: initialRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: summary,
      chatMessages: [
        {
          id: `welcome_${expId}`,
          sender: 'ai',
          text: `Welcome to **${config.title}**! I am ready to analyze your readings and answer questions regarding ${config.aim}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  },

  // Update Observation Cell Value
  updateCell: (rowIndex, fieldId, value) => {
    const { observationRows, experimentConfig, currentExperimentId } = get();
    const updatedRows = [...observationRows];
    
    if (!updatedRows[rowIndex]) {
      updatedRows[rowIndex] = {};
    }

    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [fieldId]: value
    };

    const computedRows = calculateTable(
      updatedRows,
      experimentConfig.calculations,
      experimentConfig.fixed_inputs
    );
    const flags = validateObservationData(experimentConfig, updatedRows, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : 'Cd';
    const summary = calculateSummary(computedRows, primaryKey);

    set({
      observationRows: updatedRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: summary
    });
  },

  // Add New Row
  addRow: () => {
    const { observationRows, experimentConfig, currentExperimentId } = get();
    const newRow = {};
    (experimentConfig.trial_inputs || []).forEach(inp => {
      newRow[inp.id] = '';
    });

    const updatedRows = [...observationRows, newRow];
    const computedRows = calculateTable(
      updatedRows,
      experimentConfig.calculations,
      experimentConfig.fixed_inputs
    );
    const flags = validateObservationData(experimentConfig, updatedRows, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : 'Cd';

    set({
      observationRows: updatedRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey)
    });
  },

  // Remove Row
  removeRow: (rowIndex) => {
    const { observationRows, experimentConfig, currentExperimentId } = get();
    const updatedRows = observationRows.filter((_, idx) => idx !== rowIndex);
    const computedRows = calculateTable(
      updatedRows,
      experimentConfig.calculations,
      experimentConfig.fixed_inputs
    );
    const flags = validateObservationData(experimentConfig, updatedRows, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : 'Cd';

    set({
      observationRows: updatedRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey)
    });
  },

  // Reset Table
  resetTable: () => {
    const { experimentConfig, currentExperimentId } = get();
    const defaultRows = Array(5).fill(0).map(() => {
      const emptyRow = {};
      (experimentConfig.trial_inputs || []).forEach(inp => { emptyRow[inp.id] = ''; });
      return emptyRow;
    });

    const computedRows = calculateTable(defaultRows, experimentConfig.calculations, experimentConfig.fixed_inputs);
    const flags = validateObservationData(experimentConfig, defaultRows, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : 'Cd';

    set({
      observationRows: defaultRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey),
      isResetConfirmOpen: false
    });
  },

  // Load Sample Lab Data
  loadSampleData: () => {
    const { experimentConfig, currentExperimentId } = get();
    const sample = experimentConfig.sample_data || [];
    const computedRows = calculateTable(sample, experimentConfig.calculations, experimentConfig.fixed_inputs);
    const flags = validateObservationData(experimentConfig, sample, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : 'Cd';

    set({
      observationRows: sample,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey)
    });
  },

  // Apply AI Suggested Correction
  applyValidationSuggestion: (suggestion) => {
    if (!suggestion || suggestion.rowIdx === undefined || !suggestion.field) return;
    const { updateCell } = get();
    updateCell(suggestion.rowIdx, suggestion.field, suggestion.val);
  },

  // Send AI Assistant Message
  sendChatMessage: async (text) => {
    if (!text.trim()) return;
    const { chatMessages, experimentConfig, observationRows, calculatedRows, headlineResult } = get();

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set({
      chatMessages: [...chatMessages, userMsg],
      isAiThinking: true
    });

    const aiReplyText = await askAILabAssistant(text.trim(), {
      experimentConfig,
      observationData: observationRows,
      calculatedRows,
      headlineResult
    });

    const aiMsg = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiReplyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, aiMsg],
      isAiThinking: false
    }));
  },

  // Modal Open/Close Controls
  setOnboardingOpen: (isOpen) => set({ isOnboardingOpen: isOpen }),
  setResetConfirmOpen: (isOpen) => set({ isResetConfirmOpen: isOpen }),
  setReportModalOpen: (isOpen) => set({ isReportModalOpen: isOpen }),
  setDerivationModal: (formula) => set({ isDerivationModalOpen: !!formula, activeDerivationFormula: formula }),
  setValidationModal: (flag) => set({ isValidationModalOpen: !!flag, activeValidationFlag: flag }),
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen })
}));
