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
  createDivider,
  deleteScene,
  reorderScenes,
  updateSceneHeader,
  updateScenePlot,
  updateDivider,
  isDivider,
  onlyScenes,
  type Scene,
} from '../lib/scenes'
import { resolveCharColor, COLOR_PALETTE, MONOCHROME } from '../lib/characterColors'
import ProgressDots from '../components/ProgressDots'
import CompileModal from '../components/CompileModal'

function SortableSceneRow({
  scene,
  sectionIndex,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  scene: Scene
  /** 1-based index within the current act/section. */
  sectionIndex: number
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (header: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: scene.id })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(scene.sceneHeader || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) setDraft(scene.sceneHeader || '')
  }, [scene.sceneHeader, editing])

  function commit() {
    const value = draft.trim().toUpperCase()
    setDraft(value)
    setEditing(false)
    onRename(value)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg group transition-colors ${
        isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => { if (!editing) onSelect() }}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing text-xs select-none shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </span>
      <span className="text-zinc-500 text-xs w-5 shrink-0">{sectionIndex}</span>
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
          onClick={(e) => e.stopPropagation()}
          placeholder="INT. LOCATION — DAY"
          className="flex-1 bg-transparent text-zinc-200 text-xs font-mono uppercase outline-none border-b border-zinc-600 focus:border-zinc-400 placeholder-zinc-600 transition-colors min-w-0"
        />
      ) : (
        <span
          className="text-zinc-300 text-xs truncate flex-1 cursor-text"
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          title="Double-click to rename"
        >
          {scene.sceneHeader || <span className="text-zinc-600 italic">Untitled</span>}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs transition-all shrink-0"
      >
        ✕
      </button>
    </div>
  )
}

