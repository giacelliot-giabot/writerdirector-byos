import { useState, useEffect } from 'react'
import { exportToFDX, exportToPDF } from '../lib/export'
import type { Scene } from '../lib/scenes'

interface Props {
  scenes: Scene[]
  defaultTitle?: string
  onClose: () => void
}

type Format = 'fdx' | 'pdf'

export default function CompileModal({ scenes, defaultTitle = '', onClose }: Props) {
  const [title, setTitle] = useState(defaultTitle)
  const [author, setAuthor] = useState('')
  const [format, setFormat] = useState<Format>('fdx')

  const sorted = [...scenes].sort((a, b) => a.order - b.order)
  const withContent = sorted.filter((s) => (s.liarsPass?.content ?? []).some((b) => b.text.trim()))
  const missing = sorted.filter((s) => !(s.liarsPass?.content ?? []).some((b) => b.text.trim()))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleExport() {
    if (withContent.length === 0) return
    if (format === 'fdx') {
      exportToFDX(withContent, title, author)
    } else {
      exportToPDF(withContent, title, author)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <h2 className="text-zinc-100 font-semibold text-base">Compile Script</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
            ESC to close
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-zinc-500 text-xs uppercase tracking-widest font-medium">
              Script Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg px-4 py-2.5 text-zinc-100 text-sm placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          {/* Author */}
          <div className="space-y-1.5">
            <label className="block text-zinc-500 text-xs uppercase tracking-widest font-medium">
              Written By
            </label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg px-4 py-2.5 text-zinc-100 text-sm placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <label className="block text-zinc-500 text-xs uppercase tracking-widest font-medium">
              Format
            </label>
            <div className="flex gap-2">
              {(['fdx', 'pdf'] as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    format === f
                      ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {f === 'fdx' ? '.fdx — Final Draft' : '.pdf — Print / PDF'}
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-xs pt-0.5">
              {format === 'fdx'
                ? 'Downloads an .fdx file you can open directly in Final Draft.'
                : 'Opens a print dialog — choose "Save as PDF" in your browser.'}
            </p>
          </div>

          {/* Scene summary */}
          <div className="space-y-2">
            <label className="block text-zinc-500 text-xs uppercase tracking-widest font-medium">
              Scenes in this export
            </label>
            <div className="bg-zinc-800/60 rounded-lg divide-y divide-zinc-800 max-h-48 overflow-y-auto">
              {sorted.map((scene, i) => {
                const hasContent = withContent.includes(scene)
                return (
                  <div key={scene.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-zinc-600 font-mono text-xs w-6 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-xs flex-1 truncate font-mono ${hasContent ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
                      {scene.sceneHeader || 'Untitled scene'}
                    </span>
                    <span className={`text-[10px] shrink-0 ${hasContent ? 'text-zinc-500' : 'text-zinc-700'}`}>
                      {hasContent ? 'included' : 'no liars pass'}
                    </span>
                  </div>
                )
              })}
            </div>
            {missing.length > 0 && (
              <p className="text-zinc-600 text-xs">
                {missing.length} scene{missing.length !== 1 ? 's' : ''} without a Liars Pass will be skipped.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={withContent.length === 0}
            className="bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            Export {format.toUpperCase()} →
          </button>
        </div>
      </div>
    </div>
  )
}
