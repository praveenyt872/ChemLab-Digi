import rotameterSchematic from '../assets/schematics/rotameter-schematic.png';
import venturiSchematic from '../assets/schematics/venturi-schematic.png';
import orificeSchematic from '../assets/schematics/orifice-schematic.png';

const SCHEMATIC_MAP = {
  rotameter_calibration: rotameterSchematic,
  rotameter: rotameterSchematic,
  venturi_meter: venturiSchematic,
  venturi: venturiSchematic,
  orifice_meter: orificeSchematic,
  orifice: orificeSchematic,
  '/schematics/rotameter-schematic.png': rotameterSchematic,
  '/schematics/venturi-schematic.png': venturiSchematic,
  '/schematics/orifice-schematic.png': orificeSchematic,
};

export function getSchematicDiagram(config) {
  if (!config) return null;
  const path = config.schematic_diagram || config.schematic_url;
  if (SCHEMATIC_MAP[path]) return SCHEMATIC_MAP[path];
  if (config.experiment_id && SCHEMATIC_MAP[config.experiment_id]) {
    return SCHEMATIC_MAP[config.experiment_id];
  }
  return path || null;
}
