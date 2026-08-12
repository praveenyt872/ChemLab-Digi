import rotameterSchematic from '../assets/schematics/rotameter-schematic.png';
import venturiSchematic from '../assets/schematics/venturi-schematic.png';
import orificeSchematic from '../assets/schematics/orifice-schematic.png';
import rtdCstrSchematic from '../assets/schematics/rtd-cstr-schematic.png';

export function getSchematicDiagram(config, expId = '') {
  if (!config && !expId) return null;

  const id = String(config?.experiment_id || config?.id || expId || '').toLowerCase();
  const title = String(config?.title || config?.short_name || '').toLowerCase();
  const path = String(config?.schematic_diagram || '').toLowerCase();

  if (id.includes('rtd') || id.includes('cstr') || title.includes('rtd') || title.includes('stirred') || path.includes('rtd')) {
    return rtdCstrSchematic;
  }

  if (id.includes('orifice') || title.includes('orifice') || path.includes('orifice')) {
    return orificeSchematic;
  }

  if (id.includes('rotameter') || title.includes('rotameter') || path.includes('rotameter')) {
    return rotameterSchematic;
  }

  if (id.includes('venturi') || title.includes('venturi') || path.includes('venturi')) {
    return venturiSchematic;
  }

  return null;
}
