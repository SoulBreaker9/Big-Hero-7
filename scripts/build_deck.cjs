// Builds deck/Saah-SpaceApps-2026.pptx (7 slides, the Space Apps limit).  npm i --no-save pptxgenjs && node scripts/build_deck.cjs
const path = require('path')
const pptxgen = require('pptxgenjs')
const data = require('../src/data/passes.json')

const root = path.join(__dirname, '..')
const img = (n) => path.join(root, 'docs', n)
const THEME = {
  name: 'Saah', headFontFace: 'Calibri', bodyFontFace: 'Calibri',
  colors: { dk1: '2A1533', lt1: 'F3F5F1', dk2: '5A4763', lt2: 'E4E8E3', accent1: 'B4148C', accent2: '2F7D4F', accent3: '2C5FA8', accent4: 'B9A3B0', accent5: '6B4A5E', accent6: 'BFB9C0', hlink: '2C5FA8', folHlink: '5A4763' },
}
const pres = new pptxgen()
pres.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace }
pres.title = 'Saah: is Punjab’s ground still breathing?'
pres.author = 'Team Big Hero 7'
const C = pres.SchemeColor

pres.defineSlideMaster({
  title: 'CONTENT', background: { color: C.background2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.45, w: 12.1, h: 1.25, fontSize: 36, bold: true, color: C.text1, valign: 'top', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Saah  |  NASA Space Apps 2026, Dancing with the SARs  |  saah-gamma.vercel.app', options: { x: 0.6, y: 6.98, w: 10, h: 0.3, fontSize: 10, color: C.text2, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 6.98, w: 0.6, h: 0.3, fontSize: 10, color: C.text2, align: 'right' },
})
pres.defineSlideMaster({ title: 'COVER', background: { color: C.text1 } })

const slide = (title, notes) => { const s = pres.addSlide({ masterName: 'CONTENT' }); s.addText(title, { placeholder: 'title' }); s.addNotes(notes); return s }
const body = (s, text, o) => s.addText(text, { isTextBox: true, fontSize: 16, color: C.text1, valign: 'top', margin: 0, paraSpaceAfter: 8, ...o })
const stat = (s, big, small, x, y, w = 2.8) => {
  s.addText(big, { isTextBox: true, x, y, w, h: 0.85, fontSize: 44, bold: true, color: C.accent1, margin: 0 })
  s.addText(small, { isTextBox: true, x, y: y + 0.85, w, h: 0.9, fontSize: 13, color: C.text2, valign: 'top', margin: 0 })
}
const picture = (s, name, x, y, w, h) => s.addImage({ path: img(name), x, y, w, h, altText: name })

// 1. cover
{
  const s = pres.addSlide({ masterName: 'COVER' })
  s.addText('Saah, Punjabi for breath', { isTextBox: true, x: 0.6, y: 1.2, w: 5.6, h: 0.4, fontSize: 16, color: C.accent4, margin: 0 })
  s.addText('Is Punjab’s ground still breathing?', { isTextBox: true, x: 0.6, y: 1.7, w: 5.6, h: 2.6, fontSize: 50, bold: true, color: C.background1, valign: 'top', margin: 0 })
  s.addText('One year of NISAR L-band radar over India’s most heavily pumped farmland, and the question it can finally answer: when the monsoon refills the aquifer, does the land rise back?', { isTextBox: true, x: 0.6, y: 4.45, w: 5.4, h: 1.5, fontSize: 16, color: C.background2, valign: 'top', margin: 0 })
  s.addText('Team Big Hero 7  |  NASA Space Apps Challenge 2026  |  Dancing with the SARs', { isTextBox: true, x: 0.6, y: 6.6, w: 6, h: 0.3, fontSize: 11, color: C.accent4, margin: 0 })
  picture(s, 'crop-hero.jpg', 6.55, 1.0, 6.2, 4.96)
  s.addText('Top of the block: a real NISAR image, 134 km across. Underground: illustration.', { isTextBox: true, x: 6.55, y: 6.05, w: 6.2, h: 0.3, fontSize: 10, color: C.accent4, margin: 0 })
  s.addNotes('Saah means breath in Punjabi. An aquifer made of sand breathes: the ground falls when water is pumped and rises when it refills. We ask whether Punjab’s still does. Live site: saah-gamma.vercel.app')
}

// 2. problem
{
  const s = slide('Punjab pumps 164 litres of groundwater for every 100 it can replace', 'CGWB 2023 assessment: 27.8 billion cubic metres extracted against 16.98 extractable, stage of extraction 163.76 percent. Mishra et al. 2024 for north India. Hasan et al. 2023 for the global permanent loss and the cropland share.')
  stat(s, '164%', 'of Punjab’s replaceable groundwater is pumped each year (CGWB, 2023)', 0.6, 2.0)
  stat(s, '450 km³', 'of groundwater lost across north India, 2002 to 2021 (Mishra et al. 2024)', 3.7, 2.0)
  stat(s, '17 km³', 'of aquifer storage destroyed for good every year worldwide (Hasan et al. 2023)', 0.6, 4.15)
  stat(s, '~60%', 'of the world’s sinking land is cropland, not city (Hasan et al. 2023)', 3.7, 4.15)
  picture(s, 'crop-clay.jpg', 7.4, 1.85, 4.9, 4.9)
  body(s, 'Sand springs back when it refills. Clay, once squeezed, never does.', { x: 0.6, y: 6.15, w: 6.4, h: 0.5, bold: true })
}

// 3. gap
{
  const s = slide('Radar watched India’s cities sink. It could not see the fields', 'Garg et al. 2022 measured Delhi with Sentinel-1 persistent scatterers, which need buildings. Over crops C-band decorrelates. Our evidence for L-band is direct: all 21 twelve-day NISAR interferograms of this farmland show continuous fringes. Most of the fringe pattern is atmosphere and orbit, not ground motion.')
  const col = (x, head, lines, color) => {
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.95, w: 3.55, h: 4.45, fill: { color: C.background1 }, line: { color: C.accent6, width: 0.75 }, rectRadius: 0.08 })
    s.addText(head, { isTextBox: true, x: x + 0.3, y: 2.15, w: 2.95, h: 0.9, fontSize: 20, bold: true, color, valign: 'top', margin: 0 })
    body(s, lines.map((t, i) => ({ text: t, options: { breakLine: i < lines.length - 1 } })), { x: x + 0.3, y: 3.1, w: 2.95, h: 3.1, fontSize: 16 })
  }
  col(0.6, 'Before: C-band, 5.6 cm', ['Found Kapashera, beside Delhi airport, sinking about 17 cm a year.', 'Needs stable reflectors such as buildings.', 'Growing crops scramble the signal, so maps go blank where the pumping is.'], C.text2)
  col(4.4, 'Now: NISAR L-band, 24 cm', ['Passes through the crop to the soil.', 'All 21 of our twelve-day comparisons over Punjab’s fields are unbroken.', 'A pass every 12 days, free and open.'], C.accent1)
  picture(s, 'crop-phase.jpg', 8.3, 1.95, 4.45, 4.45)
  s.addText('A real NISAR interferogram of the farmland. One colour cycle is about 12 cm.', { isTextBox: true, x: 8.3, y: 6.45, w: 4.45, h: 0.3, fontSize: 10, color: C.text2, margin: 0 })
}

