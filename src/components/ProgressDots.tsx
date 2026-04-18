import type { SceneState } from '../lib/scenes'

interface Props {
  state: SceneState
  onClick?: (dot: 0 | 1 | 2) => void
}

const dots = [
  { label: 'Emotional Outline', activeStates: ['outline_in_progress', 'outline_complete', 'community_theater_in_progress', 'community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete'] },
  { label: 'Community Theater', activeStates: ['community_theater_in_progress', 'community_theater_complete', 'liars_pass_in_progress', 'liars_pass_complete'] },
  { label: 'Liars Pass', activeStates: ['liars_pass_in_progress', 'liars_pass_complete'] },
]

const completedStates = [
  'outline_complete',
  'community_theater_in_progress',
  'community_theater_complete',
  'liars_pass_in_progress',
  'liars_pass_complete',
]

const ct_completedStates = [
  'community_theater_complete',
  'liars_pass_in_progress',
  'liars_pass_complete',
]

function dotStatus(index: number, state: SceneState): 'empty' | 'active' | 'complete' {
  if (index === 0) {
    if (completedStates.includes(state)) return 'complete'
    if (dots[0].activeStates.includes(state)) return 'active'
  }
  if (index === 1) {
    if (ct_completedStates.includes(state)) return 'complete'
    if (dots[1].activeStates.includes(state)) return 'active'
  }
  if (index === 2) {
    if (state === 'liars_pass_complete') return 'complete'
    if (state === 'liars_pass_in_progress') return 'active'
  }
  return 'empty'
}

export default function ProgressDots({ state, onClick }: Props) {
  return (
    <div className="flex items-center gap-6">
      {dots.map((dot, i) => {
        const status = dotStatus(i, state)
        return (
          <button
            key={dot.label}
            onClick={() => onClick?.(i as 0 | 1 | 2)}
            className="flex items-center gap-2 group"
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
