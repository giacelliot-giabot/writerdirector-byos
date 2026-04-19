import type { Scene, ScriptElement } from './scenes'

// ── FDX ───────────────────────────────────────────────────────────────────

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function mapTypeToFD(type: ScriptElement['type']): string {
  const map: Record<ScriptElement['type'], string> = {
    scene_heading: 'Scene Heading',
    action:        'Action',
    character:     'Character',
    parenthetical: 'Parenthetical',
    dialogue:      'Dialogue',
    transition:    'Transition',
  }
  return map[type] ?? 'General'
}

export function exportToFDX(scenes: Scene[], title: string, author: string): void {
  const sorted = [...scenes].sort((a, b) => a.order - b.order)

  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n`
  xml += `<FinalDraft DocumentType="Script" Template="No" Version="2">\n`
  xml += `\n  <TitlePage>\n    <Content>\n`
  xml += `      <Paragraph Type="Title Page Title"><Text>${escapeXML(title)}</Text></Paragraph>\n`
  if (author) {
    xml += `      <Paragraph Type="Title Page Author"><Text>Written by\n${escapeXML(author)}</Text></Paragraph>\n`
  }
  xml += `    </Content>\n  </TitlePage>\n\n`
  xml += `  <Content>\n`
  xml += `    <Paragraph Type="Transition"><Text>FADE IN:</Text></Paragraph>\n`

  for (const scene of sorted) {
    const blocks = scene.liarsPass?.content ?? []
    for (const block of blocks) {
      if (!block.text.trim()) continue
      xml += `    <Paragraph Type="${mapTypeToFD(block.type)}"><Text>${escapeXML(block.text)}</Text></Paragraph>\n`
    }
  }

  xml += `    <Paragraph Type="Transition"><Text>FADE OUT.</Text></Paragraph>\n`
  xml += `  </Content>\n`
  xml += `</FinalDraft>`

  triggerDownload(xml, `${sanitizeFilename(title)}.fdx`, 'application/xml')
}

// ── PDF (print to new window) ─────────────────────────────────────────────

function blockToHTML(block: ScriptElement): string {
  const text = escapeHTML(block.text).replace(/\n/g, '<br>')
  switch (block.type) {
    case 'scene_heading':  return `<p class="scene-heading">${text}</p>`
    case 'action':         return `<p class="action">${text}</p>`
    case 'character':      return `<p class="character">${text}</p>`
    case 'parenthetical':  return `<p class="parenthetical">${text}</p>`
    case 'dialogue':       return `<p class="dialogue">${text}</p>`
    case 'transition':     return `<p class="transition">${text}</p>`
    default:               return `<p>${text}</p>`
  }
}

export function exportToPDF(scenes: Scene[], title: string, author: string): void {
  const sorted = [...scenes].sort((a, b) => a.order - b.order)

  const css = `
    @page { size: letter; margin: 1in 1in 1in 1.5in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.5; color: #000; }

    /* Title page */
    .title-page {
      min-height: 100vh;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center;
      page-break-after: always;
    }
    .title-page h1 { font-size: 14pt; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24pt; }
    .title-page .byline { font-size: 12pt; }

    /* Screenplay elements */
    /* All margins relative to the 6" content block defined by @page */
    p { margin-bottom: 12pt; }
    .scene-heading { text-transform: uppercase; margin-top: 24pt; }
    .action { }
    .character { margin-left: 2.2in; margin-bottom: 0; text-transform: uppercase; }
    .parenthetical { margin-left: 1.6in; margin-right: 0.9in; margin-bottom: 0; }
    .dialogue { margin-left: 1in; margin-right: 1in; margin-bottom: 12pt; }
    .transition { text-align: right; text-transform: uppercase; margin-top: 12pt; }
    .fade { text-transform: uppercase; margin-bottom: 24pt; }
  `

  let body = ''

  // Title page
  body += `<div class="title-page">`
  body += `<h1>${escapeHTML(title || 'Untitled')}</h1>`
  if (author) body += `<p class="byline">Written by<br><strong>${escapeHTML(author)}</strong></p>`
  body += `</div>`

  body += `<p class="fade">FADE IN:</p>`

  for (const scene of sorted) {
    const blocks = scene.liarsPass?.content ?? []
    for (const block of blocks) {
      if (!block.text.trim()) continue
      body += blockToHTML(block)
    }
  }

  body += `<p class="fade" style="text-align:right">FADE OUT.</p>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHTML(title || 'Script')}</title>
  <style>${css}</style>
</head>
<body>${body}</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to export PDF.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 250)
}

// ── Helpers ───────────────────────────────────────────────────────────────

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeFilename(str: string): string {
  return (str || 'script').replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'script'
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
