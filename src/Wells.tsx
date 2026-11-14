import { Read, Rise } from './bits'
import data from './data/wells.json'
import './wells.css'

const d = data.districts
const names = Object.keys(d) as (keyof typeof d)[]
const sign = (n: number) => (n > 0 ? '+' : '') + n
const [lo, hi] = data.scaleGap.impliedMmPerYr

/** Published well depths beside our radar numbers for the same districts. It says what the comparison can and cannot show. */
export default function Wells() {
  return (
    <section data-scene data-side="left" className="taller" id="wells">
      <div className="panel"><div className="panel-body wells">
        <Rise>The wells say the water is going. One year of radar cannot yet say how the ground answers.</Rise>
        <Read>{`Between 1996 and 2018 the October water table under Sangrur, Barnala and Patiala fell by about ${names.map((n) => d[n].fallM.toFixed(0)).join(', ')} metres. Rice rose from 71 to 73% of their net sown area to 90 to 91% over the same years.`}</Read>
        <table>
          <caption>Water level (metres below ground, October) and what NISAR measured within {data.radiusKm} km of each district centre</caption>
          <thead><tr><th>District</th><th>1996</th><th>2018</th><th>Fall per year</th><th>Radar trend, mm/yr</th><th>Radar breathing, mm</th></tr></thead>
          <tbody>
            {names.map((n) => (
              <tr key={n}>
                <th scope="row">{n}</th>
                <td>{d[n].waterM['1996']}</td>
                <td>{d[n].waterM['2018']}</td>
                <td>{d[n].fallMPerYr} m</td>
                <td>{sign(d[n].radar.trendMmYr)} <small>({d[n].radar.trendIqr.join(' to ')})</small></td>
                <td>{d[n].radar.seasonalMm} <small>({d[n].radar.seasonalIqr.join(' to ')})</small></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">Brackets are the middle half of the 80 m cells in the window. Positive trend means moving toward the satellite.</p>
        <h3>What this does and does not show</h3>
        <ul>
          <li><b>The wells are clear.</b> Water levels dropped about a metre a year in all three districts, so there is a large, steady loss of storage to look for.</li>
          <li><b>The radar cannot test it yet.</b> A one-metre fall in head squeezes the aquifer system by roughly {lo} to {hi} mm a year if its skeletal storage is between 0.01% and 1% of the head change. That range is an assumption, not a measurement for these districts. Our {data.scene.pairs} interferograms carry about {data.scene.noiseMm} mm of unexplained scatter, the same size as the top of that range.</li>
          <li><b>The district trends point the wrong way.</b> Rising 9 to 36 mm a year is not plausible for land over a falling aquifer, and their ranges straddle zero. The scene as a whole averages {data.scene.trendMedian} mm a year. We read the district numbers as leftover atmosphere or orbit error, not as uplift.</li>
          <li><b>The breathing signal is there but not proven.</b> {d.Sangrur.radar.seasonalMm} to {d.Patiala.radar.seasonalMm} mm of annual swing is consistent with the elastic response we expect. The scene-wide median is {data.scene.ampMedian} mm, so it is not specific to these districts, and noise alone produces a positive amplitude.</li>
          <li><b>Next step.</b> Three districts and one year cannot make a correlation. A fair test needs well-by-well seasonal levels from the Board’s WIMS portal and more than a year of NISAR passes.</li>
        </ul>
        <h3>Sources</h3>
        <ol className="cites note">
          <li>Sharma, Y., Sidana, B. K., and Kumari, M. (2024). Groundwater exploitation in Punjab: a zone-wise analysis. <i>Journal of Agricultural Development and Policy</i> 34(1), 12 to 21, Table 4. <a href="https://doi.org/10.63066/23220457.34.1.002">doi.org/10.63066/23220457.34.1.002</a>. Water levels there come from Punjab state water resources data.</li>
          <li>Central Ground Water Board, India, 2023 extraction and recharge totals quoted above. Portal: <a href="https://cgwb.gov.in/">cgwb.gov.in</a>. We could not reach the portal when building this page, so these totals are repeated from the earlier text rather than re-checked.</li>
          <li>Radar numbers: NISAR L-band, track 156, frame 17, 21 interferograms processed in this project (scripts/build_motion.py, scripts/build_wells.py).</li>
        </ol>
      </div></div>
    </section>
  )
}
