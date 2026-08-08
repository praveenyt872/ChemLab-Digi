const pi = Math.PI;
const g = 9.81;

function calcExperiment(d1, d2, tank_length, tank_width, rise, h1, h2, t) {
  const d1_m = d1 / 1000;
  const d2_m = d2 / 1000;
  const a1 = (pi / 4) * (d1_m ** 2);
  const a2 = (pi / 4) * (d2_m ** 2);
  const tank_area = tank_length * tank_width;
  
  let del_h_cm = Math.abs(h1 - h2);
  if (del_h_cm < 1.5) {
    del_h_cm = del_h_cm * 100;
  }
  
  const H = (del_h_cm * 12.6) / 100; // in meters of water
  const rise_m = rise / 100;
  const vol = tank_area * rise_m;
  const Q_act = vol / t;
  const Q_the = (a1 * a2 * Math.sqrt(2 * g * H)) / Math.sqrt(a1**2 - a2**2);
  const Cd = Q_act / Q_the;
  
  return {
    d1, d2, h1, h2, t,
    del_h_cm, H: H.toFixed(3),
    Q_act: Q_act.toExponential(4),
    Q_the: Q_the.toExponential(4),
    Cd: Cd.toFixed(4)
  };
}

console.log("=== VENTURI METER CALIBRATION TEST ===");
// Apparatus defaults: d1 = 25 mm, d2 = 12.6 mm, tank = 0.4m x 0.4m, rise = 5 cm
const venturiTrials = [
  { h1: 18, h2: 14, t: 21 },  // del_h = 4 cm -> H = 0.504 m
  { h1: 17, h2: 14, t: 23 },  // del_h = 3 cm -> H = 0.378 m
  { h1: 16, h2: 14, t: 28 },  // del_h = 2 cm -> H = 0.252 m
  { h1: 15.5, h2: 14, t: 36 },// del_h = 1.5 cm -> H = 0.189 m
  { h1: 15, h2: 14, t: 44 }   // del_h = 1 cm -> H = 0.126 m
];

venturiTrials.forEach((tr, i) => {
  const res = calcExperiment(25, 12.6, 0.4, 0.4, 5, tr.h1, tr.h2, tr.t);
  console.log(`Venturi Trial ${i+1}:`, res);
});
