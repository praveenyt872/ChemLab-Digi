/**
 * AI Integration Service for ChemLab AI
 * Supports both Gemini LLM API (if VITE_AI_API_KEY or GEMINI_API_KEY is configured)
 * and an intelligent context-grounded offline expert system.
 */

/**
 * Ask the AI Lab Assistant a question with grounded experiment context
 * @param {String} userMessage - Student's question
 * @param {Object} context - { experimentConfig, observationData, calculatedRows, headlineResult }
 * @returns {Promise<String>} AI Assistant response text
 */
export async function askAILabAssistant(userMessage, context = {}) {
  const apiKey = import.meta.env?.VITE_AI_API_KEY || import.meta.env?.GEMINI_API_KEY;
  const { experimentConfig, observationData = [], calculatedRows = [], headlineResult } = context;

  // If an API key is available, call Gemini API
  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are ChemLab AI — an expert Chemical Engineering Virtual Laboratory Teaching Assistant.
You are assisting a student working on the following experiment:

Experiment: ${experimentConfig?.title || 'Fluid Mechanics Experiment'}
Aim: ${experimentConfig?.aim || ''}
Formulas: ${JSON.stringify(experimentConfig?.formulas || [])}
Current Observation Data: ${JSON.stringify(observationData)}
Calculated Results: ${JSON.stringify(calculatedRows)}
Headline Summary: ${JSON.stringify(headlineResult)}

Student Question: "${userMessage}"

Provide a concise, encouraging, and scientifically rigorous explanation referencing the relevant formulas, Bernoulli principles, fluid dynamics theory, or apparatus troubleshooting as needed. Keep responses under 200 words.`
            }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to intelligent offline lab assistant.', err);
    }
  }

  // Intelligent Context-Grounded Fallback Engine
  return generateOfflineAIResponse(userMessage, context);
}

/**
 * Intelligent Offline Expert System for Chemical Engineering Fluid Mechanics
 */
function generateOfflineAIResponse(userMessage, context) {
  const msg = userMessage.toLowerCase();
  const { experimentConfig, calculatedRows = [] } = context;
  const title = experimentConfig?.title || 'Experiment';
  const expId = experimentConfig?.experiment_id;

  // Calculate current average Cd if present
  const validCds = calculatedRows.map(r => r.Cd).filter(v => v !== null && !isNaN(v));
  const avgCd = validCds.length > 0 ? (validCds.reduce((a,b) => a+b, 0) / validCds.length).toFixed(3) : 'N/A';

  if (msg.includes('why is my cd low') || msg.includes('cd low') || msg.includes('cd off') || msg.includes('low coefficient')) {
    if (expId === 'venturi_meter') {
      return `For a Venturi meter, Cd typically ranges from **0.94 to 0.98**. A low Cd (${avgCd}) usually indicates:
1. **Air bubbles in manometer tubes**: Trapped air reduces the differential mercury head h, making theoretical discharge Qth falsely high.
2. **Valve throttling**: Partially open downstream valves create excessive backpressure.
3. **Parallax error**: Incorrectly reading mercury levels h1 and h2.
*Fix*: Purge manometer tubes using the bleed valves before recording readings.`;
    } else if (expId === 'orifice_meter') {
      return `For an Orifice meter, the typical Cd is **0.60 to 0.65**. If your Cd is lower than 0.58:
1. **Vena Contracta Effect**: Orifice plates cause sudden flow stream contraction and large eddy turbulence losses.
2. **Orifice Plate Edge Wear**: A rounded upstream edge reduces contraction efficiency.
3. **Upstream Disturbance**: Insufficient straight pipe length upstream of the plate.`;
    } else {
      return `A low Cd indicates that actual flow Qa is significantly lower than theoretical frictionless flow Qth due to frictional head losses, turbulence, or air entrapped in measurement lines.`;
    }
  }

  if (msg.includes('formula') || msg.includes('explain equation') || msg.includes('bernoulli')) {
    return `The core equation for ${title} stems from **Bernoulli's Principle** (Energy Conservation for incompressible flow):
\\[ \\frac{P_1}{\\rho g} + \\frac{V_1^2}{2g} = \\frac{P_2}{\\rho g} + \\frac{V_2^2}{2g} \\]
Combined with continuity \\(A_1 V_1 = A_2 V_2\\), differential pressure head \\(H = 12.6 \\times h\\) is converted into kinetic energy to derive Theoretical Discharge \\(Q_{th}\\).`;
  }

  if (msg.includes('real world') || msg.includes('industry') || msg.includes('application')) {
    if (expId === 'rotameter_calibration') {
      return `**Real-world application**: Rotameters are widely used in chemical plants, pharmaceutical cleanrooms, and gas chromatography for visual, low-cost variable-area flow monitoring where electric power is unavailable.`;
    } else if (expId === 'venturi_meter') {
      return `**Real-world application**: Venturi tubes are used in municipal water distribution mains, wastewater treatment plants, and crude oil pipelines because their streamlined design causes minimal permanent pressure drop (<10%).`;
    } else {
      return `**Real-world application**: Orifice meters are the most popular differential pressure flowmeters in natural gas processing and petroleum refineries due to low cost, standard replacement, and simple geometry.`;
    }
  }

  if (msg.includes('manometer') || msg.includes('12.6') || msg.includes('mercury')) {
    return `The factor **12.6** comes from the specific gravity difference between Mercury (S_Hg = 13.6) and Water (S_w = 1.0):
\\[ H = h \\times (S_{Hg} - S_w) = h \\times (13.6 - 1.0) = 12.6 \\times h \\]
This converts height of mercury in meters (m Hg) into equivalent head of water in meters (m H₂O).`;
  }

  return `In the **${title}** experiment, we compare actual measured discharge against theoretical predictions derived from Bernoulli's principle. 

Your current mean result is **Cd = ${avgCd}**. Feel free to ask about formula derivations, manometer differential head (H = 12.6 × h), physical precautions, or real-world industrial uses!`;
}
