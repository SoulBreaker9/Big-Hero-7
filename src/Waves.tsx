const W = 520, CROP = 300, SOIL = 500
/** A sine of the given wavelength (px) from x0 to x1, its height fading by `fade` over the run. */
const wave = (y: number, len: number, x0: number, x1: number, fade = 0) => {
  let d = ''
  for (let x = x0; x <= x1; x += 2) d += `${x === x0 ? 'M' : 'L'}${x} ${(y + Math.sin((x / len) * 2 * Math.PI) * 13 * (1 - (fade * (x - x0)) / (x1 - x0))).toFixed(1)}`
  return d
}

/** Why the fields were invisible: the two wavelengths drawn to the same scale, meeting a crop. */
export default function Waves() {
  return (
    <figure className="waves">
      <svg viewBox={`0 0 ${W + 24} 170`} role="img" aria-label="A 5.6 centimetre radar wave is scattered inside a crop canopy. A 24 centimetre wave, drawn to the same scale, passes through to the soil.">
        {Array.from({ length: 34 }, (_, i) => <path key={i} className="stalk" d={`M${CROP + 6 + i * 5.6} 14v142`} />)}
        <path className="soil" d={`M${SOIL} 8v154`} />
        <path className="c" d={wave(50, 13, 6, CROP)} />
        <path className="c lost" d={wave(50, 13, CROP, CROP + 70, 1)} />
        <path className="l" d={wave(122, 56, 6, SOIL - 4)} />
        <text x="6" y="20">5.6 cm, older radars</text>
        <text x="6" y="92">24 cm, NISAR L-band</text>
        <text x={CROP + 8} y="166" className="label">crop</text>
        <text x={SOIL + 6} y="166" className="label">soil</text>
      </svg>
      <figcaption className="note">The two wavelengths to the same scale. The short one is scrambled by the crop; the long one reaches the ground and comes back.</figcaption>
    </figure>
  )
}