// 4. finding
{
  const s = slide('From orbit, you can watch the pumping season arrive', 'This chart is the mean quicklook brightness of our 134 km study area on each of 24 passes. HH rises from about 94 to 176 by 17 September while HV stays flat. Individual fields go from about 35 to about 205; cities stay near 245. Hypothesis: double bounce between standing water and rice stems. Caveat: quicklooks are not calibrated.')
  const labels = data.passes.map((p) => new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }))
  s.addChart(pres.charts.LINE, [{ name: 'HH', labels, values: data.passes.map((p) => p.hh) }, { name: 'HV', labels, values: data.passes.map((p) => p.hv) }], {
    x: 0.5, y: 1.85, w: 7.4, h: 3.6, chartColors: [THEME.colors.accent1, THEME.colors.accent2], lineSize: 2.25, lineDataSymbol: 'none',
    showTitle: true, title: 'Average brightness of the scene per pass (0 to 255)', titleFontSize: 12, titleColor: THEME.colors.dk2, titleFontFace: '+mn-lt',
    showLegend: true, legendPos: 'b', legendFontSize: 11, legendColor: THEME.colors.dk2, legendFontFace: '+mn-lt',
    catAxisLabelColor: THEME.colors.dk2, valAxisLabelColor: THEME.colors.dk2, catAxisLabelFontSize: 9, valAxisLabelFontSize: 10, catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt',
    catAxisLabelRotate: 315, valAxisMinVal: 0, valAxisMaxVal: 255, valAxisMajorUnit: 85, valGridLine: { color: 'BFB9C0', size: 0.5 }, catGridLine: { style: 'none' },
  })
  body(s, [
    { text: 'What we see. ', options: { bold: true } }, { text: 'From mid-August the plain turns magenta: HH climbs from 94 to 176 by 17 September, HV barely moves.', options: { breakLine: true } },
    { text: 'Our reading. ', options: { bold: true } }, { text: 'Rice stems standing in flooded fields bounce the wave off the water and straight back. It fades with the October harvest. These are the months the tubewells run hardest.' },
  ], { x: 0.6, y: 5.55, w: 7.2, h: 1.3, fontSize: 14 })
  picture(s, 'crop-monsoon.jpg', 8.3, 1.85, 4.45, 4.19)
  s.addText('The same fields on 17 September 2026', { isTextBox: true, x: 8.3, y: 6.12, w: 4.45, h: 0.3, fontSize: 10, color: C.text2, margin: 0 })
}

