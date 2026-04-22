import { useState } from 'react'
import type { SceneOutline, CharacterData } from '../lib/scenes'
import { resolveCharColor } from '../lib/characterColors'

interface Props {
  outline: SceneOutline
}

export default function OutlineReference({ outline }: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    outline?.characters?.[0]?.id ?? null
  )

  const activeChar = outline?.characters?.find((c) => c.id === activeId) ?? null

  return (
    <div className="space-y-5">
      {/* Character pills */}
      {outline?.characters?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {outline.characters.map((c) => {
            const color = resolveCharColor(c.color)
            const style = c.id === activeId ? color.active : color.idle
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{ background: style.background, color: style.color }}
                className="rounded-full px-3 py-1 text-xs font-medium transition-all"
              >
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected character arc */}
      {activeChar && <CharacterArc char={activeChar} />}

      {/* Setting / Plot */}
      {outline?.settingPlot && (
        <div className="pt-3 border-t border-zinc-800 space-y-1">
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-medium">Setting / Plot</p>
          <p className="text-zinc-500 text-xs leading-relaxed">{outline.settingPlot}</p>
        </div>
      )}
    </div>
  )
}

function CharacterArc({ char }: { char: CharacterData }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Wants', value: char.want },
    { label: 'Coming from', value: char.comingFrom },
    { label: 'Realizes', value: char.realization },
    { label: 'Needs', value: char.needsToGetThrough },
  ]

  return (
    <div className="space-y-3">
      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">{char.name}</p>
      {rows.map((r) =>
        r.value ? (
          <div key={r.label} className="space-y-0.5">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest">{r.label}</p>
            <p className="text-zinc-500 text-xs leading-relaxed">{r.value}</p>
          </div>
        ) : null
      )}
      {char.whereNow && (
        <div className="bg-zinc-800/50 rounded-lg p-3 space-y-0.5">
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Where they land</p>
          <p className="text-zinc-400 text-xs leading-relaxed">{char.whereNow}</p>
        </div>
      )}
    </div>
  )
}
