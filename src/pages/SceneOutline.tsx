import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToScenes,
  updateSceneOutline,
  updateSceneHeader,
  updateSceneState,
  outlineIsComplete,
  emptyCharacter,
  type Scene,
  type CharacterData,
} from '../lib/scenes'
import { resolveCharColor, COLOR_PALETTE, MONOCHROME } from '../lib/characterColors'
import ProgressDots from '../components/ProgressDots'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const CHARACTER_QUESTIONS: { key: keyof Omit<CharacterData, 'id' | 'name'>; label: string; prompt: string; distinct?: boolean }[] = [
  {
    key: 'want',
    label: 'What do they want?',
    prompt: 'What do they want or need from their scene partner more than anything?',
  },
  {
    key: 'comingFrom',
    label: 'Where are they coming from?',
    prompt: 'What\'s their expectation? What scene do they think they\'re entering — describe all 5 senses.',
  },
  {
    key: 'realization',
    label: 'The moment of realization',
    prompt: 'At what point do they realize they\'re not in the scene they thought they were?',
  },
  {
    key: 'needsToGetThrough',
    label: 'What do they need to get through?',
    prompt: 'What do they need from their scene partner to get through to the end of the scene?',
  },
  {
    key: 'whereNow',
    label: 'Where is this character now?',
    prompt: 'Where does this scene leave them?',
    distinct: true,
  },
]

