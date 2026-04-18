import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToScenes,
  updateSceneOutline,
  updateSceneHeader,
  updateSceneState,
  outlineIsComplete,
  type Scene,
  type SceneOutline as SceneOutlineType,
} from '../lib/scenes'
import ProgressDots from '../components/ProgressDots'

const OUTLINE_FIELDS: { key: keyof SceneOutlineType; label: string; prompt: string; distinct?: boolean }[] = [
  {
    key: 'characters',
    label: 'Characters & What They Want',
    prompt: 'Who are the characters and what is the big, insane thing they want?',
  },
  {
    key: 'interaction',
    label: 'How They Interact',
    prompt: 'How do they interact?',
  },
  {
    key: 'actuallyGets',
    label: 'What They Actually Get',
    prompt: 'What do they actually get at the end?',
  },
  {
    key: 'sceneTheyThinkTheyreIn',
    label: 'The Scene They Think They\'re In',
    prompt: 'What scene do they think they\'re in?',
  },
  {
    key: 'momentOfRealization',
    label: 'The Moment of Realization',
    prompt: 'What\'s the moment they realize they\'re not in that scene?',
  },
  {
    key: 'whatGetsThemThrough',
    label: 'What Gets Them Through',
    prompt: 'What do they need to get through the end of the scene?',
  },
  {
    key: 'settingPlot',
    label: 'Setting / Plot',
    prompt: 'Where are we, and what plot machinery is moving?',
  },
  {
    key: 'whereCharacterEnds',
    label: 'Where Is the Character Now',
    prompt: 'Where does this leave the character?',
    distinct: true,
  },
]

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function SceneOutline() {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [scene, setScene] = useState<Scene | null>(null)
  const [headerValue, setHeaderValue] = useState('')
  const [outlineValues, setOutlineValues] = useState<Omit<SceneOutlineType, 'completedAt'>>({
    characters: '',
    interaction: '',
    actuallyGets: '',
    sceneTheyThinkTheyreIn: '',
    momentOfRealization: '',
    whatGetsThemThrough: '',
    settingPlot: '',
    whereCharacterEnds: '',
  })
  const [initialized, setInitialized] = useState(false)

  const debouncedHeader = useDebounce(headerValue, 600)
  const debouncedOutline = useDebounce(outlineValues, 800)

  useEffect(() => {
    if (!user || !projectId) return
    return subscribeToScenes(user.uid, projectId, (scenes) => {
      const found = scenes.find((s) => s.id === sceneId)
      if (!found) return
      setScene(found)
      if (!initialized) {
        setHeaderValue(found.sceneHeader || '')
        setOutlineValues({
          characters: found.outline?.characters || '',
          interaction: found.outline?.interaction || '',
          actuallyGets: found.outline?.actuallyGets || '',
          sceneTheyThinkTheyreIn: found.outline?.sceneTheyThinkTheyreIn || '',
          momentOfRealization: found.outline?.momentOfRealization || '',
          whatGetsThemThrough: found.outline?.whatGetsThemThrough || '',
          settingPlot: found.outline?.settingPlot || '',
          whereCharacterEnds: found.outline?.whereCharacterEnds || '',
        })
        setInitialized(true)
      }
    })
  }, [user, projectId, sceneId, initialized])

  // Save header
  useEffect(() => {
    if (!initialized || !user || !projectId || !sceneId) return
    updateSceneHeader(user.uid, projectId, sceneId, debouncedHeader.toUpperCase())
  }, [debouncedHeader, initialized, user, projectId, sceneId])

  // Save outline fields + update state
  useEffect(() => {
    if (!initialized || !user || !projectId || !sceneId || !scene) return
    const complete = outlineIsComplete({ ...debouncedOutline, completedAt: null })
    const newState =
      complete ? 'outline_complete'
      : Object.values(debouncedOutline).some((v) => v.trim().length > 0)
      ? 'outline_in_progress'
      : 'untouched'

    updateSceneOutline(user.uid, projectId, sceneId, debouncedOutline, newState)
  }, [debouncedOutline, initialized, user, projectId, sceneId, scene])

  const handleFieldChange = useCallback(
    (key: keyof typeof outlineValues, value: string) => {
      setOutlineValues((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  async function handleAdvance() {
    if (!user || !projectId || !sceneId) return
    await updateSceneState(user.uid, projectId, sceneId, 'community_theater_in_progress')
    navigate(`/project/${projectId}/scene/${sceneId}/community-theater`)
  }

  const isComplete = outlineIsComplete({ ...outlineValues, completedAt: null })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4">
        <Link
          to={`/project/${projectId}`}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          ← Scenes
        </Link>
        <span className="text-zinc-700">|</span>
        <div className="flex-1">
          <ProgressDots state={scene?.state || 'untouched'} />
        </div>
      </header>

      {/* Scene header input */}
      <div className="border-b border-zinc-800 px-8 py-4">
        <input
          value={headerValue}
          onChange={(e) => setHeaderValue(e.target.value)}
          onBlur={(e) => setHeaderValue(e.target.value.toUpperCase())}
          placeholder="INT. LOCATION — DAY"
          className="w-full bg-transparent text-zinc-100 font-mono text-lg font-semibold placeholder-zinc-700 outline-none uppercase tracking-wide"
        />
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column — fields */}
        <div className="flex-[3] overflow-y-auto px-8 py-8 space-y-6 border-r border-zinc-800">
          {OUTLINE_FIELDS.map((field) => (
            <div
              key={field.key}
              className={`space-y-2 ${
                field.distinct
                  ? 'bg-zinc-900 border border-zinc-700 rounded-xl p-5 mt-8'
                  : ''
              }`}
            >
              <label className={`block text-xs font-semibold uppercase tracking-widest ${field.distinct ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {field.label}
              </label>
              <textarea
                value={outlineValues[field.key as keyof typeof outlineValues]}
                onChange={(e) => handleFieldChange(field.key as keyof typeof outlineValues, e.target.value)}
                placeholder={field.prompt}
                rows={3}
                className={`w-full bg-transparent text-zinc-200 placeholder-zinc-700 text-sm leading-relaxed outline-none resize-none ${
                  field.distinct ? '' : 'border-b border-zinc-800 pb-2 focus:border-zinc-600'
                } transition-colors`}
              />
            </div>
          ))}

          {/* Advance button */}
          <div className="pt-4 pb-8 flex justify-end">
            {isComplete ? (
              <button
                onClick={handleAdvance}
                className="flex items-center gap-2 bg-zinc-100 text-zinc-900 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white transition-colors"
              >
                Community Theater Pass →
              </button>
            ) : (
              <p className="text-zinc-600 text-xs">
                Fill in all 8 fields to continue →
              </p>
            )}
          </div>
        </div>

        {/* Right column — live summary */}
        <div className="flex-[2] overflow-y-auto px-6 py-8">
          <OutlineSummary values={outlineValues} />
        </div>
      </div>
    </div>
  )
}

function OutlineSummary({ values }: { values: Omit<SceneOutlineType, 'completedAt'> }) {
  const hasAny = Object.values(values).some((v) => v.trim().length > 0)

  if (!hasAny) {
    return (
      <div className="text-zinc-700 text-sm text-center pt-16">
        Your outline summary will appear here as you write.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium">Your Outline</p>

      {values.characters && (
        <SummaryCard label="Characters & Want" content={values.characters} />
      )}
      {values.interaction && (
        <SummaryCard label="How They Interact" content={values.interaction} />
      )}
      {values.actuallyGets && (
        <SummaryCard label="What They Actually Get" content={values.actuallyGets} />
      )}
      {values.sceneTheyThinkTheyreIn && (
        <SummaryCard label="The Scene They Think They're In" content={values.sceneTheyThinkTheyreIn} />
      )}
      {values.momentOfRealization && (
        <SummaryCard label="Moment of Realization" content={values.momentOfRealization} />
      )}
      {values.whatGetsThemThrough && (
        <SummaryCard label="What Gets Them Through" content={values.whatGetsThemThrough} />
      )}
      {values.settingPlot && (
        <SummaryCard label="Setting / Plot" content={values.settingPlot} />
      )}
      {values.whereCharacterEnds && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-1">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">Where We Land</p>
          <p className="text-zinc-200 text-sm leading-relaxed">{values.whereCharacterEnds}</p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, content }: { label: string; content: string }) {
  return (
    <div className="space-y-1">
      <p className="text-zinc-600 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-zinc-400 text-sm leading-relaxed">{content}</p>
    </div>
  )
}
