import { evaluate } from 'mathjs';

const scope = {
  d1: 20,
  d2: 12.6,
  tank_length: 0.4,
  tank_width: 0.4,
  rise: 5,
  g: 9.81,
  h1: 0.26,
  h2: 0.16,
  t: 19
};

const calculations = {
  "d1_m": "d1 / 1000",
  "d2_m": "d2 / 1000",
  "a1": "(pi / 4) * (d1_m ^ 2)",
  "a2": "(pi / 4) * (d2_m ^ 2)",
  "tank_area": "tank_length * tank_width",
  "h": "abs(h1 - h2) > 1.5 ? abs(h1 - h2) / 100 : abs(h1 - h2)",
  "H": "h * 12.6",
  "rise_m": "rise / 100",
  "vol": "tank_area * rise_m",
  "Qact": "vol / t",
  "Qth": "(a1 * a2 * sqrt(2 * g * H)) / sqrt(a1^2 - a2^2)",
  "Cd": "Qact / Qth"
};

const results = {};
Object.keys(calculations).forEach(calcId => {
  const expr = calculations[calcId];
  results[calcId] = evaluate(expr, scope);
  scope[calcId] = results[calcId];
});

console.log("Evaluated Results:", results);
