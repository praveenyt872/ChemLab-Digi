import { create } from 'zustand';
import rotameterConfig from '../data/experiments/rotameter.json';
import venturiConfig from '../data/experiments/venturi.json';
import orificeConfig from '../data/experiments/orifice.json';
import processControlConfig from '../data/experiments/process_control_first_order.json';
import { calculateTable, calculateSummary } from '../engine/formulaEngine';
import { validateObservationData } from '../engine/validationEngine';
import { askAILabAssistant } from '../engine/aiService';
import { saveSessionToDb, loadSessionFromDb } from '../utils/indexedDbStore';

const EXPERIMENT_CONFIGS = {
  rotameter_calibration: rotameterConfig,
  venturi_meter: venturiConfig,
  orifice_meter: orificeConfig,
  'exp1-first-order-system-response': processControlConfig
};

export function getActivePartConfig(experimentConfig, activePartId = 'partA') {
  if (!experimentConfig) return null;
  if (!experimentConfig.parts || experimentConfig.parts.length === 0) {
    return experimentConfig;
  }
  const part = experimentConfig.parts.find(p => p.id === activePartId) || experimentConfig.parts[0];
  return {
    ...experimentConfig,
    ...part,
    experiment_id: experimentConfig.experiment_id,
    subject: experimentConfig.subject,
    title: experimentConfig.title,
    parts: experimentConfig.parts
  };
}

const loadInitialStudentDetails = () => {
  try {
    const saved = localStorage.getItem('labflow_student_details');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.studentName && parsed.registerNumber) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading student details:', e);
  }
  return {
    studentName: '',
    registerNumber: '',
    academicYear: '2027-2028'
  };
};

const initialStudentDetails = loadInitialStudentDetails();

