import { useRef, useEffect, useCallback, useState } from 'react'
import type { ScriptElement } from '../lib/scenes'

// ─── Screenplay format config ──────────────────────────────────────────────
// Margins translated from spec (6" content width, percentage-based)
// scene_heading/action: full width (1.5" L, 1" R margins on page)
// character: starts at 3.7" → 2.2" offset / 6" = ~37% from content left
// dialogue: 2.5" L/R → 1" offset from content = ~17% each side
// parenthetical: 3.1" L, 2.9" R → 1.6" / 6" = ~27% L, 0.9" / 6" = ~15% R
// transition: right-aligned

type BlockType = ScriptElement['type']

const BLOCK_STYLE: Record<BlockType, string> = {
  scene_heading: 'font-mono text-sm tracking-wide w-full text-left',
  action:        'font-mono text-sm w-full text-left',
  character:     'font-mono text-sm uppercase w-full pl-[37%]',
  dialogue:      'font-mono text-sm w-full px-[17%]',
  parenthetical: 'font-mono text-sm italic w-full pl-[27%] pr-[15%]',
  transition:    'font-mono text-sm uppercase w-full text-right',
}

const BLOCK_LABEL: Record<BlockType, string> = {
  scene_heading: 'Scene Heading',
  action:        'Action',
  character:     'Character',
  parenthetical: 'Parenthetical',
  dialogue:      'Dialogue',
  transition:    'Transition',
}

// ─── Auto-format helpers ───────────────────────────────────────────────────

function applyAutoFormat(type: BlockType, raw: string): string {
  switch (type) {
    case 'scene_heading':
    case 'character':
    case 'transition':
      return raw.toUpperCase()
    case 'parenthetical': {
      let t = raw
      if (t && !t.startsWith('(')) t = '(' + t
      if (t && !t.endsWith(')')) t = t + ')'
      return t
    }
    default:
      return raw
  }
}

// ─── ScriptEditor ──────────────────────────────────────────────────────────

interface Props {
  blocks: ScriptElement[]
  onChange: (blocks: ScriptElement[]) => void
  readOnly?: boolean
}

