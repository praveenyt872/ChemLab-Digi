import fs from 'fs';
import { calculateTable } from '../src/engine/formulaEngine.js';
import { validateObservationData } from '../src/engine/validationEngine.js';

const orificeConfig = JSON.parse(fs.readFileSync('./src/data/experiments/orifice.json', 'utf8'));

const observationRows = orificeConfig.sample_data;
const calculatedRows = calculateTable(observationRows, orificeConfig.calculations, orificeConfig.fixed_inputs);

const flags = validateObservationData(orificeConfig, observationRows, calculatedRows);

console.log("Flags for Orifice Meter sample data:");
console.log(JSON.stringify(flags, null, 2));
