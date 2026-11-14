type Ref = [name: string, url: string, note: string]

// The challenge's resource list, kept in its order and wording
const NASA: Ref[] = [
  ['NASA Earthdata Search', 'https://search.earthdata.nasa.gov/', 'Discovery, search, comparison, visualization and access across NASA’s Earth science holdings.'],
  ['ASF Data Search Vertex', 'https://search.asf.alaska.edu/', 'The Alaska Satellite Facility runs NASA’s SAR archive. Every NISAR granule here came from it.'],
  ['NISAR Data User Guide', 'https://nisar-docs.asf.alaska.edu/', 'ASF’s one-stop guide to accessing and working with NISAR data.'],
  ['Intro to Remote Sensing', 'https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing', 'Instruments, resolution, processing and analysis.'],
  ['Intro to Synthetic Aperture Radar', 'https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar', 'Frequency, wavelength, polarization and scattering.'],
  ['NASA ARSET Trainings', 'https://www.earthdata.nasa.gov/data/projects/arset', 'Remote sensing, SAR and NISAR trainings in English and Spanish.'],
  ['NISAR StoryMaps', 'https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/', 'SAR for floods, wildfires, land subsidence, oil slicks and glacial motion.'],
  ['NISAR Applications White Papers', 'https://nisar.jpl.nasa.gov/applications/societal-benefit', 'Two-page overviews of NISAR’s societal benefits.'],
  ['UAVSAR Postcards', 'https://uavsar.jpl.nasa.gov/education/postcards.html', 'False-colour composites of airborne UAVSAR data.'],
]
const PARTNERS: [string, Ref[]][] = [
  ['CSA · Canadian Space Agency', [
    ['RADARSAT Constellation Mission (RCM) data', 'https://donnees-data.asc-csa.gc.ca/en/dataset', 'Three satellites, day or night, any weather: maritime, disaster and ecosystem monitoring.'],
    ['Synthetic Aperture Radar Python Tutorial', 'https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial', 'Working with SAR imagery in Python and QGIS.'],
    ['RADARSAT-1 data', 'https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1', 'The 1995–2013 archive, released under an open licence.'],
  ]],
  ['CONAE · National Space Activities Commission of Argentina', [
    ['SAOCOM Catalogue', 'https://catalog.saocom.conae.gov.ar/catalog/#/', 'CONAE’s L-band SAR mission: catalogue, downloads and tutorials.'],
    ['SAOCOM Catalogue Registration', 'https://catalogos.conae.gov.ar/catalogo/catalogo.html', 'Register for a One-Click login profile.'],
  ]],
]
// What this page's numbers are built on
const USED: Ref[] = [
  ['NISAR L-band GCOV and GUNW browse products', 'https://search.asf.alaska.edu/#/?dataset=NISAR', 'Track 156, frame 17, 21 Nov 2025 to 4 Nov 2026. NASA/ISRO via ASF DAAC.'],
  ['Central Ground Water Board, Dynamic Ground Water Resources of India 2023', 'https://cgwb.gov.in', 'Punjab extraction and recharge.'],
  ['Sharma, Sidana & Kumari 2024, J. Agric. Dev. Policy 34(1)', 'https://doi.org/10.63066/23220457.34.1.002', 'District water levels, 1996 to 2018.'],
  ['Hasan et al. 2023, Nature Communications 14:6180', 'https://doi.org/10.1038/s41467-023-41933-z', 'Global subsidence and permanent aquifer loss.'],
  ['Mishra et al. 2024, Earth’s Future', 'https://doi.org/10.1029/2024EF004516', 'India’s groundwater depletion.'],
  ['Garg et al. 2022, Scientific Reports 12:651', 'https://doi.org/10.1038/s41598-021-04193-9', 'Subsidence and recovery in Delhi.'],
  ['ESA Copernicus Sentinel-2 L2A', 'https://registry.opendata.aws/sentinel-2-l2a-cogs/', 'Crop calendar for the rice test, via AWS Open Data and Earth Search.'],
  ['Galloway, Jones & Ingebritsen 1999, USGS Circular 1182', 'https://pubs.usgs.gov/circ/circ1182/', 'Elastic and inelastic compaction.'],
  ['NISAR mission', 'https://nisar.jpl.nasa.gov', 'L- and S-band. S-band data is distributed by ISRO on Bhoonidhi.'],
]

const List = ({ refs }: { refs: Ref[] }) => (
  <ul className="refs">
    {refs.map(([name, url, note]) => (
      <li key={url}><a href={url} target="_blank" rel="noreferrer">{name}<span aria-hidden="true">↗</span></a><p>{note}</p></li>
    ))}
  </ul>
)

/** Closing sheet: covers the 3D stage, credits every resource the challenge lists and every source behind a number. */
export default function Sources() {
  return (
    <footer className="ground" id="sources">
      <div className="marquee" aria-hidden="true"><div>{Array.from({ length: 6 }, (_, i) => <span key={i}>ਸਾਹ <em>saah</em> breath ·&nbsp;</span>)}</div></div>
      <div className="ground-grid">
        <section>
          <h2>Sources</h2>
          <p className="disclaimer">NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website.</p>
          <h3>NASA data and resources</h3>
          <List refs={NASA} />
        </section>
        <section>
          <h3>Space agency partner resources</h3>
          {PARTNERS.map(([agency, refs]) => <div key={agency}><h4>{agency}</h4><List refs={refs} /></div>)}
          <h3>Data and research behind this page</h3>
          <List refs={USED} />
        </section>
      </div>
      <p className="credit">
        Built by team Big Hero 7 for the 2026 NASA Space Apps Challenge, “Dancing with the SARs”. Code and data pipeline: <a href="https://github.com/SoulBreaker9/Big-Hero-7">GitHub</a>.
        SI use: an AI assistant (Claude) helped write the code, process the data and edit the text. The 3D model was built from code in Blender. Every figure is cited above. The underground is an illustration, not to scale. Not affiliated with or endorsed by NASA or ISRO.
      </p>
    </footer>
  )
}