export default function ScriptEditor({ blocks, onChange, readOnly = false }: Props) {
  const refs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const [showQuickKeys, setShowQuickKeys] = useState(false)
  const rafId = useRef<number | null>(null)

  // Cancel any pending programmatic focus the moment the user clicks anywhere.
  // This prevents Enter-triggered focus from stealing the click target.
  useEffect(() => {
    function onMouseDown() {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Cmd+Shift+/ — open/close quick keys (the universal keyboard shortcut convention)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.shiftKey && e.key === '/') {
        e.preventDefault()
        setShowQuickKeys((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Auto-resize all textareas when blocks change
  useEffect(() => {
    refs.current.forEach((el) => resize(el))
  }, [blocks])

  function focus(id: string, toEnd = true) {
    if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      const el = refs.current.get(id)
      if (!el) return
      el.focus()
      if (toEnd) el.setSelectionRange(el.value.length, el.value.length)
    })
  }

  function insertAfter(afterId: string, type: BlockType, text = ''): ScriptElement {
    const block: ScriptElement = { id: crypto.randomUUID(), type, text }
    const idx = blocks.findIndex((b) => b.id === afterId)
    const next = [...blocks]
    next.splice(idx + 1, 0, block)
    onChange(next)
    focus(block.id)
    return block
  }

  function update(id: string, patch: Partial<ScriptElement>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  function remove(id: string) {
    const idx = blocks.findIndex((b) => b.id === id)
    const next = blocks.filter((b) => b.id !== id)
    onChange(next)
    if (next.length > 0) focus(next[Math.max(0, idx - 1)].id)
  }

  const handleChange = useCallback(
    (block: ScriptElement, raw: string) => {
      // ( at beginning of empty dialogue → parenthetical
      if (block.type === 'dialogue' && raw === '(') {
        update(block.id, { type: 'parenthetical', text: '' })
        return
      }
      const text = applyAutoFormat(block.type, raw)
      update(block.id, { text })
    },
    [blocks, onChange] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, block: ScriptElement) => {
      const meta = e.metaKey || e.ctrlKey

      // ── Global shortcuts ──────────────────────────────────────────
      // Cmd+Shift+S → new scene heading  (S = Slug/Scene)
      if (meta && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        insertAfter(block.id, 'scene_heading')
        return
      }
      // Cmd+Shift+E → new transition  (E = End/Exit scene)
      if (meta && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        insertAfter(block.id, 'transition')
        return
      }

      // ── Tab ───────────────────────────────────────────────────────
      if (e.key === 'Tab') {
        e.preventDefault()
        if (block.type === 'action') {
          update(block.id, { type: 'character', text: block.text.toUpperCase() })
        } else if (block.type === 'character') {
          update(block.id, { type: 'action', text: block.text })
        } else if (block.type === 'dialogue') {
          // Tab in dialogue → new character cue
          insertAfter(block.id, 'character')
        }
        return
      }

      // ── Enter ─────────────────────────────────────────────────────
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (block.type === 'scene_heading' || block.type === 'transition') {
          insertAfter(block.id, 'action')
          return
        }
        if (block.type === 'action') {
          insertAfter(block.id, 'action')
          return
        }
        if (block.type === 'character') {
          insertAfter(block.id, 'dialogue')
          return
        }
        if (block.type === 'parenthetical') {
          insertAfter(block.id, 'dialogue')
          return
        }
        if (block.type === 'dialogue') {
          insertAfter(block.id, 'action')
          return
        }
      }

      // ── Backspace on empty block → delete ─────────────────────────
      if (e.key === 'Backspace' && block.text === '') {
        e.preventDefault()
        remove(block.id)
        return
      }
    },
    [blocks, onChange] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (readOnly) {
    return (
      <div className="space-y-1 font-mono text-xs text-zinc-400 leading-relaxed">
        {blocks.map((block) => (
          <div key={block.id} className={BLOCK_STYLE[block.type] + ' whitespace-pre-wrap opacity-70'}>
            {block.text || ' '}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="w-full space-y-0.5">
        {blocks.map((block) => (
          <BlockRow
            key={block.id}
            block={block}
            label={BLOCK_LABEL[block.type]}
            textareaClass={BLOCK_STYLE[block.type]}
            refCallback={(el) => {
              if (el) refs.current.set(block.id, el)
              else refs.current.delete(block.id)
            }}
            onChange={(raw) => handleChange(block, raw)}
            onKeyDown={(e) => handleKeyDown(e, block)}
          />
        ))}
      </div>

      {/* Quick keys hint */}
      <div className="mt-16 text-center">
        <button
          onClick={() => setShowQuickKeys(true)}
          className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors"
        >
          ⌘ Shift / — quick keys
        </button>
      </div>

      {/* Quick keys modal */}
      {showQuickKeys && <QuickKeysModal onClose={() => setShowQuickKeys(false)} />}
    </>
  )
}

// ─── BlockRow ──────────────────────────────────────────────────────────────

// ─── Quick Keys Modal ──────────────────────────────────────────────────────

const QUICK_KEYS = [
  {
    section: 'Navigation',
    keys: [
      { keys: 'Enter', where: 'Scene heading', result: 'New action line' },
      { keys: 'Enter', where: 'Action line', result: 'New action line' },
      { keys: 'Tab', where: 'Action line', result: 'Convert to character cue (auto-caps)' },
      { keys: 'Tab', where: 'Character cue', result: 'Convert back to action line' },
      { keys: 'Enter', where: 'Character cue', result: 'New dialogue block' },
      { keys: 'Enter', where: 'Dialogue', result: 'New action line' },
      { keys: '(', where: 'Empty dialogue', result: 'Convert to parenthetical' },
      { keys: 'Enter', where: 'Parenthetical', result: 'New dialogue block' },
      { keys: 'Tab', where: 'Dialogue', result: 'New character cue after' },
      { keys: 'Backspace', where: 'Empty block', result: 'Delete block' },
    ],
  },
  {
    section: 'Insert',
    keys: [
      { keys: '⌘ Shift S', where: 'Anywhere', result: 'Insert scene heading after current block' },
      { keys: '⌘ Shift E', where: 'Anywhere', result: 'Insert transition after current block' },
    ],
  },
  {
    section: 'Panels & Passes',
    keys: [
      { keys: '⌘ \\', where: 'Anywhere', result: 'Toggle outline / reference panel' },
      { keys: '⌘ →', where: 'Community Theater', result: 'Advance to Liars Pass' },
      { keys: '⌘ ←', where: 'Community Theater', result: 'Back to Scenes' },
      { keys: '⌘ ←', where: 'Liars Pass', result: 'Back to Scenes' },
    ],
  },
  {
    section: 'Quick Keys',
    keys: [
      { keys: '⌘ Shift /', where: 'Anywhere', result: 'Open / close this panel' },
    ],
  },
]

function QuickKeysModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <span className="text-zinc-200 text-sm font-medium tracking-wide">Quick Keys</span>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
            ESC to close
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {QUICK_KEYS.map((group) => (
            <div key={group.section}>
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-2">{group.section}</p>
              <div className="space-y-1.5">
                {group.keys.map((row, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <kbd className="shrink-0 font-mono text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap min-w-[90px] text-center">
                      {row.keys}
                    </kbd>
                    <span className="text-zinc-600 text-xs pt-0.5 shrink-0 w-32">{row.where}</span>
                    <span className="text-zinc-400 text-xs pt-0.5">{row.result}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function resize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function BlockRow({
  block,
  label,
  textareaClass,
  refCallback,
  onChange,
  onKeyDown,
}: {
  block: ScriptElement
  label: string
  textareaClass: string
  refCallback: (el: HTMLTextAreaElement | null) => void
  onChange: (raw: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}) {
  return (
    <div className="relative group w-full py-0.5">
      {/* Block type label */}
      <span className="absolute -left-24 top-1 text-[10px] text-zinc-700 uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity select-none w-20 text-right hidden lg:block">
        {label}
      </span>

      <textarea
        ref={refCallback}
        value={block.text}
        onChange={(e) => {
          resize(e.target)
          onChange(e.target.value)
        }}
        onKeyDown={onKeyDown}
        rows={1}
        spellCheck
        className={`${textareaClass} bg-transparent text-zinc-100 placeholder-zinc-700 outline-none resize-none overflow-hidden leading-relaxed py-0.5 border-b border-transparent focus:border-zinc-800 transition-colors`}
        style={{ minHeight: '1.6rem' }}
      />
    </div>
  )
}
