import './sband.css'
import s from './data/sband.json'

const rows: [string, string, string][] = [
  ['Wavelength', `L-band: about ${s.lambdaMm.L / 10} cm (NISAR)`, `S-band: about ${s.lambdaMm.S / 10} cm (3.2 GHz; the exact value depends on the channel)`],
  ['Through crops', 'Longer wavelength, so more of it passes between leaves and stems and reaches stems, water and ground.', 'Shorter wavelength, so more of it scatters inside the canopy and less reaches the ground.'],
  ['Flooded paddy', 'The wave can bounce water to stem and back (double bounce). This is the process we think brightens HH in July.', 'Expected to see more canopy scatter and less of this bounce. Not measured here.'],
  ['Staying coherent', 'Interferograms over crops generally hold together longer at L-band.', 'Expected to lose coherence sooner over growing crops. Not measured here.'],
  ['Sensitivity to motion', `One radian is ${s.mmPerRad.L} mm of motion.`, `One radian is ${s.mmPerRad.S} mm, so small motion shows up ${s.phaseMultiplier} times more strongly.`],
]

/** Section 2 of the brief: L-band against S-band, without S-band data. */
export default function SBand() {
  return (
    <div className="sband">
      <p className="note sband-tag">Projected from L-band, not S-band measurements. We could not get ISRO S-band data in time.</p>
      <p>
        Phase is 4π × motion ÷ wavelength. So the same ground motion seen at S-band turns into {s.phaseMultiplier} times more phase. We took our {s.pairs} real L-band
        interferograms and rescaled them.
      </p>
      <dl className="sband-stats">
        <div><dt>One fringe is</dt><dd>{s.mmPerFringe.L} mm <b>L</b> · {s.mmPerFringe.S} mm <b>S</b></dd></div>
        <div><dt>Largest step between 1 km cells that can still be unwrapped</dt><dd>{s.maxStepMm.L} mm <b>L</b> · {s.maxStepMm.S} mm <b>S</b></dd></div>
        <div><dt>Fastest gradient trackable over one 12-day pair, per year</dt><dd>{s.maxGradientMmPerYr.L} mm <b>L</b> · {s.maxGradientMmPerYr.S} mm <b>S</b></dd></div>
        <div><dt>Steps we see that would break at S-band</dt><dd>{(s.aliasFraction.S * 100).toFixed(1)}% of {s.steps.toLocaleString('en')}</dd></div>
      </dl>
      <p>
        The biggest step between neighbouring cells in our data is {(s.stepRadL.max * s.phaseMultiplier).toFixed(2)} rad at S-band, against the π ({Math.PI.toFixed(2)}) limit. That is {s.headroomS} times
        under the limit. Our Punjab motion is slow and smooth, so S-band would unwrap as easily as L-band. The count is a floor, because the unwrapper we used already assumes steps stay under π.
      </p>
      <p>
        What this cannot tell us is the part that really separates the two bands: how fast the signal decorrelates over growing rice. That needs S-band acquisitions of the same fields.
      </p>
      <div className="sband-wrap">
        <table>
          <caption className="sr">L-band and S-band compared</caption>
          <thead><tr><th scope="col" /><th scope="col">L-band (NISAR)</th><th scope="col">S-band (NISAR, ISRO)</th></tr></thead>
          <tbody>{rows.map(([a, l, b]) => <tr key={a}><th scope="row">{a}</th><td>{l}</td><td>{b}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="note">
        Qualitative rows follow standard radar physics, not our own measurements.
        NISAR carries both bands: <a href="https://nisar.jpl.nasa.gov" target="_blank" rel="noreferrer">nisar.jpl.nasa.gov</a>. S-band data is distributed by ISRO through{' '}
        <a href="https://bhoonidhi.nrsc.gov.in" target="_blank" rel="noreferrer">Bhoonidhi</a>.
      </p>
      <p className="note">
        <b>To do when Bhoonidhi data arrives:</b> run the same pairs through the same inversion at S-band, and compare coherence on rice against other crops. If the decorrelation gap
        is large, that is the S-band result.
      </p>
    </div>
  )
}