function SortableDividerRow({
  divider,
  onDelete,
  onLabelChange,
}: {
  divider: Scene
  onDelete: () => void
  onLabelChange: (label: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: divider.id })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(divider.label || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) setDraft(divider.label || '')
  }, [divider.label, editing])

  function commit() {
    setEditing(false)
    onLabelChange(draft.trim())
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const accent = divider.color
    ? COLOR_PALETTE.find((p) => p.key === divider.color)?.swatch
    : undefined
  const labelColor = accent ?? '#71717a'
  const ruleColor = accent ?? '#3f3f46'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 px-2 py-2 group ${isDragging ? 'opacity-50' : ''}`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing text-xs select-none shrink-0"
      >
        ⠿
      </span>
      <div className="flex-1 border-t min-w-0" style={{ borderColor: ruleColor }} />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(divider.label || ''); setEditing(false) }
          }}
          placeholder="Act One, Midpoint…"
          className="bg-transparent text-[10px] uppercase tracking-widest font-semibold outline-none border-b text-center min-w-0 w-20 placeholder-zinc-700 transition-colors"
          style={{ color: labelColor, borderColor: labelColor }}
        />
      ) : (
        <span
          className="text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap cursor-text hover:opacity-80 transition-opacity"
          style={{ color: labelColor }}
          onDoubleClick={() => setEditing(true)}
          title="Double-click to rename"
        >
          {divider.label?.trim() || <span className="opacity-40 italic">Untitled</span>}
        </span>
      )}
      <div className="flex-1 border-t min-w-0" style={{ borderColor: ruleColor }} />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 text-xs transition-all shrink-0"
      >
        ✕
      </button>
    </div>
  )
}

function getSceneCharacters(scene: Scene): string[] {
  if (isDivider(scene)) return []
  const fromOutline = (scene.outline?.characters ?? [])
    .map((c) => c.name.trim().toUpperCase())
    .filter(Boolean)

  const fromScript = [
    ...(scene.communityTheater?.content ?? []),
    ...(scene.liarsPass?.content ?? []),
  ]
    .filter((el) => el.type === 'character')
    .map((el) => el.text.trim().toUpperCase())
    .filter(Boolean)

  return Array.from(new Set([...fromOutline, ...fromScript]))
}

/**
 * Walk the ordered list and assign each scene its position within the current
 * act/section (counter resets at every divider). Dividers themselves get null.
 */
function computeSectionIndices(items: Scene[]): Map<string, number> {
  const map = new Map<string, number>()
  let counter = 0
  for (const it of items) {
    if (isDivider(it)) {
      counter = 0
      continue
    }
    counter += 1
    map.set(it.id, counter)
  }
  return map
}

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scenes, setScenes] = useState<Scene[]>([])
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [showCompile, setShowCompile] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const isResizing = useRef(false)
  const sceneCardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  function scrollToScene(sceneId: string) {
    setActiveSceneId(sceneId)
    const el = sceneCardRefs.current.get(sceneId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function startSidebarResize(e: React.MouseEvent) {
    isResizing.current = true
    e.preventDefault()
    function onMouseMove(ev: MouseEvent) {
      if (!isResizing.current) return
      setSidebarWidth(Math.max(160, Math.min(480, ev.clientX)))
    }
    function onMouseUp() {
      isResizing.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

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

  async function handleAddDivider() {
    if (!user || !projectId) return
    await createDivider(user.uid, projectId, scenes.length)
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

  async function handleDividerLabelChange(id: string, label: string) {
    if (!user || !projectId) return
    await updateDivider(user.uid, projectId, id, { label })
  }

  async function handleDividerColorChange(id: string, color: string | null) {
    if (!user || !projectId) return
    await updateDivider(user.uid, projectId, id, { color })
  }

  // All unique characters across all scenes, in order of first appearance.
  // Dividers contribute none (handled in getSceneCharacters).
  const allCharacters = Array.from(
    new Set(scenes.flatMap(getSceneCharacters))
  )

  // name → stored color key, keyed by uppercase name for case-insensitive lookup
  const charColorMap = new Map<string, string | undefined>(
    scenes.flatMap((s) =>
      isDivider(s)
        ? []
        : (s.outline?.characters ?? []).map((c) => [c.name.trim().toUpperCase(), c.color])
    )
  )

  // 1-based position within each act/section. Resets at every divider.
  const sectionIndices = computeSectionIndices(scenes)

  // When filtering by a character, hide dividers too — otherwise the page
  // becomes a stack of bare break-bars between filtered scenes.
  const filteredScenes = selectedCharacter
    ? scenes.filter((s) => !isDivider(s) && getSceneCharacters(s).includes(selectedCharacter))
    : scenes

  // Compile gate must only consider real scenes — dividers have no Liars Pass.
  const realScenes = onlyScenes(scenes)
  const hasScenes = realScenes.length > 0
  const compileReady = hasScenes && realScenes.every((s) => s.state === 'liars_pass_complete')

  function openScene(scene: Scene) {
    const base = `/project/${projectId}/scene/${scene.id}`
    if (['liars_pass_in_progress', 'liars_pass_complete'].includes(scene.state)) {
      navigate(`${base}/liars-pass`)
    } else if (['community_theater_in_progress', 'community_theater_complete'].includes(scene.state)) {
      navigate(`${base}/community-theater`)
    } else {
      navigate(base)
    }
  }

  async function handleRenameScene(sceneId: string, header: string) {
    if (!user || !projectId) return
    await updateSceneHeader(user.uid, projectId, sceneId, header.toUpperCase())
  }

  async function handleDescriptionChange(sceneId: string, description: string) {
    if (!user || !projectId) return
    await updateScenePlot(user.uid, projectId, sceneId, description)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-start gap-4 shrink-0">
        <Link
          to="/"
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors mt-0.5 shrink-0"
        >
          ← Projects
        </Link>
        <span className="text-zinc-700 mt-0.5">|</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-zinc-100 font-semibold text-base">Plot Your Beats</h1>
          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">
            What happens, in what order? Lay out every beat as a card. Add act breaks or
            midpoints to mark structure. When you're ready to dive into a scene, hit Open.
          </p>
        </div>
        <button
          onClick={() => setShowCompile(true)}
          disabled={!compileReady}
          title={
            !hasScenes
              ? 'Add scenes first'
              : !compileReady
              ? 'Complete the Liars Pass for all scenes to compile'
              : undefined
          }
          className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          Compile Script
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className="border-r border-zinc-800 flex flex-col shrink-0 relative"
          style={{ width: sidebarWidth }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <span className="text-zinc-400 text-xs uppercase tracking-widest font-medium">Beats</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddScene}
                className="text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                title="Add scene card"
              >
                + Scene
              </button>
              <button
                onClick={handleAddDivider}
                className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                title="Add act break or midpoint divider"
              >
                + Break
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2 min-h-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {scenes.map((scene) =>
                  isDivider(scene) ? (
                    <SortableDividerRow
                      key={scene.id}
                      divider={scene}
                      onDelete={() => handleDeleteScene(scene.id)}
                      onLabelChange={(label) => handleDividerLabelChange(scene.id, label)}
                    />
                  ) : (
                    <SortableSceneRow
                      key={scene.id}
                      scene={scene}
                      sectionIndex={sectionIndices.get(scene.id) ?? 0}
                      isActive={scene.id === activeSceneId}
                      onSelect={() => scrollToScene(scene.id)}
                      onDelete={() => handleDeleteScene(scene.id)}
                      onRename={(header) => handleRenameScene(scene.id, header)}
                    />
                  )
                )}
              </SortableContext>
            </DndContext>

            {scenes.length === 0 && (
              <p className="text-zinc-600 text-xs text-center py-8 px-4">
                No beats yet. Click + Scene to add one.
              </p>
            )}
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={startSidebarResize}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-zinc-600 active:bg-zinc-500 transition-colors group"
            title="Drag to resize"
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8">
          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-md mx-auto">
              <div className="space-y-2">
                <p className="text-zinc-300 text-lg font-medium">Start with the beats.</p>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Lay out what happens in your story, in order. One card per beat.
                  Drop in act breaks or a midpoint to mark the structure.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddScene}
                  className="bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  + Add first beat
                </button>
                <button
                  onClick={handleAddDivider}
                  className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
                >
                  + Add break
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Character filter strip */}
              {allCharacters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {allCharacters.map((name) => {
                    const active = selectedCharacter === name
                    const color = resolveCharColor(charColorMap.get(name))
                    const style = active ? color.active : color.idle
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedCharacter(active ? null : name)}
                        style={{ background: style.background, color: style.color }}
                        className="px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-all"
                      >
                        {name}
                      </button>
                    )
                  })}
                  {selectedCharacter && (
                    <button
                      onClick={() => setSelectedCharacter(null)}
                      className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors ml-1"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {filteredScenes.map((scene) =>
                      isDivider(scene) ? (
                        <SortableDividerBar
                          key={scene.id}
                          divider={scene}
                          onLabelChange={(label) => handleDividerLabelChange(scene.id, label)}
                          onColorChange={(color) => handleDividerColorChange(scene.id, color)}
                          onDelete={() => handleDeleteScene(scene.id)}
                        />
                      ) : (
                        <SortableSceneCard
                          key={scene.id}
                          scene={scene}
                          sectionIndex={sectionIndices.get(scene.id) ?? 0}
                          projectId={projectId!}
                          onOpen={() => openScene(scene)}
                          onRename={(header) => handleRenameScene(scene.id, header)}
                          onDescriptionChange={(desc) => handleDescriptionChange(scene.id, desc)}
                          highlightCharacter={selectedCharacter}
                          charColorMap={charColorMap}
                          isActive={scene.id === activeSceneId}
                          cardRef={(el) => {
                            if (el) sceneCardRefs.current.set(scene.id, el)
                            else sceneCardRefs.current.delete(scene.id)
                          }}
                        />
                      )
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              {filteredScenes.length === 0 && selectedCharacter && (
                <p className="text-zinc-600 text-sm text-center py-8">
                  No scenes with <span className="text-zinc-400">{selectedCharacter}</span>.
                </p>
              )}

              {/* Bottom-of-list add controls — keeps users on the page */}
              {!selectedCharacter && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleAddScene}
                    className="text-zinc-400 hover:text-zinc-200 text-sm border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg px-4 py-2 transition-colors"
                  >
                    + Add scene beat
                  </button>
                  <button
                    onClick={handleAddDivider}
                    className="text-zinc-500 hover:text-zinc-300 text-sm border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg px-4 py-2 transition-colors"
                  >
                    + Add break
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {showCompile && (
        <CompileModal
          scenes={scenes}
          onClose={() => setShowCompile(false)}
        />
      )}
    </div>
  )
}

function SortableSceneCard(props: {
  scene: Scene
  sectionIndex: number
  projectId: string
  onOpen: () => void
  onRename: (header: string) => void
  onDescriptionChange: (desc: string) => void
  highlightCharacter?: string | null
  charColorMap?: Map<string, string | undefined>
  isActive?: boolean
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        props.cardRef?.(el)
      }}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
    >
      <SceneCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function SceneCard({
  scene,
  sectionIndex,
  projectId,
  onOpen,
  onRename,
  onDescriptionChange,
  dragHandleProps,
  highlightCharacter,
  charColorMap,
  isActive,
}: {
  scene: Scene
  sectionIndex: number
  projectId: string
  onOpen: () => void
  onRename: (header: string) => void
  onDescriptionChange: (desc: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
  highlightCharacter?: string | null
  charColorMap?: Map<string, string | undefined>
  isActive?: boolean
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(scene.sceneHeader || '')
  const [description, setDescription] = useState(scene.outline?.settingPlot || '')
  const inputRef = useRef<HTMLInputElement>(null)
  const characters = getSceneCharacters(scene)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) setDraft(scene.sceneHeader || '')
  }, [scene.sceneHeader, editing])

  // Sync description from external updates only if not currently focused
  const descFocused = useRef(false)
  useEffect(() => {
    if (!descFocused.current) setDescription(scene.outline?.settingPlot || '')
  }, [scene.outline?.settingPlot])

  function commit() {
    const value = draft.trim().toUpperCase()
    setDraft(value)
    setEditing(false)
    onRename(value)
  }

  function commitDescription() {
    descFocused.current = false
    onDescriptionChange(description)
  }

  return (
    <div className={`bg-zinc-900 border rounded-xl p-4 flex items-start justify-between gap-4 transition-colors group/card ${isActive ? 'border-zinc-500 ring-1 ring-zinc-500/30' : 'border-zinc-800 hover:border-zinc-700'}`}>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <span
            {...dragHandleProps}
            className="text-zinc-700 hover:text-zinc-500 cursor-grab active:cursor-grabbing text-sm select-none shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity"
            title="Drag to reorder"
          >
            ⠿
          </span>
          <span className="text-zinc-600 text-xs font-mono shrink-0">{String(sectionIndex).padStart(2, '0')}</span>
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

        {/* Description / Setting / Plot */}
        <textarea
          value={description}
          rows={1}
          placeholder="What happens in this scene…"
          onChange={(e) => {
            setDescription(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onFocus={(e) => {
            descFocused.current = true
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onBlur={commitDescription}
          className="w-full bg-transparent text-zinc-400 placeholder-zinc-700 text-sm leading-relaxed outline-none resize-none overflow-hidden transition-colors focus:text-zinc-200"
          style={{ height: 'auto', minHeight: '1.5rem' }}
        />

        {/* Characters + progress on one row */}
        <div className="flex items-center gap-2 flex-wrap">
          <ProgressDots state={scene.state} projectId={projectId} sceneId={scene.id} compact />
          {characters.length > 0 && (
            <span className="text-zinc-700 text-xs select-none">·</span>
          )}
          {characters.map((name) => {
            const color = resolveCharColor(charColorMap?.get(name))
            const style = highlightCharacter === name ? color.active : color.idle
            return (
              <span
                key={name}
                style={{ background: style.background, color: style.color }}
                className="px-2 py-0.5 rounded-full text-xs font-medium tracking-wide"
              >
                {name}
              </span>
            )
          })}
        </div>
      </div>
      {/*
        Open button: visually de-emphasized for untouched scenes so the page
        reads as "stay here and plot beats" rather than "click in immediately".
        Once any work has started, the bordered button comes back so users
        can resume quickly.
      */}
      <button
        onClick={onOpen}
        className={
          scene.state === 'untouched'
            ? 'shrink-0 text-zinc-700 hover:text-zinc-300 text-xs font-medium px-2 py-1.5 transition-colors mt-0.5 opacity-0 group-hover/card:opacity-100'
            : 'shrink-0 text-zinc-500 hover:text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors mt-0.5'
        }
        title={scene.state === 'untouched' ? 'Open and start outlining this scene' : 'Continue outlining'}
      >
        Open →
      </button>
    </div>
  )
}

function SortableDividerBar(props: {
  divider: Scene
  onLabelChange: (label: string) => void
  onColorChange: (color: string | null) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.divider.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <DividerBar {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function DividerBar({
  divider,
  onLabelChange,
  onColorChange,
  onDelete,
  dragHandleProps,
}: {
  divider: Scene
  onLabelChange: (label: string) => void
  onColorChange: (color: string | null) => void
  onDelete: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(divider.label || '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) setDraft(divider.label || '')
  }, [divider.label, editing])

  function commit() {
    setEditing(false)
    onLabelChange(draft.trim())
  }

  const accent = divider.color
    ? COLOR_PALETTE.find((p) => p.key === divider.color)?.swatch
    : undefined
  const labelColor = accent ?? '#71717a'
  const ruleColor = accent ?? '#3f3f46'

  return (
    <div className="group/divider flex items-center gap-2 py-3 select-none">
      {/* Drag handle */}
      <span
        {...dragHandleProps}
        className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing text-sm shrink-0 opacity-0 group-hover/divider:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        ⠿
      </span>

      {/* Color dot — opens picker */}
      <button
        onClick={() => setPickerOpen((o) => !o)}
        className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/20 opacity-60 hover:opacity-100 transition-opacity relative"
        style={{ background: accent ?? MONOCHROME.idle.color }}
        title="Pick accent color"
      >
        {pickerOpen && (
          <div
            className="absolute top-full left-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3">Accent</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onColorChange(null); setPickerOpen(false) }}
                title="None"
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                  !divider.color ? 'border-white scale-110' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                style={{ background: MONOCHROME.idle.background }}
              >
                <span style={{ color: MONOCHROME.idle.color }} className="text-[10px] font-bold leading-none">—</span>
              </button>
              <div className="w-px h-6 bg-zinc-700 mx-1" />
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PALETTE.map((entry) => (
                  <button
                    key={entry.key}
                    onClick={() => { onColorChange(entry.key); setPickerOpen(false) }}
                    title={entry.label}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                      divider.color === entry.key ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ background: entry.swatch }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </button>
      {pickerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
      )}

      {/* Left rule */}
      <div className="flex-1 border-t" style={{ borderColor: ruleColor }} />

      {/* Label — click to edit */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(divider.label || ''); setEditing(false) }
          }}
          placeholder="e.g. Act One, Midpoint, Climax"
          className="bg-transparent text-center text-xs uppercase tracking-widest font-semibold outline-none border-b border-zinc-600 focus:border-zinc-400 px-2 py-0.5 min-w-[8rem]"
          style={{ color: labelColor }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-xs uppercase tracking-widest font-semibold whitespace-nowrap px-2 py-0.5 hover:text-zinc-100 transition-colors"
          style={{ color: labelColor }}
          title="Click to rename"
        >
          {divider.label?.trim() || (
            <span className="italic opacity-70">Untitled break</span>
          )}
        </button>
      )}

      {/* Right rule */}
      <div className="flex-1 border-t" style={{ borderColor: ruleColor }} />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="text-zinc-700 hover:text-red-400 text-xs shrink-0 opacity-0 group-hover/divider:opacity-100 transition-all"
        title="Delete break"
      >
        ✕
      </button>
    </div>
  )
}
