// Builds deck/Saah-SpaceApps-2026.pptx (7 slides, the Space Apps limit). Same story and look as the site: dark, one idea per slide.
//   npm i --no-save pptxgenjs && node scripts/build_deck.cjs      (PPTX_SKILL=<pptx skill dir> also writes the theme colours)
const path = require('path')
const pptxgen = require('pptxgenjs')
const data = require('../src/data/passes.json')
const paddy = require('../src/data/paddy.json')
const sband = require('../src/data/sband.json')

const root = path.join(__dirname, '..')
const img = (n) => path.join(root, 'docs', n)
const THEME = {
  name: 'Saah', headFontFace: 'Calibri', bodyFontFace: 'Calibri',
  colors: { dk1: '1A0E22', lt1: 'F3F5F1', dk2: '2B1838', lt2: 'B9A3B0', accent1: 'E04AB4', accent2: '5FB37F', accent3: '6E9FE6', accent4: 'D9B26F', accent5: '6B4A5E', accent6: '4A3355', hlink: '6E9FE6', folHlink: 'B9A3B0' },
}
const pres = new pptxgen()
pres.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace }
pres.title = 'Saah: is Punjab’s ground still breathing?'
pres.author = 'Team Big Hero 7'
const C = pres.SchemeColor

// One dark frame for every slide, like the site at night: eyebrow + title top left, footer and number bottom.
pres.defineSlideMaster({
  title: 'STORY', background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: 'eyebrow', type: 'body', x: 0.6, y: 0.5, w: 7, h: 0.35, fontSize: 12, bold: true, color: C.accent1, charSpacing: 3, margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.88, w: 6.0, h: 1.6, fontSize: 36, bold: true, color: C.background1, valign: 'top', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Saah  ·  NASA Space Apps 2026  ·  Dancing with the SARs  ·  saah-gamma.vercel.app', options: { x: 0.6, y: 6.98, w: 10, h: 0.3, fontSize: 10, color: C.background2, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 6.98, w: 0.6, h: 0.3, fontSize: 10, color: C.background2, align: 'right' },
})
pres.defineSlideMaster({ title: 'COVER', background: { color: C.text1 } })

const slide = (eyebrow, title, notes) => {
  const s = pres.addSlide({ masterName: 'STORY' })
  s.addText(eyebrow.toUpperCase(), { placeholder: 'eyebrow' })
  s.addText(title, { placeholder: 'title' })
  s.addNotes(notes)
  return s
}
const text = (s, t, o) => s.addText(t, { isTextBox: true, fontSize: 16, color: C.background2, valign: 'top', margin: 0, paraSpaceAfter: 6, ...o })
const big = (s, n, unit, label, x, y, w, color = C.accent1) => {
  s.addText([{ text: n, options: { fontSize: 66, bold: true, color } }, { text: unit, options: { fontSize: 22, bold: true, color } }], { isTextBox: true, x, y, w, h: 1.05, valign: 'bottom', margin: 0 })
  text(s, label, { x, y: y + 1.1, w, h: 0.75, fontSize: 14 })
}
const picture = (s, name, x, y, w, h, alt) => s.addImage({ path: img(name), x, y, w, h, altText: alt })
const caption = (s, t, x, y, w) => text(s, t, { x, y, w, h: 0.3, fontSize: 10 })

// 1. cover: the question, the block
{
  const s = pres.addSlide({ masterName: 'COVER' })
  picture(s, 'deck-cover.jpg', 0, 0, 13.33, 7.5, '3D block of Punjab with a real NISAR image on top and an illustrated aquifer below')
  s.addText('ਸਾਹ  saah · Punjabi for breath', { isTextBox: true, x: 0.6, y: 1.3, w: 5.6, h: 0.45, fontSize: 18, bold: true, color: C.accent1, margin: 0 })
  s.addText('Is Punjab’s ground still breathing?', { isTextBox: true, x: 0.6, y: 1.9, w: 5.4, h: 2.6, fontSize: 48, bold: true, color: C.background1, valign: 'top', margin: 0 })
  s.addText('One year of NISAR radar. 134 km of farmland. 24 passes before dawn.', { isTextBox: true, x: 0.6, y: 4.7, w: 5.2, h: 0.9, fontSize: 18, color: C.background2, valign: 'top', margin: 0 })
  s.addText('Team Big Hero 7  ·  NASA Space Apps Challenge 2026  ·  Dancing with the SARs', { isTextBox: true, x: 0.6, y: 6.6, w: 7, h: 0.3, fontSize: 11, color: C.background2, margin: 0 })
  s.addNotes('Saah means breath in Punjabi. An aquifer made of sand breathes: the ground falls when water is pumped and rises when it refills. We ask whether Punjab’s still does. The top of the block is a real NISAR image; the underground is an illustration, not to scale. Live site: saah-gamma.vercel.app')
}

