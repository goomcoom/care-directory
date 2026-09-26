import { DISTRICTS, PROVIDERS, TOWN } from "../../shared/directory";
import type { DistrictId } from "../../shared/types";

interface Props {
  highlighted?: string[];
  /** Restrict the dots drawn to these ids (directory filters). Default: all. */
  visible?: string[];
  activeDistrict?: DistrictId;
  onSelect?: (providerId: string) => void;
  onDistrict?: (districtId: DistrictId) => void;
}

/**
 * Schematic map of the fictional town. Everything is drawn from coordinates in
 * the directory data; there is no map provider and nothing here is a real place.
 */
export function TownMap({ highlighted = [], visible, activeDistrict, onSelect, onDistrict }: Props) {
  const hi = new Set(highlighted);
  const shown = visible ? PROVIDERS.filter((p) => visible.includes(p.id)) : PROVIDERS;
  const activeDistricts = new Set<DistrictId>(
    activeDistrict ? [activeDistrict] : PROVIDERS.filter((p) => hi.has(p.id)).map((p) => p.district),
  );

  return (
    <svg className="town-map" viewBox="0 0 100 70" role="img" aria-label={`Schematic map of ${TOWN}`}>
      {/* River down the west side and the sea along the south. */}
      <path className="water" d="M 0 0 L 6 0 C 4 14 8 26 6 40 C 5 50 3 58 0 70 Z" />
      <path className="water" d="M 0 70 L 100 70 L 100 69 C 70 66 40 67 0 69 Z" />
      {DISTRICTS.map((d) => (
        <g key={d.id}>
          <path
            className={`district ${activeDistricts.has(d.id) ? "is-active" : ""}`}
            d={d.path}
            onClick={onDistrict ? () => onDistrict(d.id) : undefined}
            style={onDistrict ? { cursor: "pointer" } : undefined}
          >
            <title>
              {d.name}: {d.blurb}
            </title>
          </path>
          <text className="district-label" x={d.label.x} y={d.label.y}>
            {d.name}
          </text>
        </g>
      ))}
      {shown
        .filter((p) => !hi.has(p.id))
        .map((p) => (
          <circle key={p.id} className="dot" cx={p.x} cy={p.y} r={1.3} onClick={onSelect ? () => onSelect(p.id) : undefined}>
            <title>{p.name}</title>
          </circle>
        ))}
      {shown
        .filter((p) => hi.has(p.id))
        .map((p) => (
          <g key={p.id}>
            <circle className="dot-ring" cx={p.x} cy={p.y} r={2} />
            <circle className="dot is-hi" cx={p.x} cy={p.y} r={1.9} onClick={onSelect ? () => onSelect(p.id) : undefined}>
              <title>{p.name}</title>
            </circle>
          </g>
        ))}
    </svg>
  );
}