export default function SceneOutline() {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [scene, setScene] = useState<Scene | null>(null)
  const [headerValue, setHeaderValue] = useState('')
  const [characters, setCharacters] = useState<CharacterData[]>([])
  const [settingPlot, setSettingPlot] = useState('')
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null)
  const [addingCharacter, setAddingCharacter] = useState(false)
  const [newCharacterName, setNewCharacterName] = useState('')
  const [initialized, setInitialized] = useState(false)

  const addInputRef = useRef<HTMLInputElement>(null)

  const debouncedHeader = useDebounce(headerValue, 600)
  const debouncedCharacters = useDebounce(characters, 800)
  const debouncedSettingPlot = useDebounce(settingPlot, 800)

  // Load from Firestore
  useEffect(() => {
    if (!user || !projectId) return
    return subscribeToScenes(user.uid, projectId, (scenes) => {
      const found = scenes.find((s) => s.id === sceneId)
      if (!found) return
      setScene(found)
      if (!initialized) {
        setHeaderValue(found.sceneHeader || '')
        const chars = found.outline?.characters || []
        setCharacters(chars)
        setSettingPlot(found.outline?.settingPlot || '')
        if (chars.length > 0) setActiveCharacterId(chars[0].id)
        setInitialized(true)
      }
    })
  }, [user, projectId, sceneId, initialized])

  // Focus add input
  useEffect(() => {
    if (addingCharacter) addInputRef.current?.focus()
  }, [addingCharacter])

  // Save header
  useEffect(() => {
    if (!initialized || !user || !projectId || !sceneId) return
    updateSceneHeader(user.uid, projectId, sceneId, debouncedHeader.toUpperCase())
  }, [debouncedHeader, initialized, user, projectId, sceneId])

  // Save outline + update state
  useEffect(() => {
    if (!initialized || !user || !projectId || !sceneId || !scene) return
    const outline = { characters: debouncedCharacters, settingPlot: debouncedSettingPlot }
    const complete = outlineIsComplete({ ...outline, completedAt: null })
    const hasAny =
      debouncedCharacters.length > 0 ||
      debouncedSettingPlot.trim().length > 0
    const newState = complete
      ? 'outline_complete'
      : hasAny
      ? 'outline_in_progress'
      : 'untouched'
    updateSceneOutline(user.uid, projectId, sceneId, outline, newState)
  }, [debouncedCharacters, debouncedSettingPlot, initialized, user, projectId, sceneId, scene])

  // Character field update
  const updateCharacterField = useCallback(
    (id: string, key: keyof Omit<CharacterData, 'id' | 'name'>, value: string) => {
      setCharacters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [key]: value } : c))
      )
    },
    []
  )

  function addCharacter() {
    const name = newCharacterName.trim().toUpperCase()
    if (!name) return
    const newChar = emptyCharacter(name)
    setCharacters((prev) => [...prev, newChar])
    setActiveCharacterId(newChar.id)
    setNewCharacterName('')
    setAddingCharacter(false)
  }

  function removeCharacter(id: string) {
    setCharacters((prev) => {
      const next = prev.filter((c) => c.id !== id)
      if (activeCharacterId === id) {
        setActiveCharacterId(next.length > 0 ? next[0].id : null)
      }
      return next
    })
  }

  async function handleAdvance() {
    if (!user || !projectId || !sceneId) return
    await updateSceneState(user.uid, projectId, sceneId, 'community_theater_in_progress')
    navigate(`/project/${projectId}/scene/${sceneId}/community-theater`)
  }

  const activeCharacter = characters.find((c) => c.id === activeCharacterId) || null
  const isComplete = outlineIsComplete({
    characters,
    settingPlot,
    completedAt: null,
  })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4">
        <Link
          to={`/project/${projectId}`}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors shrink-0"
        >
          ← Scenes
        </Link>
        <span className="text-zinc-700">|</span>
        <div className="flex-1 min-w-0">
          <ProgressDots state={scene?.state || 'untouched'} projectId={projectId} sceneId={sceneId} />
        </div>
      </header>

      {/* Scene header */}
      <div className="border-b border-zinc-800 px-8 py-4">
        <input
          value={headerValue}
          onChange={(e) => setHeaderValue(e.target.value)}
          onBlur={(e) => setHeaderValue(e.target.value.toUpperCase())}
          placeholder="INT. LOCATION — DAY"
          className="w-full bg-transparent text-zinc-100 font-mono text-lg font-semibold placeholder-zinc-700 outline-none uppercase tracking-wide"
        />
      </div>

      {/* Character pills row */}
      <div className="border-b border-zinc-800 px-8 py-3 flex items-center gap-2 flex-wrap">
        <span className="text-zinc-600 text-xs uppercase tracking-widest font-medium mr-1">Characters</span>

        {characters.map((char) => (
          <CharacterPill
            key={char.id}
            character={char}
            isActive={char.id === activeCharacterId}
            onSelect={() => setActiveCharacterId(char.id)}
            onRemove={() => removeCharacter(char.id)}
            onColorChange={(colorKey) =>
              setCharacters((prev) =>
                prev.map((c) => (c.id === char.id ? { ...c, color: colorKey } : c))
              )
            }
          />
        ))}

        {addingCharacter ? (
          <div className="flex items-center gap-1">
            <input
              ref={addInputRef}
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCharacter()
                if (e.key === 'Escape') { setAddingCharacter(false); setNewCharacterName('') }
              }}
              onBlur={() => { if (!newCharacterName.trim()) setAddingCharacter(false) }}
              placeholder="Character name..."
              className="bg-zinc-800 border border-zinc-600 rounded-full px-3 py-1 text-xs text-zinc-100 placeholder-zinc-500 outline-none w-36"
            />
            <button
              onClick={addCharacter}
              disabled={!newCharacterName.trim()}
              className="text-zinc-400 hover:text-zinc-200 text-xs px-2 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCharacter(true)}
            className="flex items-center gap-1 text-zinc-600 hover:text-zinc-400 text-xs border border-dashed border-zinc-700 hover:border-zinc-500 rounded-full px-3 py-1 transition-colors"
          >
            <span>+</span> Add character
          </button>
        )}
      </div>

      {/* Body */}
      {characters.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-zinc-500">No characters yet.</p>
            <button
              onClick={() => setAddingCharacter(true)}
              className="text-zinc-400 hover:text-zinc-200 text-sm underline underline-offset-4 transition-colors"
            >
              Add your first character
            </button>
          </div>
        </div>
      ) : activeCharacter ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left — questions */}
          <div className="flex-[3] overflow-y-auto px-8 py-8 space-y-8 border-r border-zinc-800">
            {CHARACTER_QUESTIONS.map((q) => (
              <div
                key={q.key}
                className={q.distinct ? 'bg-zinc-900 border border-zinc-700 rounded-xl p-5' : 'space-y-2'}
              >
                <label className={`block text-xs font-semibold uppercase tracking-widest ${q.distinct ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {q.label}
                </label>
                <textarea
                  value={activeCharacter[q.key]}
                  onChange={(e) => updateCharacterField(activeCharacter.id, q.key, e.target.value)}
                  placeholder={q.prompt}
                  rows={3}
                  className={`w-full bg-transparent text-zinc-200 placeholder-zinc-700 text-sm leading-relaxed outline-none resize-none transition-colors ${
                    q.distinct ? 'mt-2' : 'border-b border-zinc-800 pb-2 focus:border-zinc-600'
                  }`}
                />
              </div>
            ))}

            {/* Setting / Plot — shared */}
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Setting / Plot
              </label>
              <textarea
                value={settingPlot}
                onChange={(e) => setSettingPlot(e.target.value)}
                placeholder="Where are we? What plot machinery is moving?"
                rows={3}
                className="w-full bg-transparent text-zinc-200 placeholder-zinc-700 text-sm leading-relaxed outline-none resize-none border-b border-zinc-800 pb-2 focus:border-zinc-600 transition-colors"
              />
            </div>

            {/* Advance */}
            <div className="pb-8 flex justify-end">
              {isComplete ? (
                <button
                  onClick={handleAdvance}
                  className="flex items-center gap-2 bg-zinc-100 text-zinc-900 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white transition-colors"
                >
                  Community Theater Pass →
                </button>
              ) : (
                <p className="text-zinc-600 text-xs">
                  Complete all characters + setting to continue →
                </p>
              )}
            </div>
          </div>

          {/* Right — other characters' summaries */}
          <div className="flex-[2] overflow-y-auto px-6 py-8 space-y-8">
            {characters.filter((c) => c.id !== activeCharacterId).length === 0 ? (
              <div className="text-zinc-700 text-sm text-center pt-16">
                Add another character to see their arc here.
              </div>
            ) : (
              characters
                .filter((c) => c.id !== activeCharacterId)
                .map((c) => (
                  <CharacterSummary key={c.id} character={c} settingPlot={settingPlot} showSettingPlot={false} />
                ))
            )}
            {settingPlot && (
              <div className="pt-4 border-t border-zinc-800 space-y-1">
                <p className="text-zinc-600 text-xs font-medium uppercase tracking-wide">Setting / Plot</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{settingPlot}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CharacterPill({
  character,
  isActive,
  onSelect,
  onRemove,
  onColorChange,
}: {
  character: CharacterData
  isActive: boolean
  onSelect: () => void
  onRemove: () => void
  onColorChange: (colorKey: string | undefined) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const color = resolveCharColor(character.color)
  const style = isActive ? color.active : color.idle

  return (
    <div className="relative">
      <div
        style={{ background: style.background, color: style.color }}
        className="group flex items-center gap-1 rounded-full pl-2 pr-2 py-1 text-xs font-medium transition-all"
      >
        {/* Color dot — opens picker */}
        <button
          onClick={(e) => { e.stopPropagation(); setPickerOpen((o) => !o) }}
          title="Pick color"
          style={{ background: character.color ? COLOR_PALETTE.find(p => p.key === character.color)?.swatch : MONOCHROME.idle.color }}
          className="w-2.5 h-2.5 rounded-full shrink-0 opacity-60 hover:opacity-100 transition-opacity ring-1 ring-black/20"
        />

        {/* Name — selects character */}
        <button
          onClick={onSelect}
          className="px-1"
        >
          {character.name}
        </button>

        {/* Remove */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ color: style.color, opacity: 0.5 }}
          className="text-[10px] w-3.5 h-3.5 flex items-center justify-center hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>

      {/* Color picker popover */}
      {pickerOpen && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 min-w-max"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3">Color</p>

          <div className="flex items-center gap-2 mb-2">
            {/* No color */}
            <button
              onClick={() => { onColorChange(undefined); setPickerOpen(false) }}
              title="None"
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                !character.color ? 'border-white scale-110' : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ background: MONOCHROME.idle.background }}
            >
              <span style={{ color: MONOCHROME.idle.color }} className="text-[10px] font-bold leading-none select-none">—</span>
            </button>

            <div className="w-px h-6 bg-zinc-700 mx-1" />

            {/* Color swatches — two rows of 6 */}
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTE.map((entry) => (
                <button
                  key={entry.key}
                  onClick={() => { onColorChange(entry.key); setPickerOpen(false) }}
                  title={entry.label}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    character.color === entry.key ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ background: entry.swatch }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Close picker on outside click */}
      {pickerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
      )}
    </div>
  )
}

function CharacterSummary({
  character,
  settingPlot,
  showSettingPlot = true,
}: {
  character: CharacterData
  settingPlot: string
  showSettingPlot?: boolean
}) {
  const hasAny = character.want || character.comingFrom || character.realization || character.needsToGetThrough || character.whereNow

  if (!hasAny) {
    return (
      <div className="text-zinc-700 text-sm">
        {character.name}'s arc will appear here as you write.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium">
        {character.name}
      </p>

      {character.want && (
        <SummaryRow label="Wants" content={character.want} />
      )}
      {character.comingFrom && (
        <SummaryRow label="Coming from" content={character.comingFrom} />
      )}
      {character.realization && (
        <SummaryRow label="Realizes" content={character.realization} />
      )}
      {character.needsToGetThrough && (
        <SummaryRow label="Needs to get through" content={character.needsToGetThrough} />
      )}
      {character.whereNow && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-1">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">Where they land</p>
          <p className="text-zinc-200 text-sm leading-relaxed">{character.whereNow}</p>
        </div>
      )}
      {showSettingPlot && settingPlot && (
        <div className="pt-4 border-t border-zinc-800 space-y-1">
          <p className="text-zinc-600 text-xs font-medium uppercase tracking-wide">Setting / Plot</p>
          <p className="text-zinc-400 text-sm leading-relaxed">{settingPlot}</p>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, content }: { label: string; content: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-zinc-600 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-zinc-400 text-sm leading-relaxed">{content}</p>
    </div>
  )
}
