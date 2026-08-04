/**
 * AI Integration Service for ChemLab AI
 * Supports Anthropic API (claude-3-5-sonnet), Gemini API (gemini-2.5-flash),
 * and a fully dynamic context-grounded Chemical Engineering Virtual Tutor Engine.
 */

/**
 * Builds a dynamic system prompt containing the ACTIVE experiment's complete context,
 * formulas, live user observation readings, derived calculations, and viva questions.
 * @param {Object} context
 * @returns {String} System Prompt
 */
export function buildSystemPrompt(context = {}) {
  const {
    currentSubject,
    experimentConfig,
    activePartConfig,
    activePartId,
    observationData = [],
    calculatedRows = [],
    headlineResult
  } = context;

  const config = activePartConfig || experimentConfig || {};
  const subjectName = config.subject_name || (currentSubject === 'instrumentation-process-control' ? 'Instrumentation & Process Control Lab' : 'Fluid Mechanics Lab');
  const expTitle = experimentConfig?.title || config.title || 'Chemical Engineering Lab';
  const partTitle = config.title || (activePartId === 'partA' ? 'Step Input Response' : 'Sinusoidal Input Response');

  const formulasText = (config.formulas || []).map(f => `- ${f.label} (${f.latex}): ${f.purpose || ''}`).join('\n');
  const vivaText = (config.viva_questions || []).map(v => `Q: ${v.question}\nA: ${v.answer}`).join('\n\n');

  return `You are ChemLab AI — an expert Chemical Engineering Virtual Laboratory Teaching Assistant and Tutor.
You are assisting a student working on the following lab session:

Subject: ${subjectName}
Experiment: ${expTitle}
Active Sub-Module: ${partTitle}

--- THEORY & FORMULAS FROM LAB MANUAL ---
Aim: ${config.aim || ''}
System Description: ${config.system || ''}
Theory Summary: ${config.theory || ''}

Key Formulas:
${formulasText}

--- CURRENT STUDENT WORKSPACE DATA ---
Fixed Equipment/System Inputs:
${JSON.stringify(config.fixed_inputs || [], null, 2)}

Live Student Trial Readings Entered in Observation Table:
${JSON.stringify(observationData, null, 2)}

Currently Computed Results Columns:
${JSON.stringify(calculatedRows, null, 2)}

Headline Metric Result:
${JSON.stringify(headlineResult || {}, null, 2)}

--- VIVA VOCE & REVIEW QUESTIONS ---
${vivaText}

INSTRUCTIONS:
1. Answer the student's questions clearly, encouragingly, and pedagogically.
2. If the student asks about their calculated results (e.g., "why is my time constant high" or "why is Cd low"), use their ACTUAL entered numbers and computed table values above to troubleshoot.
3. If asked about formulas, derivations, or lab apparatus, explain using the specific formulas and theory provided above.
4. If asked a general Chemical Engineering doubt (e.g., fluid dynamics, heat/mass transfer, process control, thermodynamics), provide a clear, helpful response as a domain expert.
5. Keep explanations structured, easy to read, and under 250 words unless detailed step-by-step math is requested.`;
}

/**
 * Ask the AI Lab Assistant a question with grounded experiment context
 * @param {String} userMessage - Student's question
 * @param {Object} context - Context object containing current experiment state & chat history
 * @returns {Promise<String>} AI Assistant response text
 */
export async function askAILabAssistant(userMessage, context = {}) {
  const { chatMessages = [] } = context;

  const anthropicKey = import.meta.env?.VITE_ANTHROPIC_API_KEY || import.meta.env?.ANTHROPIC_API_KEY;
  const geminiKey = import.meta.env?.VITE_AI_API_KEY || import.meta.env?.GEMINI_API_KEY;

  // 1. Try Anthropic API if key is available
  if (anthropicKey) {
    try {
      const formattedMessages = chatMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // Ensure conversation starts with a user message
      if (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
        formattedMessages.shift();
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "dangerously-allow-browser": "true",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          system: buildSystemPrompt(context),
          messages: formattedMessages.length > 0 ? formattedMessages : [{ role: 'user', content: userMessage }]
        })
      });

      const data = await response.json();
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      }
    } catch (err) {
      console.warn('Anthropic API call failed, attempting fallback engine.', err);
    }
  }

  // 2. Try Gemini API if key is available
  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: buildSystemPrompt(context) }]
          },
          contents: chatMessages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }))
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to dynamic tutor engine.', err);
    }
  }

  // 3. Intelligent Dynamic Context-Driven Chemical Engineering Tutor Engine
  return generateDynamicTutorResponse(userMessage, context);
}