export const useExperimentStore = create((set, get) => ({
  // Navigation & Active State
  currentSubject: 'fluid_mechanics',
  currentExperimentId: 'rotameter_calibration',
  experimentConfig: rotameterConfig,
  activePartId: 'partA',
  activePartConfig: rotameterConfig,

  // Student Identification State
  studentDetails: initialStudentDetails,
  isStudentGateOpen: !initialStudentDetails.studentName || !initialStudentDetails.registerNumber,

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
      text: 'Hello! I am your ChemLab AI Assistant. Ask me anything about formulas, derivations, observations, or troubleshooting your results!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  isAiThinking: false,

  // --- ACTIONS ---

  // Select Subject
  setSubject: (subjectId) => {
    set({ currentSubject: subjectId });
  },

  // Select Active Experiment
  setExperiment: (expId) => {
    const rawConfig = EXPERIMENT_CONFIGS[expId] || rotameterConfig;
    const defaultPartId = rawConfig.parts ? rawConfig.parts[0].id : 'partA';
    const activeConfig = getActivePartConfig(rawConfig, defaultPartId);

    const initialRows = activeConfig.sample_data || [];
    const computedRows = calculateTable(initialRows, activeConfig.calculations, activeConfig.fixed_inputs);
    const flags = validateObservationData(activeConfig, initialRows, computedRows);
    const primaryKey = expId === 'rotameter_calibration' ? 'Q' : expId === 'exp1-first-order-system-response' ? (defaultPartId === 'partA' ? 'T_dev_heat' : 'T_out') : 'Cd';
    const summary = calculateSummary(computedRows, primaryKey);

    set({
      currentExperimentId: expId,
      experimentConfig: rawConfig,
      activePartId: defaultPartId,
      activePartConfig: activeConfig,
      observationRows: initialRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: summary,
      chatMessages: [
        {
          id: `welcome_${expId}`,
          sender: 'ai',
          text: `Welcome to **${rawConfig.title}**! I am ready to analyze your readings and answer questions regarding ${activeConfig.aim}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  },

  // Switch Sub-Part (e.g., Part A vs Part B)
  setActivePart: (partId) => {
    const { experimentConfig } = get();
    if (!experimentConfig) return;

    const activeConfig = getActivePartConfig(experimentConfig, partId);
    const initialRows = activeConfig.sample_data || [];
    const computedRows = calculateTable(initialRows, activeConfig.calculations, activeConfig.fixed_inputs);
    const flags = validateObservationData(activeConfig, initialRows, computedRows);
    const primaryKey = partId === 'partA' ? 'T_dev_heat' : 'T_out';
    const summary = calculateSummary(computedRows, primaryKey);

    set({
      activePartId: partId,
      activePartConfig: activeConfig,
      observationRows: initialRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: summary
    });
  },

  // Update Observation Cell Value
  updateCell: (rowIndex, fieldId, value) => {
    const { observationRows, activePartConfig, currentExperimentId, activePartId } = get();
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
      activePartConfig.calculations,
      activePartConfig.fixed_inputs
    );
    const flags = validateObservationData(activePartConfig, updatedRows, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : currentExperimentId === 'exp1-first-order-system-response' ? (activePartId === 'partA' ? 'T_dev_heat' : 'T_out') : 'Cd';
    const summary = calculateSummary(computedRows, primaryKey);

    saveSessionToDb(currentExperimentId, {
      activePartId,
      observationRows: updatedRows,
      calculatedRows: computedRows
    });

    set({
      observationRows: updatedRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: summary
    });
  },

  // Add New Row
  addRow: () => {
    const { observationRows, activePartConfig, currentExperimentId, activePartId } = get();
    const newRow = {};
    (activePartConfig.trial_inputs || []).forEach(inp => {
      newRow[inp.id] = '';
    });

    const updatedRows = [...observationRows, newRow];
    const computedRows = calculateTable(
      updatedRows,
      activePartConfig.calculations,
      activePartConfig.fixed_inputs
    );
    const flags = validateObservationData(activePartConfig, updatedRows, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : currentExperimentId === 'exp1-first-order-system-response' ? (activePartId === 'partA' ? 'T_dev_heat' : 'T_out') : 'Cd';

    set({
      observationRows: updatedRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey)
    });
  },

  // Remove Row
  removeRow: (rowIndex) => {
    const { observationRows, activePartConfig, currentExperimentId, activePartId } = get();
    const updatedRows = observationRows.filter((_, idx) => idx !== rowIndex);
    const computedRows = calculateTable(
      updatedRows,
      activePartConfig.calculations,
      activePartConfig.fixed_inputs
    );
    const flags = validateObservationData(activePartConfig, updatedRows, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : currentExperimentId === 'exp1-first-order-system-response' ? (activePartId === 'partA' ? 'T_dev_heat' : 'T_out') : 'Cd';

    set({
      observationRows: updatedRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey)
    });
  },

  // Reset Table
  resetTable: () => {
    const { activePartConfig, currentExperimentId, activePartId } = get();
    const defaultRows = Array(5).fill(0).map(() => {
      const emptyRow = {};
      (activePartConfig.trial_inputs || []).forEach(inp => { emptyRow[inp.id] = ''; });
      return emptyRow;
    });

    const computedRows = calculateTable(defaultRows, activePartConfig.calculations, activePartConfig.fixed_inputs);
    const flags = validateObservationData(activePartConfig, defaultRows, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : currentExperimentId === 'exp1-first-order-system-response' ? (activePartId === 'partA' ? 'T_dev_heat' : 'T_out') : 'Cd';

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
    const { activePartConfig, currentExperimentId, activePartId } = get();
    const sample = activePartConfig.sample_data || [];
    const computedRows = calculateTable(sample, activePartConfig.calculations, activePartConfig.fixed_inputs);
    const flags = validateObservationData(activePartConfig, sample, computedRows);
    const primaryKey = currentExperimentId === 'rotameter_calibration' ? 'Q' : currentExperimentId === 'exp1-first-order-system-response' ? (activePartId === 'partA' ? 'T_dev_heat' : 'T_out') : 'Cd';

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
    const { chatMessages, activePartConfig, experimentConfig, activePartId, currentSubject, observationRows, calculatedRows, headlineResult } = get();

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatMessages, userMsg];

    set({
      chatMessages: updatedHistory,
      isAiThinking: true
    });

    try {
      const aiReplyText = await askAILabAssistant(text.trim(), {
        chatMessages: updatedHistory,
        currentSubject,
        experimentConfig,
        activePartConfig,
        activePartId,
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
    } catch (err) {
      console.error('AI chat error:', err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "Having trouble reaching the AI assistant right now. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      set((state) => ({
        chatMessages: [...state.chatMessages, errorMsg],
        isAiThinking: false
      }));
    }
  },

  // Student Identification Actions
  saveStudentDetails: (details) => {
    try {
      localStorage.setItem('labflow_student_details', JSON.stringify(details));
    } catch (e) {
      console.error('Error saving student details:', e);
    }
    set({
      studentDetails: details,
      isStudentGateOpen: false
    });
  },
  setStudentGateOpen: (isOpen) => set({ isStudentGateOpen: isOpen }),

  // Modal Open/Close Controls
  setOnboardingOpen: (isOpen) => set({ isOnboardingOpen: isOpen }),
  setResetConfirmOpen: (isOpen) => set({ isResetConfirmOpen: isOpen }),
  setReportModalOpen: (isOpen) => set({ isReportModalOpen: isOpen }),
  setDerivationModal: (formula) => set({ isDerivationModalOpen: !!formula, activeDerivationFormula: formula }),
  setValidationModal: (flag) => set({ isValidationModalOpen: !!flag, activeValidationFlag: flag }),
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen })
}));
