import { calculateRow, evaluateStepCalculations } from '../src/engine/formulaEngine.js';

const orificeFixedInputs = [
  { id: "d1", value: 20 },
  { id: "d2", value: 12.6 },
  { id: "tank_length", value: 0.4 },
  { id: "tank_width", value: 0.4 },
  { id: "rise", value: 5 },
  { id: "g", value: 9.81 }
];

const orificeCalculations = {
  "d1_m": "d1 / 1000",
  "d2_m": "d2 / 1000",
  "a1": "(pi / 4) * (d1_m ^ 2)",
  "a2": "(pi / 4) * (d2_m ^ 2)",
  "tank_area": "tank_length * tank_width",
  "h": "abs(h1 - h2) > 1.5 ? abs(h1 - h2) / 100 : abs(h1 - h2)",
  "H": "(abs(h1 - h2) > 1.5 ? abs(h1 - h2) / 100 : abs(h1 - h2)) * 12.6",
  "rise_m": "rise / 100",
  "vol": "tank_area * (rise / 100)",
  "Qact": "(tank_area * (rise / 100)) / t",
  "Qth": "(a1 * a2 * sqrt(2 * g * H)) / sqrt(a1^2 - a2^2)",
  "Cd": "Qact / Qth"
};

const row = { h1: 26, h2: 16, t: 19 };

const calculatedRow = calculateRow(row, orificeCalculations, orificeFixedInputs);
console.log("Calculated Row:", calculatedRow);

const calculationSteps = [
  {
    step_id: "H",
    step_number: 1,
    label: "Step 1: Equivalent Pressure Head (H)",
    formula_latex: "H = \\Delta h \\times 12.6 / 100",
    formula_expression: "(abs(h1 - h2) > 1.5 ? abs(h1 - h2) / 100 : abs(h1 - h2)) * 12.6",
    substitution_template: "H = ({h_diff}) \\times 12.6",
    unit: "m H₂O"
  },
  {
    step_id: "Qact",
    step_number: 2,
    label: "Step 2: Actual Volumetric Discharge (Qact)",
    formula_latex: "Q_{act} = \\frac{A_{tank} \\cdot rise}{t}",
    formula_expression: "vol / t",
    substitution_template: "Q_{act} = \\frac{{vol}}{{t}}",
    unit: "m³/s",
    format: "scientific"
  },
  {
    step_id: "Qth",
    step_number: 3,
    label: "Step 3: Theoretical Volumetric Discharge (Qth)",
    formula_latex: "Q_{th} = \\frac{a_1 a_2 \\sqrt{2gH}}{\\sqrt{a_1^2 - a_2^2}}",
    formula_expression: "(a1 * a2 * sqrt(2 * g * H)) / sqrt(a1^2 - a2^2)",
    substitution_template: "Q_{th} = \\frac{({a1})({a2}) \\sqrt{2(9.81)({H})}}{\\sqrt{({a1})^2 - ({a2})^2}}",
    unit: "m³/s",
    format: "scientific"
  },
  {
    step_id: "Cd",
    step_number: 4,
    label: "Step 4: Coefficient of Discharge (Cd)",
    formula_latex: "C_d = \\frac{Q_{act}}{Q_{th}}",
    formula_expression: "Qact / Qth",
    substitution_template: "C_d = \\frac{{Qact}}{{Qth}}",
    unit: "dim",
    format: "decimal_3"
  }
];

const stepsResult = evaluateStepCalculations({ ...row, ...calculatedRow }, calculationSteps, orificeFixedInputs);
console.log("Steps Evaluation Result:", stepsResult);
