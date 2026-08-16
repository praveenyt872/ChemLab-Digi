/**
 * Validation Engine for Chem Digi Lab
 * Analyzes observation readings and calculated results against physical laws,
 * fluid mechanics principles, and apparatus bounds.
 */

export function validateObservationData(experimentConfig, observationRows = [], calculatedRows = []) {
  const flags = [];
  const validationRanges = experimentConfig.validation_ranges || {};
  const expId = experimentConfig.experiment_id;

  if (!observationRows || observationRows.length === 0) {
    flags.push({
      id: 'empty_table',
      type: 'blue',
      severity: 'info',
      title: 'Empty Observation Table',
      description: 'No readings entered yet. Enter physical lab observations or click "Load Sample Data".',
      why: 'Live calculations, trend graphs, and AI validation require at least one trial reading row to execute.',
      suggestion: null,
      rowIndex: null,
      field: null
    });
    return flags;
  }

  // Row by row inspection
  observationRows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const calcRow = calculatedRows[idx] || {};

    // 1. Check for incomplete or missing fields
    const trialInputs = experimentConfig.trial_inputs || [];
    const missingFields = trialInputs.filter(input => {
      const val = row[input.id];
      return val === undefined || val === '' || val === null || isNaN(val);
    });

    if (missingFields.length > 0 && missingFields.length < trialInputs.length) {
      flags.push({
        id: `missing_fields_row_${rowNum}`,
        type: 'blue',
        severity: 'info',
        title: `Incomplete Readings in Trial ${rowNum}`,
        description: `Trial ${rowNum} is missing: ${missingFields.map(f => f.label).join(', ')}.`,
        why: 'Derived calculations require all trial input fields to compute accurate intermediate and final values.',
        suggestion: null,
        rowIndex: rowNum,
        field: missingFields[0].id
      });
    }

    // 2. Physical Impossibility Checks (Red Flags)
    // Non-positive time or volume
    if (row.t !== undefined && row.t !== '' && parseFloat(row.t) <= 0) {
      flags.push({
        id: `invalid_time_row_${rowNum}`,
        type: 'red',
        severity: 'error',
        title: `Physically Impossible Time in Trial ${rowNum}`,
        description: `Recorded time (${row.t} sec) is zero or negative.`,
        why: 'Elapsed stopwatch time must always be strictly positive (t > 0 sec) for fluid collection.',
        suggestion: { rowIdx: idx, field: 't', val: 30 },
        rowIndex: rowNum,
        field: 't'
      });
    }

    if (row.V !== undefined && row.V !== '' && parseFloat(row.V) <= 0) {
      flags.push({
        id: `invalid_volume_row_${rowNum}`,
        type: 'red',
        severity: 'error',
        title: `Physically Impossible Volume in Trial ${rowNum}`,
        description: `Collected volume (${row.V} m³) is zero or negative.`,
        why: 'Volume measured in collecting jar must be greater than zero.',
        suggestion: { rowIdx: idx, field: 'V', val: 0.002 },
        rowIndex: rowNum,
        field: 'V'
      });
    }

    // Venturi / Orifice manometer differential head check (h1 vs h2)
    if (row.h1 !== undefined && row.h2 !== undefined && row.h1 !== '' && row.h2 !== '') {
      const h1Val = parseFloat(row.h1);
      const h2Val = parseFloat(row.h2);

      if (h1Val === h2Val) {
        flags.push({
          id: `manometer_zero_diff_row_${rowNum}`,
          type: 'amber',
          severity: 'warning',
          title: `Zero Differential Head in Trial ${rowNum}`,
          description: `Upstream reading h1 (${h1Val}) equals downstream reading h2 (${h2Val}).`,
          why: 'Flow through an orifice or venturi meter requires a non-zero differential pressure head across the taps.',
          suggestion: null,
          rowIndex: rowNum,
          field: 'h1'
        });
      }
    }

    // 3. Calculated Value Physics Violations
    if (calcRow.Cd !== undefined && calcRow.Cd !== null) {
      const cdVal = calcRow.Cd;

      if (cdVal > 1.0) {
        flags.push({
          id: `cd_exceeds_one_row_${rowNum}`,
          type: 'red',
          severity: 'error',
          title: `Physically Impossible Cd in Trial ${rowNum}`,
          description: `Calculated Coefficient of Discharge Cd (${cdVal.toFixed(3)}) exceeds 1.0.`,
          why: 'Cd = Qa / Qth. By energy conservation, actual real fluid flow cannot exceed theoretical frictionless flow (Cd ≤ 1.0). Check if time t was recorded too small or manometer difference was read incorrectly.',
          suggestion: { rowIdx: idx, field: 't', val: Math.round((row.t || 30) * cdVal) },
          rowIndex: rowNum,
          field: 't'
        });
      } else if (expId === 'venturi_meter' && (cdVal < 0.50 || cdVal > 1.00)) {
        flags.push({
          id: `venturi_cd_range_row_${rowNum}`,
          type: 'amber',
          severity: 'warning',
          title: `Unusual Venturi Cd in Trial ${rowNum}`,
          description: `Cd (${cdVal.toFixed(3)}) is outside expected Venturi range (~0.55–0.99).`,
          why: 'Venturi meters have streamlined, gradual converging and diverging cones. Values outside 0.55–0.99 indicate valve throttling, air trapped in manometer lines, or incorrect diameter entries.',
          suggestion: null,
          rowIndex: rowNum,
          field: null
        });
      } else if (expId === 'orifice_meter' && (cdVal < 0.40 || cdVal > 0.70)) {
        flags.push({
          id: `orifice_cd_range_row_${rowNum}`,
          type: 'amber',
          severity: 'warning',
          title: `Unusual Orifice Cd in Trial ${rowNum}`,
          description: `Cd (${cdVal.toFixed(3)}) is outside expected Orifice range (~0.45–0.65).`,
          why: 'Orifice plates produce a pronounced jet contraction (vena contracta) and severe eddy recirculation. Values outside 0.45–0.65 indicate valve throttling, air trapped in manometer lines, or incorrect diameter entries.',
          suggestion: null,
          rowIndex: rowNum,
          field: null
        });
      }
    }

    // 4. Free Convection Validation Rules
    if (expId === 'free_convection') {
      if (row.V !== undefined && row.V !== '' && parseFloat(row.V) > 90) {
        flags.push({
          id: `voltage_exceeds_90_row_${rowNum}`,
          type: 'amber',
          severity: 'warning',
          title: `Voltmeter Warning in Trial ${rowNum}`,
          description: `Voltmeter reading (${row.V} V) exceeds 90V precaution limit per manual instructions.`,
          why: 'The lab manual specifies keeping dimmerstat output voltage ≤ 90V to prevent overheating the heater element.',
          suggestion: { rowIdx: idx, field: 'V', val: 85 },
          rowIndex: rowNum,
          field: 'V'
        });
      }

      const tsVal = calcRow.Ts !== undefined ? calcRow.Ts : (
        row.T1 && row.T2 && row.T3 && row.T4 && row.T5 && row.T6 && row.T7 ?
        (parseFloat(row.T1)+parseFloat(row.T2)+parseFloat(row.T3)+parseFloat(row.T4)+parseFloat(row.T5)+parseFloat(row.T6)+parseFloat(row.T7))/7 : null
      );
      const taVal = calcRow.Ta !== undefined ? calcRow.Ta : (row.T8 ? parseFloat(row.T8) : null);

      if (tsVal !== null && taVal !== null && tsVal <= taVal) {
        flags.push({
          id: `ts_le_ta_row_${rowNum}`,
          type: 'red',
          severity: 'error',
          title: `Invalid Temperature Gradient in Trial ${rowNum}`,
          description: `Surface temperature (${tsVal.toFixed(1)}°C) must be greater than ambient temperature (${taVal.toFixed(1)}°C).`,
          why: 'Natural convection heat transfer from a heated cylinder requires a positive temperature difference (Ts > Ta) for upward buoyant airflow.',
          suggestion: null,
          rowIndex: rowNum,
          field: 'T1'
        });
      }

      if (calcRow.h !== undefined && calcRow.h !== null) {
        const hVal = calcRow.h;
        if (hVal < 3.5 || hVal > 16.0) {
          flags.push({
            id: `h_out_of_range_row_${rowNum}`,
            type: 'amber',
            severity: 'warning',
            title: `Unusual Heat Transfer Coefficient in Trial ${rowNum}`,
            description: `Computed h (${hVal.toFixed(2)} W/m²·K) is outside typical free convection range (4–15 W/m²·K).`,
            why: 'Free convection coefficients for air over a vertical cylinder usually range between 4 and 15 W/m²·K. Values outside this range suggest checking temperature sensor readings or tube dimensions.',
            suggestion: null,
            rowIndex: rowNum,
            field: null
          });
        }
      }
    }
  });

  // 5. First-Order System Process Control Validation Rules (Part A & Part B)
  if (expId === 'exp1-first-order-system-response' || experimentConfig.id === 'partA' || experimentConfig.id === 'partB') {
    // Check Part A Monotonicity
    if (experimentConfig.id === 'partA' || (!experimentConfig.id && observationRows[0]?.T_rise !== undefined)) {
      for (let i = 1; i < observationRows.length; i++) {
        const prevHeating = parseFloat(observationRows[i - 1].T_rise);
        const currHeating = parseFloat(observationRows[i].T_rise);
        if (!isNaN(prevHeating) && !isNaN(currHeating) && currHeating < prevHeating) {
          flags.push({
            id: `non_monotonic_heating_${i + 1}`,
            type: 'amber',
            severity: 'warning',
            title: `Non-Monotonic Heating Curve in Trial ${i + 1}`,
            description: `Temperature dropped from ${prevHeating}°C to ${currHeating}°C during step heating.`,
            why: 'A first-order thermal system subjected to a positive step input in heat supply must monotonically approach steady-state temperature without dips or oscillations.',
            suggestion: null,
            rowIndex: i + 1,
            field: 'T_rise'
          });
          break;
        }
      }
    }

    // Check Part B Amplitude Ratio (AR <= 1.0)
    if (experimentConfig.id === 'partB' || (!experimentConfig.id && observationRows[0]?.T_out !== undefined)) {
      const inVals = observationRows.map(r => parseFloat(r.T_in)).filter(v => !isNaN(v));
      const outVals = observationRows.map(r => parseFloat(r.T_out)).filter(v => !isNaN(v));

      if (inVals.length > 2 && outVals.length > 2) {
        const inSpan = Math.max(...inVals) - Math.min(...inVals);
        const outSpan = Math.max(...outVals) - Math.min(...outVals);
        if (inSpan > 0 && outSpan > inSpan) {
          flags.push({
            id: 'ar_exceeds_one',
            type: 'red',
            severity: 'error',
            title: 'Physically Implausible Sinusoidal Response (AR > 1.0)',
            description: `Output temperature span (${outSpan.toFixed(1)}°C) exceeds input temperature span (${inSpan.toFixed(1)}°C).`,
            why: 'First-order thermal systems act as low-pass filters. Output signal amplitude must be attenuated (AR ≤ 1.0), never amplified.',
            suggestion: null,
            rowIndex: null,
            field: 'T_out'
          });
        }
      }
    }
  }

  return flags;
}