// 2. the overdraft: one number, two bars
{
  const s = slide('01 · The overdraft', 'Punjab pumps faster than the rain can refill', 'CGWB 2023: 27.8 billion cubic metres extracted against 16.98 extractable, stage of extraction 163.76 percent. Mishra et al. 2024 for north India. Hasan et al. 2023: about 17 km³ of aquifer storage lost for good each year worldwide, and roughly 60 percent of sinking land is cropland.')
  big(s, '164', ' litres', 'pumped for every 100 that come back (CGWB, 2023)', 0.6, 2.75, 5.8)
  const bar = (y, label, w, color, value) => {
    text(s, label, { x: 0.6, y, w: 3, h: 0.3, fontSize: 14 })
    text(s, value, { x: 3.6, y, w: 2.8, h: 0.3, fontSize: 14, bold: true, color: C.background1, align: 'right' })
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: y + 0.36, w, h: 0.2, fill: { color }, line: { color, width: 0 }, rectRadius: 0.1, objectName: label })
  }
  bar(4.75, 'Pumped', 5.8, C.accent1, '27.8 bn m³')
  bar(5.45, 'Recharged', 5.8 * (16.98 / 27.8), C.accent3, '17 bn m³')
  picture(s, 'deck-strata.jpg', 6.9, 0.45, 5.95, 5.64, 'The illustrated aquifer: the water table falls and shallow wells run dry')
  caption(s, 'Sand springs back when it refills. Clay, once squeezed, never does.', 6.9, 6.2, 5.95)
}

// 3. the blind spot: old radar vs NISAR
{
  const s = slide('02 · The blind spot', 'Old radar saw cities sink. Not the fields', 'Garg et al. 2022 measured Delhi with Sentinel-1 persistent scatterers, which need buildings. Over crops, C-band decorrelates. Our evidence for L-band is direct: all 21 twelve-day NISAR interferograms of this farmland show continuous fringes. Most of the fringe pattern is atmosphere and orbit, not ground motion.')
  big(s, '5.6', ' cm', 'Older C-band. Crops scramble the echo.', 0.6, 2.75, 2.9, C.background2)
  big(s, '24', ' cm', 'NISAR L-band. Reaches the soil.', 3.8, 2.75, 2.9)
  big(s, '21', '/21', 'Twelve-day comparisons of this farmland that stay unbroken.', 0.6, 4.55, 5.8)
  picture(s, 'deck-phase.jpg', 6.9, 0.45, 5.95, 5.64, 'A real NISAR interferogram of the farmland draped on the block')
  caption(s, 'A real NISAR interferogram of this farmland. One colour cycle ≈ 12 cm.', 6.9, 6.2, 5.95)
}

