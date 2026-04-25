import type { CharacterData, SceneOutline } from '../lib/scenes'

interface Props {
  outline: SceneOutline
}

/**
 * Read-only view of the full emotional outline: every character in the same
 * structure as the Emotional Outline screen, plus Setting / Plot at the end.
 */
export default function EmotionalOutlineMirror({ outline }: Props) {
  const characters = outline?.characters ?? []
  const settingPlot = outline?.settingPlot?.trim() ?? ''

  if (characters.length === 0 && !settingPlot) {
    return <p className="text-zinc-600 text-xs leading-relaxed">No outline content yet.</p>
  }

  return (
    <div className="space-y-8">
      {characters.map((c) => (
        <CharacterArcMirror key={c.id} character={c} />
      ))}

      {settingPlot && (
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Setting / Plot</p>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{settingPlot}</p>
        </div>
      )}
    </div>
  )
}

function CharacterArcMirror({ character }: { character: CharacterData }) {
  const hasAny =
    character.comingFrom ||
    character.sceneTheyreEntering ||
    character.want ||
    character.realization ||
    character.needsToGetThrough ||
    character.tactics ||
    character.whereNow

  if (!hasAny) {
    return (
      <div className="text-zinc-600 text-sm">
        {character.name}&apos;s arc will appear here as you write.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium">{character.name}</p>

      {character.comingFrom && <MirrorRow label="Where are they coming from?" content={character.comingFrom} />}
      {character.sceneTheyreEntering && (
        <MirrorRow label="What scene do they think they're entering?" content={character.sceneTheyreEntering} />
      )}
      {character.want && (
        <MirrorRow label="What are their biggest hopes and dreams for the scene?" content={character.want} />
      )}
      {character.realization && (
        <MirrorRow label="When do they realize they're in a much different scene?" content={character.realization} />
      )}
      {character.needsToGetThrough && (
        <MirrorRow
          label="What do they need their scene partner to do or say to make it to the end of the scene?"
          content={character.needsToGetThrough}
        />
      )}
      {character.tactics && (
        <MirrorRow label="What things might they try to get that?" content={character.tactics} />
      )}
      {character.whereNow && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-1">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">Where is this character now?</p>
          <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{character.whereNow}</p>
        </div>
      )}
    </div>
  )
}

function MirrorRow({ label, content }: { label: string; content: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide leading-snug">{label}</p>
      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}
