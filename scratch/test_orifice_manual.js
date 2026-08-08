const pi = Math.PI;
const g = 9.81;

function calcOrificeManual(d1, d2, tank_length, tank_width, rise, h1, h2, t) {
  const d1_m = d1 / 1000;
  const d2_m = d2 / 1000;
  const a1 = (pi / 4) * (d1_m ** 2);
  const a2 = (pi / 4) * (d2_m ** 2);
  const tank_area = tank_length * tank_width;
  
  let del_h_cm = Math.abs(h1 - h2);
  const H = (del_h_cm * 12.6) / 100;
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
    Cd: Cd.toFixed(3)
  };
}

console.log("Orifice Manual Trial (h1=4.0cm, h2=19.2cm -> del_h=15.2cm, t=38.68s):");
console.log(calcOrificeManual(20, 15, 0.5, 0.5, 10, 4.0, 19.2, 38.68));

console.log("\nTesting 5 sample trials with d1=20mm, d2=15mm, tank=0.5x0.5m, rise=10cm:");
const sampleTrials = [
  { h1: 4.0, h2: 19.2, t: 38.68 }, // del_h = 15.2 cm -> Cd = 0.494
  { h1: 5.0, h2: 18.0, t: 42.0 },  // del_h = 13.0 cm -> Cd = 0.505
  { h1: 6.0, h2: 17.0, t: 46.0 },  // del_h = 11.0 cm -> Cd = 0.507
  { h1: 7.0, h2: 16.0, t: 52.0 },  // del_h = 9.0 cm  -> Cd = 0.498
  { h1: 8.0, h2: 15.0, t: 60.0 }   // del_h = 7.0 cm  -> Cd = 0.498
];

sampleTrials.forEach((tr, i) => {
  console.log(`Trial ${i+1}:`, calcOrificeManual(20, 15, 0.5, 0.5, 10, tr.h1, tr.h2, tr.t));
});