// 5. the app
{
  const s = slide('The app: scroll the year, then look for yourself', 'Demo: saah-gamma.vercel.app. Scroll to play the 24 passes, switch to interferograms, click any field to chart it. The ledger lists the NASA granule behind every image. Code and data pipeline: github.com/SoulBreaker9/Big-Hero-7.')
  picture(s, 'explorer.jpg', 0.6, 1.85, 7.9, 4.44)
  const rows = [['Scroll the year', '24 real passes play on a 3D block of Punjab.'], ['Switch what radar measured', 'Backscatter (HH and HV) or twelve-day interferograms.'], ['Pin any spot', 'Get its HH and HV through the year in one click.'], ['Trace every image', 'Each pass lists its NASA granule ID and release level.']]
  rows.forEach(([h, t], i) => {
    s.addShape(pres.ShapeType.ellipse, { x: 8.9, y: 1.95 + i * 1.12, w: 0.42, h: 0.42, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 } })
    s.addText(String(i + 1), { isTextBox: true, x: 8.9, y: 1.95 + i * 1.12, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0 })
    s.addText(h, { isTextBox: true, x: 9.5, y: 1.9 + i * 1.12, w: 3.25, h: 0.35, fontSize: 16, bold: true, color: C.text1, margin: 0 })
    s.addText(t, { isTextBox: true, x: 9.5, y: 2.27 + i * 1.12, w: 3.25, h: 0.6, fontSize: 13, color: C.text2, valign: 'top', margin: 0 })
  })
  body(s, 'saah-gamma.vercel.app     github.com/SoulBreaker9/Big-Hero-7', { x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 14, bold: true, color: C.accent3 })
}

// 6. the test
{
  const s = slide('Four tests of the breathing idea', 'Ground motion: we unwrapped the 21 browse interferograms and fitted a line plus a yearly cycle per pixel (noise about 13 mm, median trend -5.7 mm/yr). S-band: projected from L-band, not measured. Rice: Sentinel-2 crop calendar, ESA via AWS Open Data. Wells: Sharma, Sidana and Kumari 2024, J. Agricultural Development and Policy 34(1), doi 10.63066/23220457.34.1.002.')
  const steps = [['Motion', 'A third layer on the 3D block: slope and yearly cycle per pixel. Noise is as big as the signal, so it is a first pass.'], ['S-band', 'Projected from our L-band data: S-band fringes are 2.5x tighter (47 mm vs 119 mm). Crop decorrelation needs real S-band data.'], ['Rice', 'HH rises +11 on rice-like fields vs +4 in HV; perennial crops fall. Consistent with flooded paddy, not proof.'], ['Wells', 'Sangrur water level fell 7.75 m to 34.03 m (1996-2018). One year of radar cannot test that yet.']]
  steps.forEach(([h, t], i) => {
    const x = 0.6 + i * 3.1
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.95, w: 2.85, h: 2.5, fill: { color: C.background1 }, line: { color: C.accent6, width: 0.75 }, rectRadius: 0.08 })
    s.addText(`${i + 1}  ${h}`, { isTextBox: true, x: x + 0.25, y: 2.15, w: 2.35, h: 0.45, fontSize: 20, bold: true, color: C.accent1, margin: 0 })
    s.addText(t, { isTextBox: true, x: x + 0.25, y: 2.7, w: 2.35, h: 1.6, fontSize: 14, color: C.text1, valign: 'top', margin: 0 })
  })
  s.addText('What it delivers', { isTextBox: true, x: 0.6, y: 4.8, w: 5, h: 0.4, fontSize: 20, bold: true, color: C.text1, margin: 0 })
  body(s, [
    { text: 'A live 3D map of a year of NISAR over Punjab, with a ground-motion layer anyone can inspect.', options: { bullet: true, breakLine: true } },
    { text: 'For water boards: where recharge money still buys storage. For farmers and banks: where wells will keep going deeper.', options: { bullet: true, breakLine: true } },
    { text: 'The same method works on any pumped farmland NISAR covers: the North China Plain, California, Iran, the Indus basin.', options: { bullet: true } },
  ], { x: 0.6, y: 5.25, w: 12.1, h: 1.55, fontSize: 14 })
}

