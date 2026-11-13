// Decodes the backscatter atlas off the main thread and answers "what did this spot look like on every pass".
let ctx: OffscreenCanvasRenderingContext2D | null = null

self.onmessage = async (e: MessageEvent<{ id: number; url: string; n: number; cols: number; u: number; v: number }>) => {
  const { id, url, n, cols, u, v } = e.data
  try {
    if (!ctx) {
      const bmp = await createImageBitmap(await (await fetch(url)).blob())
      ctx = new OffscreenCanvas(bmp.width, bmp.height).getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(bmp, 0, 0)
      bmp.close()
    }
    const tile = ctx.canvas.width / cols
    const hh: number[] = []
    const hv: number[] = []
    for (let i = 0; i < n; i++) {
      // 3x3 px mean (about 0.8 km), kept inside the tile
      const x = Math.min(Math.max(Math.round(u * tile), 1), tile - 2) + (i % cols) * tile
      const y = Math.min(Math.max(Math.round((1 - v) * tile), 1), tile - 2) + Math.floor(i / cols) * tile
      const d = ctx.getImageData(x - 1, y - 1, 3, 3).data
      let r = 0
      let g = 0
      for (let p = 0; p < d.length; p += 4) { r += d[p]; g += d[p + 1] } // quicklook is R = HH, G = HV
      hh.push(Math.round(r / 9))
      hv.push(Math.round(g / 9))
    }
    self.postMessage({ id, hh, hv })
  } catch (err) {
    self.postMessage({ id, error: 'Could not read the scene pixels: ' + String(err) })
  }
}
