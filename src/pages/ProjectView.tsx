import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToScenes,
  createScene,
  deleteScene,
  reorderScenes,
  updateSceneHeader,
  type Scene,
} from '../lib/scenes'
import ProgressDots from '../components/ProgressDots'

function SortableSceneRow({
  scene,
  index,
  isActive,
  onSelect,
  onDelete,
}: {
  scene: Scene
  index: number
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
        isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing text-xs select-none"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </span>
      <span className="text-zinc-500 text-xs w-5 shrink-0">{index + 1}</span>
      <span className="text-zinc-300 text-xs truncate flex-1">
        {scene.sceneHeader || <span className="text-zinc-600 italic">Untitled</span>}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs transition-all"
      >
        ✕
      </button>
    </div>
  )
}

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scenes, setScenes] = useState<Scene[]>([])
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (!user || !projectId) return
    return subscribeToScenes(user.uid, projectId, setScenes)
  }, [user, projectId])

  async function handleAddScene() {
    if (!user || !projectId) return
    await createScene(user.uid, projectId, scenes.length)
  }

  async function handleDeleteScene(sceneId: string) {
    if (!user || !projectId) return
    await deleteScene(user.uid, projectId, sceneId)
    if (activeSceneId === sceneId) setActiveSceneId(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !user || !projectId) return
    const oldIndex = scenes.findIndex((s) => s.id === active.id)
    const newIndex = scenes.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(scenes, oldIndex, newIndex)
    setScenes(reordered)
    await reorderScenes(user.uid, projectId, reordered)
  }

  function openScene(sceneId: string) {
    navigate(`/project/${projectId}/scene/${sceneId}`)
  }

  async function handleRenameScene(sceneId: string, header: string) {
    if (!user || !projectId) return
    await updateSceneHeader(user.uid, projectId, sceneId, header.toUpperCase())
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Projects
        </Link>
        <span className="text-zinc-700">|</span>
        <h1 className="text-zinc-100 font-semibold text-base flex-1">Scene Outline</h1>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors opacity-50 cursor-not-allowed" disabled>
          Compile Script
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-800 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-zinc-400 text-xs uppercase tracking-widest font-medium">Scenes</span>
            <button
              onClick={handleAddScene}
              className="text-zinc-400 hover:text-zinc-200 text-lg leading-none transition-colors"
              title="Add scene"
            >
              +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {scenes.map((scene, index) => (
                  <SortableSceneRow
                    key={scene.id}
                    scene={scene}
                    index={index}
                    isActive={scene.id === activeSceneId}
                    onSelect={() => setActiveSceneId(scene.id)}
                    onDelete={() => handleDeleteScene(scene.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {scenes.length === 0 && (
              <p className="text-zinc-600 text-xs text-center py-8 px-4">
                No scenes yet. Click + to add one.
              </p>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8">
          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <p className="text-zinc-500 text-lg">No scenes yet.</p>
              <button
                onClick={handleAddScene}
                className="text-zinc-400 hover:text-zinc-200 text-sm underline underline-offset-4 transition-colors"
              >
                Add your first scene
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {scenes.map((scene, index) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  index={index}
                  projectId={projectId!}
                  onOpen={() => openScene(scene.id)}
                  onRename={(header) => handleRenameScene(scene.id, header)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function SceneCard({
  scene,
  index,
  projectId,
  onOpen,
  onRename,
}: {
  scene: Scene
  index: number
  projectId: string
  onOpen: () => void
  onRename: (header: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(scene.sceneHeader || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  // Keep draft in sync if scene updates externally while not editing
  useEffect(() => {
    if (!editing) setDraft(scene.sceneHeader || '')
  }, [scene.sceneHeader, editing])

  function commit() {
    const value = draft.trim().toUpperCase()
    setDraft(value)
    setEditing(false)
    onRename(value)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start justify-between gap-4 hover:border-zinc-700 transition-colors">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-zinc-600 text-sm font-mono shrink-0">{String(index + 1).padStart(2, '0')}</span>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.toUpperCase())}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') { setDraft(scene.sceneHeader || ''); setEditing(false) }
              }}
              placeholder="INT. LOCATION — DAY"
              className="flex-1 bg-transparent text-zinc-100 font-mono text-sm font-semibold placeholder-zinc-600 outline-none uppercase tracking-wide border-b border-zinc-600 focus:border-zinc-400 transition-colors"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex-1 text-left group flex items-center gap-2"
              title="Click to rename"
            >
              <span className="text-zinc-100 font-semibold text-sm font-mono truncate">
                {scene.sceneHeader || <span className="text-zinc-500 italic font-normal">Untitled scene</span>}
              </span>
              <span className="text-zinc-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                edit
              </span>
            </button>
          )}
        </div>
        <ProgressDots state={scene.state} projectId={projectId} sceneId={scene.id} />
      </div>
      <button
        onClick={onOpen}
        className="shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Open →
      </button>
    </div>
  )
}
