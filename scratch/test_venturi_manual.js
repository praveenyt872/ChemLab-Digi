const pi = Math.PI;
const g = 9.81;

function calcVenturiManual(d1, d2, tank_length, tank_width, rise, h1, h2, t) {
  const d1_m = d1 / 1000;
  const d2_m = d2 / 1000;
  const a1 = (pi / 4) * (d1_m ** 2);
  const a2 = (pi / 4) * (d2_m ** 2);
  const tank_area = tank_length * tank_width;
  
  let del_h_cm = Math.abs(h1 - h2);
  if (del_h_cm < 1.5) {
    del_h_cm = del_h_cm * 100;
  }
  const H = (del_h_cm * 12.6) / 100; // meters of water
  const rise_m = rise / 100;
  const vol = tank_area * rise_m;
  const Q_act = vol / t;
  const Q_the = (a1 * a2 * Math.sqrt(2 * g * H)) / Math.sqrt(a1**2 - a2**2);
  const Cd = Q_act / Q_the;
  
  return {
    d1, d2, tank_length, tank_width, rise,
    h1, h2, t, del_h_cm,
    H: H.toFixed(3),
    vol: vol,
    Q_act: Q_act.toExponential(4),
    Q_the: Q_the.toExponential(4),
    Cd: Cd.toFixed(4)
  };
}

console.log("Manual sample trial (h1=16.5cm, h2=5cm -> del_h=11.5cm, t=24s):");
console.log(calcVenturiManual(20, 15, 0.4, 0.4, 10, 16.5, 5.0, 24));

console.log("\nTesting 5 realistic sample trials with d1=20mm, d2=15mm, rise=10cm:");
const sampleTrials = [
  { h1: 18.5, h2: 7.0, t: 24 }, // del_h = 11.5 cm -> Cd = 0.5849
  { h1: 17.0, h2: 8.0, t: 27 }, // del_h = 9.0 cm -> Cd = 0.5866
  { h1: 16.0, h2: 9.0, t: 30 }, // del_h = 7.0 cm -> Cd = 0.5963
  { h1: 15.0, h2: 10.0, t: 35 },// del_h = 5.0 cm -> Cd = 0.6033
  { h1: 14.0, h2: 11.0, t: 45 } // del_h = 3.0 cm -> Cd = 0.6053
];

sampleTrials.forEach((tr, i) => {
  console.log(`Trial ${i+1}:`, calcVenturiManual(20, 15, 0.4, 0.4, 10, tr.h1, tr.h2, tr.t));
});
