const pi = Math.PI;
const g = 9.81;

function calcVenturi(d1, d2, tank_length, tank_width, rise, h1, h2, t) {
  const d1_m = d1 / 1000;
  const d2_m = d2 / 1000;
  const a1 = (pi / 4) * (d1_m ** 2);
  const a2 = (pi / 4) * (d2_m ** 2);
  const tank_area = tank_length * tank_width;
  
  let del_h_cm = Math.abs(h1 - h2);
  const H = (del_h_cm * 12.6) / 100; // in meters of water
  const rise_m = rise / 100;
  const vol = tank_area * rise_m;
  const Q_act = vol / t;
  const Q_the = (a1 * a2 * Math.sqrt(2 * g * H)) / Math.sqrt(a1**2 - a2**2);
  const Cd = Q_act / Q_the;
  
  return { h1, h2, t, del_h_cm, H: H.toFixed(3), Cd: Cd.toFixed(3) };
}

const trials = [
  { h1: 18, h2: 14, t: 21 },
  { h1: 17, h2: 14, t: 23 },
  { h1: 16, h2: 14, t: 28 },
  { h1: 15.5, h2: 14, t: 33 },
  { h1: 15.2, h2: 14, t: 40 }
];

console.log("Venturi sample trials:");
trials.forEach(tr => console.log(calcVenturi(25, 12.6, 0.4, 0.4, 5, tr.h1, tr.h2, tr.t)));
