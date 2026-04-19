import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToScenes,
  updateCommunityTheaterContent,
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

export default function CommunityTheater() {
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
        const content = found.communityTheater?.content ?? []
        // Always start with at least one action block so there's something to type in
        setBlocks(
          content.length > 0
            ? content
            : [{ id: crypto.randomUUID(), type: 'scene_heading' as const, text: '' }]
        )
      }
    })
  }, [user, projectId, sceneId])

  // Debounced save
  useEffect(() => {
    if (!initializedRef.current || !user || !projectId || !sceneId) return
    const hasContent = debouncedBlocks.some((b) => b.text.trim().length > 0)
    const newState = hasContent ? 'community_theater_in_progress' : 'community_theater_in_progress'
    updateCommunityTheaterContent(user.uid, projectId, sceneId, debouncedBlocks, newState)
  }, [debouncedBlocks, user, projectId, sceneId])

  // 30-second interval save
  useEffect(() => {
    if (!user || !projectId || !sceneId) return
    saveTimer.current = setInterval(() => {
      updateCommunityTheaterContent(user.uid!, projectId!, sceneId!, blocks)
    }, 30000)
    return () => { if (saveTimer.current) clearInterval(saveTimer.current) }
  }, [user, projectId, sceneId, blocks])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === '\\') { e.preventDefault(); setPanelOpen((o) => !o) }
      if (meta && e.key === 'ArrowRight') { e.preventDefault(); handleAdvance() }
      if (meta && e.key === 'ArrowLeft') { e.preventDefault(); navigate(`/project/${projectId}`) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [projectId, sceneId, blocks])

  async function handleAdvance() {
    if (!user || !projectId || !sceneId) return
    await updateCommunityTheaterContent(user.uid, projectId, sceneId, blocks, 'community_theater_complete')
    await updateSceneState(user.uid, projectId, sceneId, 'liars_pass_in_progress')
    navigate(`/project/${projectId}/scene/${sceneId}/liars-pass`)
  }

  const hasContent = blocks.some((b) => b.text.trim().length > 0)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4">
        <Link to={`/project/${projectId}`} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors shrink-0">
          ← Scenes
        </Link>
        <span className="text-zinc-700">|</span>
        <div className="flex-1">
          <ProgressDots state={scene?.state ?? 'community_theater_in_progress'} projectId={projectId} sceneId={sceneId} />
        </div>
        <span className="text-zinc-600 text-xs">{scene?.sceneHeader}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — outline reference */}
        {panelOpen && (
          <aside className="w-72 shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-medium">Your Outline</span>
              <button onClick={() => setPanelOpen(false)} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
                ←
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              {scene?.outline && <OutlineReference outline={scene.outline} />}
            </div>
          </aside>
        )}

        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="w-8 border-r border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 transition-colors shrink-0"
            title="Show outline (Cmd+\)"
          >
            <span className="rotate-90 text-xs">▶</span>
          </button>
        )}

        {/* Right panel — script editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Pass banner */}
          <div className="bg-amber-950/40 border-b border-amber-900/40 px-8 py-3">
            <p className="text-amber-300 font-bold text-xs uppercase tracking-widest">Community Theater Pass</p>
            <p className="text-amber-600 text-xs mt-0.5">Everyone says exactly what they mean. Make it obvious.</p>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto px-8 py-8 relative lg:pl-32">
            <ScriptEditor blocks={blocks} onChange={setBlocks} />
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800 px-8 py-3 flex items-center justify-between">
            <span className="text-zinc-700 text-xs">Auto-saves as you write · Cmd+\ toggles outline</span>
            {hasContent ? (
              <button
                onClick={handleAdvance}
                className="flex items-center gap-2 bg-zinc-100 text-zinc-900 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-white transition-colors"
              >
                Liars Pass →
              </button>
            ) : (
              <span className="text-zinc-700 text-xs">Write the scene to continue →</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
