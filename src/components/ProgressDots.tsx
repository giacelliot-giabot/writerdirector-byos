import { useNavigate } from 'react-router-dom'
import type { SceneState } from '../lib/scenes'

interface Props {
  state: SceneState
  projectId?: string
  sceneId?: string
}

const dots = [
  {
    label: 'Emotional Outline',
    path: (pid: string, sid: string) => `/project/${pid}/scene/${sid}`,
    activeStates: ['outline_in_progress', 'outline_complete', 'community_theater_in_progress', 'community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete'],
  },
  {
    label: 'Community Theater',
    path: (pid: string, sid: string) => `/project/${pid}/scene/${sid}/community-theater`,
    activeStates: ['community_theater_in_progress', 'community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete'],
  },
  {
    label: 'Liars Pass',
    path: (pid: string, sid: string) => `/project/${pid}/scene/${sid}/liars-pass`,
    activeStates: ['liars_pass_in_progress', 'liars_pass_complete'],
  },
]

const outlineCompletedStates = ['outline_complete', 'community_theater_in_progress', 'community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete']
const ctCompletedStates = ['community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete']

function dotStatus(index: number, state: SceneState): 'empty' | 'active' | 'complete' {
  if (index === 0) {
    if (outlineCompletedStates.includes(state)) return 'complete'
    if (dots[0].activeStates.includes(state)) return 'active'
  }
  if (index === 1) {
    if (ctCompletedStates.includes(state)) return 'complete'
    if (dots[1].activeStates.includes(state)) return 'active'
  }
  if (index === 2) {
    if (state === 'liars_pass_complete') return 'complete'
    if (state === 'liars_pass_in_progress') return 'active'
  }
  return 'empty'
}

// A dot is navigable if it's been reached OR the previous step is complete.
// outline_complete is included for LP so that clicking LP from CT works even
// during the brief window before the state update propagates from Firestore.
const navigableStates: Record<number, SceneState[]> = {
  0: ['outline_in_progress', 'outline_complete', 'community_theater_in_progress', 'community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete'],
  1: ['outline_complete', 'community_theater_in_progress', 'community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete'],
  2: ['outline_complete', 'community_theater_in_progress', 'community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete'],
}

export default function ProgressDots({ state, projectId, sceneId }: Props) {
  const navigate = useNavigate()

  function handleClick(i: number) {
    if (!projectId || !sceneId) return
    if (!navigableStates[i]?.includes(state)) return
    navigate(dots[i].path(projectId, sceneId))
  }

  return (
    <div className="flex items-center gap-6">
      {dots.map((dot, i) => {
        const status = dotStatus(i, state)
        const clickable = !!projectId && !!navigableStates[i]?.includes(state)
        return (
          <button
            key={dot.label}
            onClick={() => handleClick(i)}
            disabled={!clickable}
            className={`flex items-center gap-2 transition-opacity ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            title={dot.label}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                status === 'complete'
                  ? 'bg-zinc-100'
                  : status === 'active'
                  ? 'bg-zinc-100 ring-2 ring-zinc-500 ring-offset-2 ring-offset-zinc-950'
                  : 'bg-zinc-700'
              }`}
            />
            <span
              className={`text-xs transition-colors ${
                status === 'active'
                  ? 'text-zinc-200 font-medium'
                  : status === 'complete'
                  ? 'text-zinc-400'
                  : 'text-zinc-600'
              }`}
            >
              {dot.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