// 4. the year: the native chart
{
  const s = slide('03 · One year from orbit', 'Watch the monsoon arrive from orbit', 'Mean quicklook brightness of our 134 km study area on each of 24 passes. HH rises from about 94 to 176 by 17 September while HV stays flat. Hypothesis: double bounce between standing water and rice stems. Caveat: quicklooks are not calibrated backscatter.')
  const labels = data.passes.map((p) => new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }))
  s.addChart(pres.charts.LINE, [{ name: 'HH', labels, values: data.passes.map((p) => p.hh) }, { name: 'HV', labels, values: data.passes.map((p) => p.hv) }], {
    x: 0.5, y: 2.55, w: 8.2, h: 4.2, chartColors: [THEME.colors.accent1, THEME.colors.accent2], lineSize: 3, lineDataSymbol: 'none',
    showTitle: true, title: 'Whole-scene brightness, 24 passes (0 to 255)', titleFontSize: 12, titleColor: THEME.colors.lt2, titleFontFace: '+mn-lt',
    showLegend: true, legendPos: 'b', legendFontSize: 11, legendColor: THEME.colors.lt2, legendFontFace: '+mn-lt',
    catAxisLabelColor: THEME.colors.lt2, valAxisLabelColor: THEME.colors.lt2, catAxisLabelFontSize: 9, valAxisLabelFontSize: 10, catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt',
    catAxisLabelRotate: 315, valAxisMinVal: 0, valAxisMaxVal: 255, valAxisMajorUnit: 85, valGridLine: { color: THEME.colors.accent6, size: 0.5 }, catGridLine: { style: 'none' },
    catAxisLineShow: false, valAxisLineShow: false,
  })
  big(s, '94→176', '', 'HH echo, mid-August to 17 September. HV barely moves.', 9.1, 2.75, 3.75)
  text(s, 'Rice stems standing in flooded fields bounce the wave off the water and back. It fades with the October harvest: the months the tubewells run hardest.', { x: 9.1, y: 4.75, w: 3.75, h: 1.9, fontSize: 15 })
}

// 5. the tests: rice proven by numbers, S-band, wells
{
  const s = slide('04 · The tests', 'Flooded paddy lights up. Nothing else does', `Rice: Sentinel-2 crop calendar (ESA via AWS Open Data). ${paddy.stats.rice.cells} rice-like cells. S-band: projected from L-band, not measured; phase scales by ${sband.phaseMultiplier}. Wells: Sharma, Sidana and Kumari 2024, J. Agricultural Development and Policy 34(1), doi 10.63066/23220457.34.1.002. Ground motion: 21 browse interferograms, line plus yearly cycle per pixel, noise about 13 mm.`)
  picture(s, 'deck-rice.jpg', 6.9, 0.45, 5.95, 5.64, 'The block at the September peak, rice fields bright magenta')
  big(s, `+${paddy.stats.rice.riseHH}`, '', 'HH echo, rice-like fields, June to September', 0.6, 2.6, 2.9)
  big(s, `${paddy.stats.perennial.riseHH}`, '', 'HH echo, perennial vegetation, same months', 3.8, 2.6, 2.9, C.accent2)
  const row = (y, head, line) => {
    text(s, head, { x: 0.6, y, w: 1.6, h: 0.4, fontSize: 16, bold: true, color: C.background1 })
    text(s, line, { x: 2.2, y, w: 4.4, h: 0.6, fontSize: 14 })
  }
  row(4.7, 'S-band', `Would feel the same motion ${sband.phaseMultiplier}× harder: 47 mm per fringe vs 119 mm.`)
  row(5.35, 'Wells', 'Sangrur, Barnala, Patiala: water fell 20 to 26 m, 1996 to 2018.')
  row(6.0, 'Motion', 'A ground-motion layer per pixel, open on the site.')
}

// 6. the site
{
  const s = slide('05 · Look for yourself', 'Every pixel is a real NISAR pass', 'Demo: saah-gamma.vercel.app. Scroll to play the story; at the end, drag through 24 passes, switch backscatter, interferogram or ground motion, and pin any field to chart it. The ledger lists the NASA granule behind every image. Code and data pipeline: github.com/SoulBreaker9/Big-Hero-7.')
  picture(s, 'deck-site.jpg', 0.6, 2.55, 7.36, 4.6 * 0.92, 'The explorer on the live site: a pass slider, three layers and a 3D block')
  const steps = [['Scroll', 'Nine chapters play on one 3D block'], ['Switch', 'Backscatter, interferogram, ground motion'], ['Pin', 'Any field, charted through the year'], ['Trace', 'Every image to its NASA granule']]
  steps.forEach(([h, t], i) => {
    const y = 2.6 + i * 0.95
    s.addShape(pres.ShapeType.ellipse, { x: 8.4, y, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 }, objectName: `step ${i + 1}` })
    s.addText(String(i + 1), { isTextBox: true, x: 8.4, y, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0 })
    text(s, h, { x: 9.1, y: y - 0.04, w: 3.7, h: 0.35, fontSize: 18, bold: true, color: C.background1 })
    text(s, t, { x: 9.1, y: y + 0.33, w: 3.7, h: 0.4, fontSize: 14 })
  })
  text(s, 'saah-gamma.vercel.app', { x: 8.4, y: 6.4, w: 4.4, h: 0.4, fontSize: 16, bold: true, color: C.accent3 })
}

