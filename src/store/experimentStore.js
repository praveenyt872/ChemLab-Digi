import { create } from 'zustand';
import rotameterConfig from '../data/experiments/rotameter.json';
import venturiConfig from '../data/experiments/venturi.json';
import orificeConfig from '../data/experiments/orifice.json';
import processControlConfig from '../data/experiments/process_control_first_order.json';
import freeConvectionConfig from '../data/experiments/free_convection.json';
import rtdCstrConfig from '../data/experiments/rtd_cstr.json';
import { calculateTable, calculateSummary } from '../engine/formulaEngine';
import { validateObservationData } from '../engine/validationEngine';
import { askAILabAssistant } from '../engine/aiService';
import { saveSessionToDb, loadSessionFromDb } from '../utils/indexedDbStore';

const EXPERIMENT_CONFIGS = {
  rotameter_calibration: rotameterConfig,
  venturi_meter: venturiConfig,
  orifice_meter: orificeConfig,
  'exp1-first-order-system-response': processControlConfig,
  free_convection: freeConvectionConfig,
  rtd_cstr: rtdCstrConfig
};

const getPrimaryKey = (expId, activePartId = 'partA') => {
  if (expId === 'free_convection') return 'h';
  if (expId === 'rotameter_calibration') return 'Q';
  if (expId === 'rtd_cstr') return 't_bar';
  if (expId === 'exp1-first-order-system-response') return activePartId === 'partA' ? 'T_dev_heat' : 'T_out';
  return 'Cd';
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

const defaultStdA = [
  { V1: 10, initial: 0, final: 0.5, concordant: true },
  { V1: 10, initial: 0, final: 0.5, concordant: true }
];

const defaultStdB = [
  { V1: 2, initial: 0, final: 4, concordant: true },
  { V1: 2, initial: 0, final: 4, concordant: true }
];

const computeNormatilities = (stdA = defaultStdA, stdB = defaultStdB, N1_oxalic = 0.1) => {
  let sumN_NaOH = 0;
  let countA = 0;
  (stdA || []).forEach(r => {
    const v1 = parseFloat(r.V1 ?? 10);
    const init = parseFloat(r.initial ?? 0);
    const fin = parseFloat(r.final ?? 0);
    const v2 = Math.max(0, fin - init);
    if (v2 > 0) {
      sumN_NaOH += (v1 * N1_oxalic) / v2;
      countA++;
    }
  });
  const nNaOH = countA > 0 ? sumN_NaOH / countA : 2.0;

  let sumN_HCl = 0;
  let countB = 0;
  (stdB || []).forEach(r => {
    const v1 = parseFloat(r.V1 ?? 2);
    const init = parseFloat(r.initial ?? 0);
    const fin = parseFloat(r.final ?? 0);
    const v2 = Math.max(0, fin - init);
    if (v2 > 0) {
      sumN_HCl += (v1 * nNaOH) / v2;
      countB++;
    }
  });
  const nHCl = countB > 0 ? sumN_HCl / countB : 1.0;

  return { nNaOH, nHCl };
};

const getEffectiveFixedInputs = (activeConfig, stdA = defaultStdA, stdB = defaultStdB) => {
  const baseFixed = activeConfig?.fixed_inputs ? [...activeConfig.fixed_inputs] : [];
  if (activeConfig?.experiment_id !== 'rtd_cstr') return baseFixed;

  const N1_oxalic = (baseFixed.find(f => f.id === 'N1_oxalic')?.value) ?? 0.1;
  const { nNaOH, nHCl } = computeNormatilities(stdA, stdB, N1_oxalic);

  const updated = baseFixed.filter(f => f.id !== 'N_HCl' && f.id !== 'N_NaOH' && f.id !== 'C0');
  updated.push({ id: 'N_NaOH', value: nNaOH });
  updated.push({ id: 'N_HCl', value: nHCl });
  updated.push({ id: 'C0', value: nNaOH });

  const stdARow = stdA?.[0] || { V1: 10, initial: 0, final: 0.5 };
  const stdBRow = stdB?.[0] || { V1: 2, initial: 0, final: 4 };
  updated.push({ id: 'V1_stdA', value: parseFloat(stdARow.V1 ?? 10) });
  updated.push({ id: 'V2_stdA', value: Math.max(0.1, parseFloat(stdARow.final ?? 0.5) - parseFloat(stdARow.initial ?? 0)) });
  updated.push({ id: 'V1_stdB', value: parseFloat(stdBRow.V1 ?? 2) });
  updated.push({ id: 'V2_stdB', value: Math.max(0.1, parseFloat(stdBRow.final ?? 4) - parseFloat(stdBRow.initial ?? 0)) });

  return updated;
};

const loadInitialStudentDetails = () => {
  try {
    const saved = localStorage.getItem('labflow_student_details');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.studentName && parsed.registerNumber) {
        return {
          semester: 'VII',
          section: 'B',
          ...parsed
        };
      }
    }
  } catch (e) {
    console.error('Error loading student details:', e);
  }
  return {
    studentName: '',
    registerNumber: '',
    academicYear: '2027-2028',
    semester: 'VII',
    section: 'B'
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
  isStudentGateOpen: false,

  // Standardization Tables State (for RTD CSTR)
  stdTableA: defaultStdA,
  stdTableB: defaultStdB,
  computedNNaOH: 2.0,
  computedNHCl: 1.0,

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
    'Q'
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

  setSubject: (subjectId) => {
    set({ currentSubject: subjectId });
  },

  setExperiment: (expId) => {
    const rawConfig = EXPERIMENT_CONFIGS[expId] || rotameterConfig;
    const defaultPartId = rawConfig.parts ? rawConfig.parts[0].id : 'partA';
    const activeConfig = getActivePartConfig(rawConfig, defaultPartId);

    const stdA = defaultStdA;
    const stdB = defaultStdB;
    const { nNaOH, nHCl } = computeNormatilities(stdA, stdB);
    const effectiveFixed = getEffectiveFixedInputs(activeConfig, stdA, stdB);

    const initialRows = activeConfig.sample_data || [];
    const computedRows = calculateTable(initialRows, activeConfig.calculations, effectiveFixed);
    const flags = validateObservationData(activeConfig, initialRows, computedRows);
    const primaryKey = getPrimaryKey(expId, defaultPartId);
    const summary = calculateSummary(computedRows, primaryKey);

    set({
      currentExperimentId: expId,
      experimentConfig: rawConfig,
      activePartId: defaultPartId,
      activePartConfig: activeConfig,
      stdTableA: stdA,
      stdTableB: stdB,
      computedNNaOH: nNaOH,
      computedNHCl: nHCl,
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

  setActivePart: (partId) => {
    const { experimentConfig, stdTableA, stdTableB } = get();
    if (!experimentConfig) return;

    const activeConfig = getActivePartConfig(experimentConfig, partId);
    const effectiveFixed = getEffectiveFixedInputs(activeConfig, stdTableA, stdTableB);
    const initialRows = activeConfig.sample_data || [];
    const computedRows = calculateTable(initialRows, activeConfig.calculations, effectiveFixed);
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

  updateCell: (rowIndex, fieldId, value) => {
    const { observationRows, activePartConfig, currentExperimentId, activePartId, stdTableA, stdTableB } = get();
    const updatedRows = [...observationRows];
    
    if (!updatedRows[rowIndex]) {
      updatedRows[rowIndex] = {};
    }

    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [fieldId]: value
    };

    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, stdTableA, stdTableB);
    const computedRows = calculateTable(
      updatedRows,
      activePartConfig.calculations,
      effectiveFixed
    );
    const flags = validateObservationData(activePartConfig, updatedRows, computedRows);
    const primaryKey = getPrimaryKey(currentExperimentId, activePartId);
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

  // Standardization Table Actions
  updateStdCellA: (idx, field, value) => {
    const { stdTableA, stdTableB, activePartConfig, observationRows, currentExperimentId, activePartId } = get();
    const updatedA = [...stdTableA];
    updatedA[idx] = { ...updatedA[idx], [field]: value };

    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, updatedA, stdTableB);
    const computedRows = calculateTable(observationRows, activePartConfig.calculations, effectiveFixed);
    const primaryKey = getPrimaryKey(currentExperimentId, activePartId);
    const summary = calculateSummary(computedRows, primaryKey);
    const { nNaOH, nHCl } = computeNormatilities(updatedA, stdTableB, effectiveFixed.find(f => f.id === 'N1_oxalic')?.value ?? 0.1);

    set({
      stdTableA: updatedA,
      calculatedRows: computedRows,
      headlineResult: summary,
      computedNNaOH: nNaOH,
      computedNHCl: nHCl
    });
  },

  updateStdCellB: (idx, field, value) => {
    const { stdTableA, stdTableB, activePartConfig, observationRows, currentExperimentId, activePartId } = get();
    const updatedB = [...stdTableB];
    updatedB[idx] = { ...updatedB[idx], [field]: value };

    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, stdTableA, updatedB);
    const computedRows = calculateTable(observationRows, activePartConfig.calculations, effectiveFixed);
    const primaryKey = getPrimaryKey(currentExperimentId, activePartId);
    const summary = calculateSummary(computedRows, primaryKey);
    const { nNaOH, nHCl } = computeNormatilities(stdTableA, updatedB, effectiveFixed.find(f => f.id === 'N1_oxalic')?.value ?? 0.1);

    set({
      stdTableB: updatedB,
      calculatedRows: computedRows,
      headlineResult: summary,
      computedNNaOH: nNaOH,
      computedNHCl: nHCl
    });
  },

  addStdRowA: () => {
    const { stdTableA, stdTableB, activePartConfig, observationRows } = get();
    const updatedA = [...stdTableA, { V1: 10, initial: 0, final: 0.5, concordant: true }];
    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, updatedA, stdTableB);
    const computedRows = calculateTable(observationRows, activePartConfig.calculations, effectiveFixed);
    const { nNaOH, nHCl } = computeNormatilities(updatedA, stdTableB);
    set({ stdTableA: updatedA, calculatedRows: computedRows, computedNNaOH: nNaOH, computedNHCl: nHCl });
  },

  addStdRowB: () => {
    const { stdTableA, stdTableB, activePartConfig, observationRows } = get();
    const updatedB = [...stdTableB, { V1: 2, initial: 0, final: 4, concordant: true }];
    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, stdTableA, updatedB);
    const computedRows = calculateTable(observationRows, activePartConfig.calculations, effectiveFixed);
    const { nNaOH, nHCl } = computeNormatilities(stdTableA, updatedB);
    set({ stdTableB: updatedB, calculatedRows: computedRows, computedNNaOH: nNaOH, computedNHCl: nHCl });
  },

  removeStdRowA: (idx) => {
    const { stdTableA, stdTableB, activePartConfig, observationRows } = get();
    if (stdTableA.length <= 1) return;
    const updatedA = stdTableA.filter((_, i) => i !== idx);
    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, updatedA, stdTableB);
    const computedRows = calculateTable(observationRows, activePartConfig.calculations, effectiveFixed);
    const { nNaOH, nHCl } = computeNormatilities(updatedA, stdTableB);
    set({ stdTableA: updatedA, calculatedRows: computedRows, computedNNaOH: nNaOH, computedNHCl: nHCl });
  },

  removeStdRowB: (idx) => {
    const { stdTableA, stdTableB, activePartConfig, observationRows } = get();
    if (stdTableB.length <= 1) return;
    const updatedB = stdTableB.filter((_, i) => i !== idx);
    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, stdTableA, updatedB);
    const computedRows = calculateTable(observationRows, activePartConfig.calculations, effectiveFixed);
    const { nNaOH, nHCl } = computeNormatilities(stdTableA, updatedB);
    set({ stdTableB: updatedB, calculatedRows: computedRows, computedNNaOH: nNaOH, computedNHCl: nHCl });
  },

  addRow: () => {
    const { observationRows, activePartConfig, currentExperimentId, activePartId, stdTableA, stdTableB } = get();
    const newRow = {};
    (activePartConfig.trial_inputs || []).forEach(inp => {
      newRow[inp.id] = '';
    });

    const updatedRows = [...observationRows, newRow];
    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, stdTableA, stdTableB);
    const computedRows = calculateTable(
      updatedRows,
      activePartConfig.calculations,
      effectiveFixed
    );
    const flags = validateObservationData(activePartConfig, updatedRows, computedRows);
    const primaryKey = getPrimaryKey(currentExperimentId, activePartId);

    set({
      observationRows: updatedRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey)
    });
  },

  removeRow: (rowIndex) => {
    const { observationRows, activePartConfig, currentExperimentId, activePartId, stdTableA, stdTableB } = get();
    const updatedRows = observationRows.filter((_, idx) => idx !== rowIndex);
    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, stdTableA, stdTableB);
    const computedRows = calculateTable(
      updatedRows,
      activePartConfig.calculations,
      effectiveFixed
    );
    const flags = validateObservationData(activePartConfig, updatedRows, computedRows);
    const primaryKey = getPrimaryKey(currentExperimentId, activePartId);

    set({
      observationRows: updatedRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey)
    });
  },

  resetTable: () => {
    const { activePartConfig, currentExperimentId, activePartId, stdTableA, stdTableB } = get();
    const defaultRows = Array(5).fill(0).map(() => {
      const emptyRow = {};
      (activePartConfig.trial_inputs || []).forEach(inp => { emptyRow[inp.id] = ''; });
      return emptyRow;
    });

    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, stdTableA, stdTableB);
    const computedRows = calculateTable(defaultRows, activePartConfig.calculations, effectiveFixed);
    const flags = validateObservationData(activePartConfig, defaultRows, computedRows);
    const primaryKey = getPrimaryKey(currentExperimentId, activePartId);

    set({
      observationRows: defaultRows,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey),
      isResetConfirmOpen: false
    });
  },

  loadSampleData: () => {
    const { activePartConfig, currentExperimentId, activePartId, stdTableA, stdTableB } = get();
    const sample = activePartConfig.sample_data || [];
    const effectiveFixed = getEffectiveFixedInputs(activePartConfig, stdTableA, stdTableB);
    const computedRows = calculateTable(sample, activePartConfig.calculations, effectiveFixed);
    const flags = validateObservationData(activePartConfig, sample, computedRows);
    const primaryKey = getPrimaryKey(currentExperimentId, activePartId);

    set({
      observationRows: sample,
      calculatedRows: computedRows,
      validationFlags: flags,
      headlineResult: calculateSummary(computedRows, primaryKey)
    });
  },

  applyValidationSuggestion: (suggestion) => {
    if (!suggestion || suggestion.rowIdx === undefined || !suggestion.field) return;
    const { updateCell } = get();
    updateCell(suggestion.rowIdx, suggestion.field, suggestion.val);
  },

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
      set({ isAiThinking: false });
    }
  },

  setStudentGateOpen: (isOpen) => set({ isStudentGateOpen: isOpen }),
  saveStudentDetails: (details) => {
    try {
      localStorage.setItem('labflow_student_details', JSON.stringify(details));
    } catch (e) {
      console.error('Failed to save student details:', e);
    }
    set({ studentDetails: details, isStudentGateOpen: false });
  },
  updateStudentDetails: (details) => {
    try {
      localStorage.setItem('labflow_student_details', JSON.stringify(details));
    } catch (e) {
      console.error('Failed to save student details:', e);
    }
    set({ studentDetails: details, isStudentGateOpen: false });
  },

  setOnboardingOpen: (isOpen) => set({ isOnboardingOpen: isOpen }),
  setResetConfirmOpen: (isOpen) => set({ isResetConfirmOpen: isOpen }),
  setReportModalOpen: (isOpen) => set({ isReportModalOpen: isOpen }),
  setDerivationModalOpen: (isOpen, formula = null) => set({ isDerivationModalOpen: isOpen, activeDerivationFormula: formula }),
  setValidationModalOpen: (isOpen, flag = null) => set({ isValidationModalOpen: isOpen, activeValidationFlag: flag }),
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen })
}));
