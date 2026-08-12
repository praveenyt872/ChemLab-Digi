import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Code2, Copy, Check, Terminal, BookOpen } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useExperimentStore } from '../../store/experimentStore';

export function CodeReferenceModal({ isOpen, onClose, referenceCode, experimentTitle }) {
  const { experimentConfig, activePartConfig, observationRows } = useExperimentStore();
  const [activeTab, setActiveTab] = useState('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !referenceCode) return null;

  const expId = experimentConfig?.experiment_id;
  const config = activePartConfig || experimentConfig;

  const fixed = (config?.fixed_inputs || []).reduce((acc, f) => {
    if (f.id && f.value !== undefined) acc[f.id] = f.value;
    return acc;
  }, {});

  let pythonCode = referenceCode?.python?.code || '# Reference calculation code\n';
  let matlabCode = referenceCode?.matlab?.code || '% Reference plotting code\n';

  if (expId === 'free_convection') {
    const D = fixed.D ?? 0.032;
    const L = fixed.L ?? 0.5;

    let validRows = (observationRows || []).filter(r => (
      r &&
      r.V !== undefined && r.V !== '' && !isNaN(parseFloat(r.V)) &&
      r.I !== undefined && r.I !== '' && !isNaN(parseFloat(r.I))
    ));
    if (validRows.length === 0) validRows = experimentConfig?.sample_data || [];

    const Ta = parseFloat(validRows[0]?.T8 ?? validRows[0]?.Ta ?? 28);

    const pythonTrialLines = validRows.map(r => {
      const V = parseFloat(r.V ?? 0);
      const I = parseFloat(r.I ?? 0);
      const tArr = [r.T1, r.T2, r.T3, r.T4, r.T5, r.T6, r.T7].map(v => parseFloat(v ?? 0));
      return `    {"V": ${V}, "I": ${I}, "T": [${tArr.join(', ')}]}`;
    }).join(',\n');

    pythonCode = `import math

D, L, Ta = ${D}, ${L}, ${Ta}
As = math.pi * D * L

trials = [
${pythonTrialLines}
]

hs = []
for i, t in enumerate(trials, 1):
    q  = t["V"] * t["I"]
    Ts = sum(t["T"]) / len(t["T"])
    h  = q / (As * (Ts - Ta))
    hs.append(h)
    print(f"Trial #{i}: q={q:.2f} W, Ts={Ts:.4f} C, h={h:.3f} W/m2.K")

print(f"Average h = {sum(hs)/len(hs):.3f} W/m2.K")`;

    const vList = validRows.map(r => parseFloat(r.V ?? 0)).join(' ');
    const iList = validRows.map(r => parseFloat(r.I ?? 0)).join(' ');
    const tMatrixLines = validRows.map(r => {
      const tArr = [r.T1, r.T2, r.T3, r.T4, r.T5, r.T6, r.T7].map(v => parseFloat(v ?? 0));
      return `     ${tArr.join(' ')}`;
    }).join(';\n');

    matlabCode = `D = ${D}; L = ${L}; Ta = ${Ta};
As = pi * D * L;

V = [${vList}];
I = [${iList}];
T = [
${tMatrixLines}
];

h = zeros(1, numel(V));
for i = 1:numel(V)
    q = V(i) * I(i);
    Ts = mean(T(i,:));
    h(i) = q / (As * (Ts - Ta));
    fprintf('Trial #%d: q=%.2f W, Ts=%.4f C, h=%.3f W/m2.K\\n', i, q, Ts, h(i));
end
fprintf('Average h = %.3f W/m2.K\\n', mean(h));`;

  } else if (expId === 'rotameter_calibration') {
    let validRows = (observationRows || []).filter(r => (
      r &&
      r.R !== undefined && r.R !== '' && !isNaN(parseFloat(r.R)) &&
      r.V !== undefined && r.V !== '' && !isNaN(parseFloat(r.V)) &&
      r.t !== undefined && r.t !== '' && !isNaN(parseFloat(r.t))
    ));
    if (validRows.length === 0) validRows = experimentConfig?.sample_data || [];

    const vArr = validRows.map(r => parseFloat(r.V ?? 0));
    const tArr = validRows.map(r => parseFloat(r.t ?? 0));
    const rArr = validRows.map(r => parseFloat(r.R ?? 0));

    pythonCode = `import numpy as np
import matplotlib.pyplot as plt

# Formula Q = V / t
def calculate_Q(V, t):
    return V / t  # m^3/s

# Student-entered trial observations
V = np.array([${vArr.join(', ')}])  # m^3
t = np.array([${tArr.join(', ')}])  # s
R = np.array([${rArr.join(', ')}])  # mm

# Calculate observed flow rate
Q_obs = calculate_Q(V, t)

# Linear regression theoretical calibration line
slope, intercept = np.polyfit(Q_obs, R, 1)
Q_line = np.linspace(min(Q_obs), max(Q_obs), 50)
R_line = slope * Q_line + intercept

# MATLAB-style Plotting
plt.figure(figsize=(7, 4.5))
plt.plot(Q_obs, R, 'o-', color='#0072BD', linewidth=1.5, label='Observed Data')
plt.plot(Q_line, R_line, '--', color='#D95319', linewidth=1.5, label='Theoretical Line')
plt.xlabel('Observed Flow Rate Q (m³/s)')
plt.ylabel('Rotameter Reading R (mm)')
plt.title('Rotameter Calibration Curve (R vs Q)')
plt.grid(True)
plt.legend()
plt.show()`;

    matlabCode = `% MATLAB Reference Script for Rotameter Calibration

% Student-entered trial data
V = [${vArr.join(', ')}]; % m^3
t = [${tArr.join(', ')}]; % sec
R = [${rArr.join(', ')}]; % mm

% Flow rate calculation
Q_obs = V ./ t; % m^3/s

% Linear regression theoretical fit
p = polyfit(Q_obs, R, 1);
Q_fit = linspace(min(Q_obs), max(Q_obs), 100);
R_fit = polyval(p, Q_fit);

% Plotting with MATLAB default aesthetic
figure;
plot(Q_obs, R, 'o-', 'Color', [0 0.447 0.741], 'LineWidth', 1.5, 'DisplayName', 'Observed Data');
hold on;
plot(Q_fit, R_fit, '--', 'Color', [0.85 0.325 0.098], 'LineWidth', 1.5, 'DisplayName', 'Theoretical Line');
box on; grid on;
xlabel('Observed Flow Rate Q (m^3/s)');
ylabel('Rotameter Reading R (mm)');
title('Rotameter Calibration Curve (R vs Q)');
legend('Location', 'northeast');`;

  } else if (expId === 'venturi_meter') {
    const d1 = fixed.d1 ?? 20.0;
    const d2 = fixed.d2 ?? 15.0;
    const tank_length = fixed.tank_length ?? 0.4;
    const tank_width = fixed.tank_width ?? 0.4;
    const rise = fixed.rise ?? 10.0;
    const g = fixed.g ?? 9.81;

    let validRows = (observationRows || []).filter(r => (
      r &&
      r.h1 !== undefined && r.h1 !== '' && !isNaN(parseFloat(r.h1)) &&
      r.h2 !== undefined && r.h2 !== '' && !isNaN(parseFloat(r.h2)) &&
      r.t !== undefined && r.t !== '' && !isNaN(parseFloat(r.t))
    ));
    if (validRows.length === 0) validRows = experimentConfig?.sample_data || [];

    const h1Arr = validRows.map(r => parseFloat(r.h1 ?? 0));
    const h2Arr = validRows.map(r => parseFloat(r.h2 ?? 0));
    const tArr = validRows.map(r => parseFloat(r.t ?? 0));

    pythonCode = `import numpy as np
import matplotlib.pyplot as plt

# Student-entered apparatus parameters
d1 = ${d1}          # Inlet pipe diameter (mm)
d2 = ${d2}          # Throat diameter (mm)
tank_length = ${tank_length}  # Collecting tank length (m)
tank_width = ${tank_width}   # Collecting tank width (m)
rise = ${rise}        # Water level rise (cm)
g = ${g}           # Gravity acceleration (m/s^2)

# Derived apparatus dimensions
d1_m = d1 / 1000.0
d2_m = d2 / 1000.0
a1 = (np.pi / 4.0) * (d1_m ** 2)  # m^2
a2 = (np.pi / 4.0) * (d2_m ** 2)  # m^2
tank_area = tank_length * tank_width  # m^2
vol = tank_area * (rise / 100.0)      # Volume collected in m^3

def calculate_venturi(h1, h2, t):
    del_h = np.abs(h1 - h2)           # Manometer head difference (cm Hg)
    H = (del_h / 100.0) * 12.6        # Equivalent water head in m H2O
    Q_act = vol / t                   # Actual flow rate (m^3/s)
    Q_th = (a1 * a2 * np.sqrt(2 * g * H)) / np.sqrt(a1**2 - a2**2)
    Cd = Q_act / Q_th
    return Q_th, Cd

# Student-entered trial observations (cm and sec)
h1 = np.array([${h1Arr.join(', ')}])  # cm
h2 = np.array([${h2Arr.join(', ')}])  # cm
t  = np.array([${tArr.join(', ')}])  # s

Q_th, Cd = calculate_venturi(h1, h2, t)

# Linear regression theoretical line
slope, intercept = np.polyfit(Q_th, Cd, 1)
Q_line = np.linspace(min(Q_th), max(Q_th), 50)
Cd_line = slope * Q_line + intercept

# MATLAB-style Plotting
plt.figure(figsize=(7, 4.5))
plt.plot(Q_th, Cd, 'o-', color='#0072BD', linewidth=1.5, label='Observed Data')
plt.plot(Q_line, Cd_line, '--', color='#D95319', linewidth=1.5, label='Theoretical Line')
plt.xlabel('Theoretical Flow Rate Qth (m³/s)')
plt.ylabel('Coefficient of Discharge (Cd)')
plt.title('Venturi Meter Calibration (Cd vs Qth)')
plt.ylim([0.50, 0.70])
plt.grid(True)
plt.legend()
plt.show()`;

    matlabCode = `% MATLAB Reference Script for Venturi Meter Cd Determination

% Student-entered apparatus parameters
d1 = ${d1}; % Inlet pipe diameter (mm)
d2 = ${d2}; % Throat diameter (mm)
tank_length = ${tank_length}; % Tank length (m)
tank_width = ${tank_width};  % Tank width (m)
rise = ${rise};       % Water level rise (cm)
g = ${g};          % Gravity (m/s^2)

% Derived apparatus dimensions
d1_m = d1 / 1000;
d2_m = d2 / 1000;
a1 = (pi / 4) * d1_m^2; % m^2
a2 = (pi / 4) * d2_m^2; % m^2
tank_area = tank_length * tank_width; % m^2
vol = tank_area * (rise / 100);     % Volume in m^3

% Student-entered trial data
h1 = [${h1Arr.join(', ')}]; % cm
h2 = [${h2Arr.join(', ')}]; % cm
t  = [${tArr.join(', ')}]; % s

% Dynamic calculations
del_h = abs(h1 - h2);
H = (del_h / 100) .* 12.6; % Equivalent water head in m H2O
Qact = vol ./ t;
Qth = (a1 * a2 .* sqrt(2 * g .* H)) ./ sqrt(a1^2 - a2^2);
Cd = Qact ./ Qth;

% Linear regression fit
p = polyfit(Qth, Cd, 1);
Q_fit = linspace(min(Qth), max(Qth), 100);
Cd_fit = polyval(p, Q_fit);

% Plotting with MATLAB default aesthetic
figure;
plot(Qth, Cd, 'o-', 'Color', [0 0.447 0.741], 'LineWidth', 1.5, 'DisplayName', 'Observed Data');
hold on;
plot(Q_fit, Cd_fit, '--', 'Color', [0.85 0.325 0.098], 'LineWidth', 1.5, 'DisplayName', 'Theoretical Line');
box on; grid on;
xlabel('Theoretical Flow Rate Qth (m^3/s)');
ylabel('Coefficient of Discharge (Cd)');
title('Venturi Meter Calibration (Cd vs Qth)');
legend('Location', 'northeast');`;

  } else if (expId === 'orifice_meter') {
    const d1 = fixed.d1 ?? 20.0;
    const d2 = fixed.d2 ?? 15.0;
    const tank_length = fixed.tank_length ?? 0.5;
    const tank_width = fixed.tank_width ?? 0.5;
    const rise = fixed.rise ?? 10.0;
    const g = fixed.g ?? 9.81;

    let validRows = (observationRows || []).filter(r => (
      r &&
      r.h1 !== undefined && r.h1 !== '' && !isNaN(parseFloat(r.h1)) &&
      r.h2 !== undefined && r.h2 !== '' && !isNaN(parseFloat(r.h2)) &&
      r.t !== undefined && r.t !== '' && !isNaN(parseFloat(r.t))
    ));
    if (validRows.length === 0) validRows = experimentConfig?.sample_data || [];

    const h1Arr = validRows.map(r => parseFloat(r.h1 ?? 0));
    const h2Arr = validRows.map(r => parseFloat(r.h2 ?? 0));
    const tArr = validRows.map(r => parseFloat(r.t ?? 0));

    pythonCode = `import numpy as np
import matplotlib.pyplot as plt

# Student-entered apparatus parameters
d1 = ${d1}          # Pipe diameter (mm)
d2 = ${d2}          # Orifice diameter (mm)
tank_length = ${tank_length}  # Collecting tank length (m)
tank_width = ${tank_width}   # Collecting tank width (m)
rise = ${rise}        # Water level rise (cm)
g = ${g}           # Gravity acceleration (m/s^2)

# Derived apparatus dimensions
d1_m = d1 / 1000.0
d2_m = d2 / 1000.0
a1 = (np.pi / 4.0) * (d1_m ** 2)  # m^2
a2 = (np.pi / 4.0) * (d2_m ** 2)  # m^2
tank_area = tank_length * tank_width  # m^2
vol = tank_area * (rise / 100.0)      # Volume collected in m^3

def calculate_orifice(h1, h2, t):
    del_h = np.abs(h1 - h2)           # Manometer head difference (cm Hg)
    H = (del_h / 100.0) * 12.6        # Equivalent head in m H2O
    Q_act = vol / t                   # Actual flow rate (m^3/s)
    Q_th = (a1 * a2 * np.sqrt(2 * g * H)) / np.sqrt(a1**2 - a2**2)
    Cd = Q_act / Q_th
    return Q_th, Cd

# Student-entered trial observations (cm and sec)
h1 = np.array([${h1Arr.join(', ')}])  # cm
h2 = np.array([${h2Arr.join(', ')}])  # cm
t  = np.array([${tArr.join(', ')}])  # s

Q_th, Cd = calculate_orifice(h1, h2, t)

# Linear regression theoretical line
slope, intercept = np.polyfit(Q_th, Cd, 1)
Q_line = np.linspace(min(Q_th), max(Q_th), 50)
Cd_line = slope * Q_line + intercept

# MATLAB-style Plotting
plt.figure(figsize=(7, 4.5))
plt.plot(Q_th, Cd, 'o-', color='#0072BD', linewidth=1.5, label='Observed Data')
plt.plot(Q_line, Cd_line, '--', color='#D95319', linewidth=1.5, label='Theoretical Line')
plt.xlabel('Theoretical Flow Rate Qth (m³/s)')
plt.ylabel('Coefficient of Discharge (Cd)')
plt.title('Orifice Meter Calibration (Cd vs Qth)')
plt.ylim([0.40, 0.65])
plt.grid(True)
plt.legend()
plt.show()`;

    matlabCode = `% MATLAB Reference Script for Orifice Meter Cd Determination

% Student-entered apparatus parameters
d1 = ${d1}; % Pipe diameter (mm)
d2 = ${d2}; % Orifice diameter (mm)
tank_length = ${tank_length}; % Tank length (m)
tank_width = ${tank_width};  % Tank width (m)
rise = ${rise};       % Water level rise (cm)
g = ${g};          % Gravity (m/s^2)

% Derived apparatus dimensions
d1_m = d1 / 1000;
d2_m = d2 / 1000;
a1 = (pi / 4) * d1_m^2; % m^2
a2 = (pi / 4) * d2_m^2; % m^2
tank_area = tank_length * tank_width; % m^2
vol = tank_area * (rise / 100);     % Volume in m^3

% Student-entered trial data
h1 = [${h1Arr.join(', ')}];   % cm
h2 = [${h2Arr.join(', ')}]; % cm
t  = [${tArr.join(', ')}]; % s

% Dynamic calculations
del_h = abs(h1 - h2);
H = (del_h / 100) .* 12.6; % Equivalent water head in m H2O
Qact = vol ./ t;
Qth = (a1 * a2 .* sqrt(2 * g .* H)) ./ sqrt(a1^2 - a2^2);
Cd = Qact ./ Qth;

% Linear fit for theoretical trendline
p = polyfit(Qth, Cd, 1);
Q_fit = linspace(min(Qth), max(Qth), 100);
Cd_fit = polyval(p, Q_fit);

% Plotting with MATLAB default aesthetic
figure;
plot(Qth, Cd, 'o-', 'Color', [0 0.447 0.741], 'LineWidth', 1.5, 'DisplayName', 'Observed Data');
hold on;
plot(Q_fit, Cd_fit, '--', 'Color', [0.85 0.325 0.098], 'LineWidth', 1.5, 'DisplayName', 'Theoretical Line');
box on; grid on;
xlabel('Theoretical Flow Rate Qth (m^3/s)');
ylabel('Coefficient of Discharge (Cd)');
title('Orifice Meter Calibration (Cd vs Qth)');
legend('Location', 'northeast');`;
  }

  const currentSnippet = activeTab === 'python' ? pythonCode : matlabCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white border border-[#EDEEF1] p-6 shadow-2xl text-slate-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDEEF1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Calculation & Plotting Reference Code</span>
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Reference implementation — for learning purposes, not executed live
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar & Copy Button */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 font-mono text-xs">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'python'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Python</span>
            </button>
            <button
              onClick={() => setActiveTab('matlab')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'matlab'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>MATLAB Code</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono font-semibold text-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Syntax Highlighted Code Viewer Container */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 my-2 text-xs">
          <SyntaxHighlighter
            language={activeTab === 'python' ? 'python' : 'matlab'}
            style={vs}
            customStyle={{
              margin: 0,
              padding: '0.75rem',
              background: 'transparent',
              fontSize: '12px',
              fontFamily: "'Fira Code', 'Courier New', monospace"
            }}
          >
            {currentSnippet}
          </SyntaxHighlighter>
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-[#EDEEF1] flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Formula Fidelity: REC ChemEngg 2026 Lab Manual Specification</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