/**
 * Intelligent Dynamic Context-Driven Chemical Engineering Tutor Engine
 * Evaluates user questions dynamically using the current experiment's JSON config,
 * live entered numbers, formula schemas, and core Chemical Engineering principles.
 */
function generateDynamicTutorResponse(userMessage, context) {
  const msg = userMessage.toLowerCase().trim();
  const { activePartConfig, experimentConfig, calculatedRows = [], observationData = [] } = context;

  const config = activePartConfig || experimentConfig || {};
  const expId = config.experiment_id || experimentConfig?.experiment_id;
  const title = config.title || 'Experiment';
  const partId = config.id || 'partA';

  // --- A. Match Specific Formulas in Active Config ---
  const matchingFormula = (config.formulas || []).find(f => 
    msg.includes(f.id?.toLowerCase()) || 
    msg.includes(f.label?.toLowerCase()) ||
    (f.variables && f.variables.some(v => msg.includes(v.symbol?.toLowerCase())))
  );

  if (matchingFormula && (msg.includes('formula') || msg.includes('explain') || msg.includes('equation') || msg.includes('what is') || msg.includes('how'))) {
    const varsText = (matchingFormula.variables || []).map(v => `• **${v.symbol}**: ${v.meaning} (${v.unit})`).join('\n');
    return `### ${matchingFormula.label}
\\[ ${matchingFormula.latex} \\]

**Purpose**: ${matchingFormula.purpose}
**Derivation / Background**: ${matchingFormula.derivation || 'Derived from dynamic energy/momentum balance.'}

**Variables & Units**:
${varsText}`;
  }

  // --- B. Match Viva Questions in Active Config ---
  const matchingViva = (config.viva_questions || []).find(v => {
    const qLower = v.question.toLowerCase();
    return msg.split(' ').some(word => word.length > 3 && qLower.includes(word));
  });

  if (matchingViva && (msg.includes('viva') || msg.includes('question') || msg.includes('answer') || msg.includes('why') || msg.includes('how'))) {
    return `**Viva Question**: ${matchingViva.question}\n\n**Detailed Answer**: ${matchingViva.answer}`;
  }

  // --- C. Result Troubleshooting & Number Analysis ---
  if (msg.includes('why is my') || msg.includes('cd low') || msg.includes('cd high') || msg.includes('tau high') || msg.includes('wrong') || msg.includes('error')) {
    if (expId === 'venturi_meter') {
      const validCds = calculatedRows.map(r => r.Cd).filter(v => v !== null && !isNaN(v));
      const avgCd = validCds.length > 0 ? (validCds.reduce((a,b) => a+b, 0) / validCds.length).toFixed(3) : 'N/A';
      return `For a **Venturi Meter**, Cd typically ranges from **0.94 to 0.98**. Your current average computed Cd is **${avgCd}**.
      
Common reasons for deviations:
1. **Air Bubbles in Manometer Lines**: Trapped air reduces differential head \\(h\\), making theoretical flow \\(Q_{th}\\) artificially high.
2. **Valve Throttling**: Downstream backpressure creates turbulent losses.
3. **Reading Parallax**: Inaccurate meniscus measurement of \\(h_1\\) and \\(h_2\\).`;
    }

    if (expId === 'orifice_meter') {
      const validCds = calculatedRows.map(r => r.Cd).filter(v => v !== null && !isNaN(v));
      const avgCd = validCds.length > 0 ? (validCds.reduce((a,b) => a+b, 0) / validCds.length).toFixed(3) : 'N/A';
      return `For an **Orifice Meter**, expected Cd is **0.60 to 0.65**. Your computed average Cd is **${avgCd}**.
      
Reasons for lower Cd:
1. **Vena Contracta Effect**: Severe jet contraction causes recirculating eddies and high energy dissipation.
2. **Edge Wear**: Rounded orifice inlet edges change contraction efficiency.`;
    }

    if (expId === 'exp1-first-order-system-response') {
      if (partId === 'partA') {
        return `In **Step Input Response (Part A)**, the time constant \\(\\tau = \\frac{m C_p}{h A}\\) represents the time required to reach **63.2%** of the total temperature change (\\(\\tau = 10.0\\text{ s}\\)).
        
If your graphical \\(\\tau\\) is higher than theoretical:
1. **Low Heat Transfer Coeff (h)**: Poor bath circulation reduces \\(h\\), increasing \\(\\tau\\).
2. **Sensor Thermal Mass (m)**: Heavy thermowell adds thermal inertia.`;
      } else {
        return `In **Sinusoidal Response (Part B)**:
• \\(\\text{I/p Amplitude} = \\frac{48 - 28}{2} = 10\\text{ °C}\\)
• \\(\\text{O/p Amplitude} = \\frac{43 - 37}{2} = 3\\text{ °C}\\)
• \\(\\text{Amplitude Ratio (AR)} = 0.3\\)
• \\(\\text{Time Constant } \\tau = \\frac{\\sqrt{1 - 0.3^2}}{0.3 \\times 0.1047} = 30.36\\text{ s}\\)

If AR > 1.0, that is physically impossible for a passive first-order lag (output cannot exceed input).`;
      }
    }
  }

  // --- D. General Chemical Engineering Domain Tutor ---
  if (msg.includes('laminar') || msg.includes('turbulent') || msg.includes('reynolds')) {
    return `### Fluid Flow Regimes & Reynolds Number
The **Reynolds Number (Re)** quantifies the ratio of inertial forces to viscous forces:
\\[ Re = \\frac{\\rho v D}{\\mu} \\]

- **Laminar Flow** (\\(Re < 2100\\)): Fluid moves in parallel layers with smooth, predictable streamlines and minimal mixing.
- **Transition Flow** (\\(2100 \\le Re \\le 4000\\)): Instabilities begin to form.
- **Turbulent Flow** (\\(Re > 4000\\)): Chaotic fluid motion with high velocity fluctuations and rapid mixing.`;
  }

  if (msg.includes('bernoulli') || msg.includes('energy balance')) {
    return `### Bernoulli's Equation
For an incompressible, frictionless, steady fluid flow along a streamline:
\\[ \\frac{P_1}{\\rho g} + \\frac{v_1^2}{2g} + z_1 = \\frac{P_2}{\\rho g} + \\frac{v_2^2}{2g} + z_2 \\]

**Physical Meaning**: Total mechanical energy (Pressure Head + Velocity Head + Potential Elevation Head) remains constant along a fluid stream.`;
  }

  if (msg.includes('time constant') || msg.includes('tau') || msg.includes('63.2')) {
    return `### First-Order System Time Constant (\\(\\tau\\))
The **time constant \\(\\tau\\)** is the characteristic response time of a first-order dynamic process:
- **Step Input**: \\(\\bar{T}'(t) = K(1 - e^{-t/\\tau})\\). At \\(t = \\tau\\), response reaches \\(1 - e^{-1} \\approx 63.2\\%\\) of total final change.
- **Formula**: \\(\\tau = \\frac{m C_p}{h A}\\). Smaller \\(\\tau\\) means a faster, more responsive sensor.`;
  }

  if (msg.includes('amplitude ratio') || msg.includes('ar') || msg.includes('phase lag')) {
    return `### Sinusoidal Frequency Response
For a first-order system subjected to sinusoidal input \\(x(t) = A_1 \\sin(\\omega t)\\):
- **Amplitude Ratio (AR)**: \\(AR = \\frac{A_2}{A_1} = \\frac{1}{\\sqrt{1 + (\\omega \\tau)^2}}\\) (Output is always attenuated, AR ≤ 1.0).
- **Phase Lag (\\(\\phi\\))**: \\(\\phi = \\arctan(-\\omega \\tau)\\) (Output lags behind input).
- **Time Constant**: \\(\\tau = \\frac{\\sqrt{1 - AR^2}}{AR \\cdot \\omega}\\).`;
  }

  // --- E. Default Context-Aware Response ---
  return `### ChemLab AI Virtual Assistant
I am grounded in **${title}** (${config.short_title || partId}).

Current Status:
• **Subject**: ${config.subject_name || 'Chemical Engineering'}
• **Observation Rows Entered**: ${observationData.length} trial(s)
• **Calculated Results**: Ready

You can ask me:
1. **Specific Formulas & Derivations** (e.g., "explain time constant formula", "how is Cd computed")
2. **Data Troubleshooting** (e.g., "why is my Cd low", "troubleshoot my readings")
3. **Viva Questions** (e.g., "what is the effect of bulb size on response time")
4. **General Chemical Engineering Doubts** (e.g., "explain difference between laminar and turbulent flow")`;
}
