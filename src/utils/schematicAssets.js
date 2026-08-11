import rotameterSchematic from '../assets/schematics/rotameter-schematic.png';
import venturiSchematic from '../assets/schematics/venturi-schematic.png';
import orificeSchematic from '../assets/schematics/orifice-schematic.png';

export function getSchematicDiagram(config, expId = '') {
  if (!config && !expId) return null;

  const rawText = (
    JSON.stringify(config || {}) +
    ' ' +
    String(expId || '') +
    ' ' +
    String(config?.experiment_id || '') +
    ' ' +
    String(config?.title || '') +
    ' ' +
    String(config?.short_name || '') +
    ' ' +
    String(config?.schematic_diagram || '')
  ).toLowerCase();

  if (rawText.includes('rotameter')) {
    return rotameterSchematic;
  }
  if (rawText.includes('venturi')) {
    return venturiSchematic;
  }
  if (rawText.includes('orifice')) {
    return orificeSchematic;
  }

  return null;
}
