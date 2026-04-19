import { useRef, useEffect, useCallback } from 'react'
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
  scene_heading: 'font-mono text-sm font-bold tracking-wide w-full text-left',
  action:        'font-mono text-sm w-full text-left',
  character:     'font-mono text-sm font-semibold uppercase w-full pl-[37%]',
  dialogue:      'font-mono text-sm w-full px-[17%]',
  parenthetical: 'font-mono text-sm italic w-full pl-[27%] pr-[15%]',
  transition:    'font-mono text-sm font-semibold uppercase w-full text-right',
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

  // Auto-resize all textareas when blocks change
  useEffect(() => {
    refs.current.forEach((el) => resize(el))
  }, [blocks])

  function focus(id: string, toEnd = true) {
    requestAnimationFrame(() => {
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
      // Double-enter in dialogue → split and create action block
      if (block.type === 'dialogue' && raw.endsWith('\n\n')) {
        update(block.id, { text: raw.slice(0, -2) })
        insertAfter(block.id, 'action')
        return
      }
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
      if (meta && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        insertAfter(block.id, 'scene_heading')
        return
      }
      if (meta && e.shiftKey && e.key === 'T') {
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
        if (block.type === 'character') {
          e.preventDefault()
          insertAfter(block.id, 'dialogue')
          return
        }
        if (block.type === 'parenthetical') {
          e.preventDefault()
          insertAfter(block.id, 'dialogue')
          return
        }
        if (block.type === 'scene_heading' || block.type === 'transition') {
          e.preventDefault()
          insertAfter(block.id, 'action')
          return
        }
        // dialogue: let textarea handle newlines; double-enter caught in onChange
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

  // Initialise with a single action block if empty
  useEffect(() => {
    if (blocks.length === 0 && !readOnly) {
      onChange([{ id: crypto.randomUUID(), type: 'action', text: '' }])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
  )
}

// ─── BlockRow ──────────────────────────────────────────────────────────────

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