// 7. honest close
{
  const s = slide('What is real today, and what comes next', 'We would rather be exact than impressive. Sources: NISAR GCOV and GUNW browse products via ASF DAAC; CGWB 2023; Mishra et al. 2024 Earth’s Future; Hasan et al. 2023 Nature Communications; Garg et al. 2022 Scientific Reports; USGS Circular 1182. An AI assistant (Claude) helped write code and text. Not affiliated with NASA or ISRO.')
  const col = (x, head, lines, color) => {
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.95, w: 5.9, h: 3.55, fill: { color: C.background1 }, line: { color: C.accent6, width: 0.75 }, rectRadius: 0.06 })
    s.addText(head, { isTextBox: true, x: x + 0.3, y: 2.12, w: 5.3, h: 0.45, fontSize: 20, bold: true, color, margin: 0 })
    body(s, lines.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < lines.length - 1 } })), { x: x + 0.3, y: 2.7, w: 5.3, h: 2.7, fontSize: 14, paraSpaceAfter: 6 })
  }
  col(0.6, 'Real today', ['24 NISAR L-band passes and 21 interferograms of Punjab, Nov 2025 to Nov 2026, each traceable to its NASA file.', 'The monsoon rise in HH, visible field by field.', 'Unbroken interferograms over cropland.', 'Open scripts that rebuild the motion, rice and S-band numbers with no login.'], C.accent2)
  col(6.85, 'Not yet', ['Sinking is not yet measured: our motion layer uses browse images, and its noise is about 13 mm. Full GUNW files need a login.', 'Quicklook brightness is not calibrated backscatter.', 'One year cannot separate a trend from a slow cycle; NISAR’s mission is three.', 'S-band is projected, not measured. Rice is a crop-calendar proxy. Wells are district figures to 2018.'], C.accent1)
  body(s, [
    { text: 'Sources: ', options: { bold: true } }, { text: 'NISAR GCOV and GUNW browse products, NASA/ISRO via ASF DAAC. CGWB, Dynamic Ground Water Resources of India 2023. Mishra et al. 2024, Earth’s Future. Hasan et al. 2023, Nature Communications. Garg et al. 2022, Scientific Reports. USGS Circular 1182.', options: { breakLine: true } },
    { text: 'AI use: ', options: { bold: true } }, { text: 'an AI assistant (Claude) helped write the code, text and this deck. Every figure is cited. Not affiliated with or endorsed by NASA or ISRO.' },
  ], { x: 0.6, y: 5.65, w: 12.15, h: 1.2, fontSize: 11, color: C.text2, paraSpaceAfter: 4 })
}

const out = path.join(root, 'deck', 'Saah-SpaceApps-2026.pptx')
pres.writeFile({ fileName: out }).then(async () => {
  const skill = process.env.PPTX_SKILL // optional: path to the pptx skill, to write the theme colours into the file
  if (skill) await require(path.join(skill, 'scripts/apply_theme.js')).applyTheme(out, THEME)
  console.log('wrote', out, skill ? 'with theme' : 'WITHOUT theme colours (set PPTX_SKILL)')
})