// 7. what it delivers, and the sources
{
  const s = slide('06 · What it delivers', 'Where recharge still buys storage', 'Sources: NISAR GCOV and GUNW browse products, NASA/ISRO via ASF DAAC; CGWB 2023; Mishra et al. 2024 Earth’s Future; Hasan et al. 2023 Nature Communications; Garg et al. 2022 Scientific Reports; USGS Circular 1182; Sentinel-2 L2A via AWS Open Data. Challenge resources: NASA Earthdata Search, ASF Data Search Vertex, NISAR Data User Guide, Intro to Remote Sensing, Intro to SAR, NASA ARSET, NISAR StoryMaps, NISAR Applications White Papers, UAVSAR Postcards; CSA RCM data, CSA SAR Python tutorial, RADARSAT-1 data; CONAE SAOCOM catalogue and registration. NASA does not endorse any non-U.S. Government entity. Limits: one year of browse data, S-band projected, wells to 2018. SI use: an AI assistant (Claude) helped write code and text. Not affiliated with NASA or ISRO.')
  const who = [['Water boards', 'Where recharge money still buys storage, and where the clay is already lost.'], ['Farmers and banks', 'Where wells will keep going deeper.'], ['Anywhere NISAR flies', 'North China Plain, California, Iran, the Indus basin.']]
  who.forEach(([h, t], i) => {
    const x = 0.6 + i * 4.1
    s.addShape(pres.ShapeType.roundRect, { x, y: 2.6, w: 3.8, h: 1.75, fill: { color: C.text2 }, line: { color: C.accent6, width: 0.75 }, rectRadius: 0.1, objectName: h })
    text(s, h, { x: x + 0.3, y: 2.8, w: 3.2, h: 0.4, fontSize: 18, bold: true, color: C.accent1 })
    text(s, t, { x: x + 0.3, y: 3.3, w: 3.2, h: 0.95, fontSize: 14 })
  })
  text(s, 'SOURCES', { x: 0.6, y: 4.65, w: 4, h: 0.3, fontSize: 11, bold: true, color: C.accent1, charSpacing: 3 })
  text(s, [
    { text: 'NASA: ', options: { bold: true, color: C.background1 } }, { text: 'NISAR GCOV/GUNW via ASF DAAC · Earthdata Search · ASF Vertex · NISAR Data User Guide · Intro to Remote Sensing · Intro to SAR · ARSET · NISAR StoryMaps · NISAR Applications White Papers · UAVSAR Postcards', options: { breakLine: true } },
    { text: 'Partners: ', options: { bold: true, color: C.background1 } }, { text: 'CSA RCM data, SAR Python tutorial, RADARSAT-1 data · CONAE SAOCOM catalogue and registration · ESA Sentinel-2', options: { breakLine: true } },
    { text: 'Research: ', options: { bold: true, color: C.background1 } }, { text: 'CGWB 2023 · Mishra et al. 2024 · Hasan et al. 2023 · Garg et al. 2022 · Sharma et al. 2024 · USGS Circ. 1182', options: { breakLine: true } },
    { text: 'NASA does not endorse any non-U.S. Government entity. SI use: an AI assistant (Claude) helped write code and text. Not affiliated with NASA or ISRO.' },
  ], { x: 0.6, y: 5.0, w: 12.15, h: 1.85, fontSize: 11, paraSpaceAfter: 4 })
}

const out = path.join(root, 'deck', 'Saah-SpaceApps-2026.pptx')
pres.writeFile({ fileName: out }).then(async () => {
  const skill = process.env.PPTX_SKILL // optional: path to the pptx skill, to write the theme colours into the file
  if (skill) await require(path.join(skill, 'scripts/apply_theme.js')).applyTheme(out, THEME)
  console.log('wrote', out, skill ? 'with theme' : 'WITHOUT theme colours (set PPTX_SKILL)')
})
