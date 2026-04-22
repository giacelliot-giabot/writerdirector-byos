import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToScenes,
  updateLiarsPassContent,
  updateSceneState,
  type Scene,
  type ScriptElement,
} from '../lib/scenes'
import ScriptEditor from '../components/ScriptEditor'
import OutlineReference from '../components/OutlineReference'
import ProgressDots from '../components/ProgressDots'

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

export default function LiarsPass() {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [scene, setScene] = useState<Scene | null>(null)
  const [blocks, setBlocks] = useState<ScriptElement[]>([])
  const [panelOpen, setPanelOpen] = useState(true)
  const initializedRef = useRef(false)

  const debouncedBlocks = useDebounce(blocks, 1000)
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user || !projectId) return
    return subscribeToScenes(user.uid, projectId, (scenes) => {
      const found = scenes.find((s) => s.id === sceneId)
      if (!found) return
      setScene(found)
      if (!initializedRef.current) {
        initializedRef.current = true
        const content = found.liarsPass?.content ?? []
        setBlocks(
          content.length > 0
            ? content
            : [{ id: crypto.randomUUID(), type: 'scene_heading' as const, text: '' }]
        )
        // Advance state to LP regardless of how the user got here
        if (!['liars_pass_in_progress', 'liars_pass_complete'].includes(found.state)) {
          updateSceneState(user.uid, projectId!, sceneId!, 'liars_pass_in_progress')
        }
      }
    })
  }, [user, projectId, sceneId])

  // Debounced save
  useEffect(() => {
    if (!initializedRef.current || !user || !projectId || !sceneId) return
    const hasContent = debouncedBlocks.some((b) => b.text.trim().length > 0)
    const newState = hasContent ? 'liars_pass_complete' : 'liars_pass_in_progress'
    updateLiarsPassContent(user.uid, projectId, sceneId, debouncedBlocks, newState)
  }, [debouncedBlocks, user, projectId, sceneId])

  // 30-second interval save
  useEffect(() => {
    if (!user || !projectId || !sceneId) return
    saveTimer.current = setInterval(() => {
      updateLiarsPassContent(user.uid!, projectId!, sceneId!, blocks)
    }, 30000)
    return () => { if (saveTimer.current) clearInterval(saveTimer.current) }
  }, [user, projectId, sceneId, blocks])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === '\\') { e.preventDefault(); setPanelOpen((o) => !o) }
      if (meta && e.key === 'ArrowLeft') { e.preventDefault(); navigate(`/project/${projectId}`) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [projectId, sceneId])

  async function markComplete() {
    if (!user || !projectId || !sceneId) return
    await updateLiarsPassContent(user.uid, projectId, sceneId, blocks, 'liars_pass_complete')
    await updateSceneState(user.uid, projectId, sceneId, 'liars_pass_complete')
    navigate(`/project/${projectId}`)
  }

  const hasContent = blocks.some((b) => b.text.trim().length > 0)
  const ctBlocks = scene?.communityTheater?.content ?? []

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4">
        <Link to={`/project/${projectId}`} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors shrink-0">
          ← Scenes
        </Link>
        <span className="text-zinc-700">|</span>
        <div className="flex-1">
          <ProgressDots state={scene?.state ?? 'liars_pass_in_progress'} projectId={projectId} sceneId={sceneId} />
        </div>
        <span className="text-zinc-600 text-xs">{scene?.sceneHeader}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — outline + CT reference */}
        {panelOpen && (
          <aside className="w-72 shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-medium">Reference</span>
              <button onClick={() => setPanelOpen(false)} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
                ←
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* CT draft */}
              {ctBlocks.length > 0 && (
                <div className="px-4 pt-5 pb-4 border-b border-zinc-800">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-medium mb-3">Community Theater</p>
                  <div className="space-y-0.5 opacity-60">
                    {ctBlocks.map((block) => (
                      <CTBlockPreview key={block.id} block={block} />
                    ))}
                  </div>
                </div>
              )}

              {/* Outline */}
              <div className="px-4 pt-5 pb-8">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-medium mb-3">Your Outline</p>
                {scene?.outline && <OutlineReference outline={scene.outline} />}
              </div>
            </div>
          </aside>
        )}

        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="w-8 border-r border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 transition-colors shrink-0"
            title="Show reference (Cmd+\)"
          >
            <span className="rotate-90 text-xs">▶</span>
          </button>
        )}

        {/* Right panel — script editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Pass banner */}
          <div className="bg-blue-950/40 border-b border-blue-900/40 px-8 py-3">
            <p className="text-blue-300 font-bold text-xs uppercase tracking-widest">Liars Pass</p>
            <p className="text-blue-600 text-xs mt-0.5">People behave like people. Nobody says what they mean.</p>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto px-8 py-8 lg:pl-32">
            <ScriptEditor blocks={blocks} onChange={setBlocks} />
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800 px-8 py-3 flex items-center justify-between">
            <span className="text-zinc-700 text-xs">Auto-saves as you write · Cmd+\ toggles reference</span>
            {hasContent ? (
              <button
                onClick={markComplete}
                className="flex items-center gap-2 bg-zinc-100 text-zinc-900 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-white transition-colors"
              >
                Done — Back to Scenes ✓
              </button>
            ) : (
              <span className="text-zinc-700 text-xs">Write the real scene →</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact read-only screenplay preview for the CT reference panel
function CTBlockPreview({ block }: { block: ScriptElement }) {
  const styles: Record<ScriptElement['type'], string> = {
    scene_heading: 'font-mono text-[10px] font-bold uppercase text-zinc-400',
    action:        'font-mono text-[10px] text-zinc-500',
    character:     'font-mono text-[10px] uppercase text-zinc-400 pl-[37%]',
    dialogue:      'font-mono text-[10px] text-zinc-500 px-[17%]',
    parenthetical: 'font-mono text-[10px] italic text-zinc-500 pl-[27%]',
    transition:    'font-mono text-[10px] uppercase text-zinc-400 text-right',
  }
  return (
    <div className={`${styles[block.type]} leading-relaxed whitespace-pre-wrap w-full`}>
      {block.text || ' '}
    </div>
  )
}
