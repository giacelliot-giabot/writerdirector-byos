import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToProjects,
  createProject,
  renameProject,
  deleteProject,
  touchProject,
} from '../lib/projects'
import type { Project } from '../lib/projects'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    return subscribeToProjects(user.uid, setProjects)
  }, [user])

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus()
  }, [creating])

  async function handleCreate() {
    if (!user || !newTitle.trim()) return
    await createProject(user.uid, newTitle.trim())
    setNewTitle('')
    setCreating(false)
  }

  async function handleRename(id: string) {
    if (!user || !renameValue.trim()) return
    await renameProject(user.uid, id, renameValue.trim())
    setRenaming(null)
    setMenuOpen(null)
  }

  async function handleDelete(id: string) {
    if (!user) return
    await deleteProject(user.uid, id)
    setMenuOpen(null)
  }

  function formatDate(ts: Project['lastOpenedAt']) {
    if (!ts) return ''
    const d = ts.toDate()
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">writer/director</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCreating(true)}
            className="bg-zinc-100 text-zinc-900 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            + New Project
          </button>
          <button
            onClick={() => signOut(auth)}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {/* New project input */}
        {creating && (
          <div className="mb-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex gap-3 items-center">
            <input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
              }}
              placeholder="Project title..."
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none text-sm"
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="bg-zinc-100 text-zinc-900 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewTitle('') }}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {projects.length === 0 && !creating ? (
          <div className="flex flex-col items-center justify-center gap-4 mt-32 text-center">
            <p className="text-zinc-500 text-lg">No projects yet.</p>
            <button
              onClick={() => setCreating(true)}
              className="text-zinc-400 hover:text-zinc-200 text-sm underline underline-offset-4 transition-colors"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors group"
              >
                {/* Card content */}
                {renaming === project.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(project.id)
                      if (e.key === 'Escape') setRenaming(null)
                    }}
                    onBlur={() => handleRename(project.id)}
                    className="bg-transparent text-zinc-100 font-semibold text-base outline-none border-b border-zinc-600 pb-0.5"
                  />
                ) : (
                  <h2 className="font-semibold text-base text-zinc-100 truncate pr-6">
                    {project.title}
                  </h2>
                )}

                <div className="flex flex-col gap-0.5">
                  <p className="text-zinc-500 text-xs">
                    Last opened {formatDate(project.lastOpenedAt)}
                  </p>
                  <p className="text-zinc-600 text-xs">
                    Created {formatDate(project.createdAt)}
                  </p>
                </div>

                <button
                  onClick={async () => {
                    if (!user) return
                    await touchProject(user.uid, project.id)
                    navigate(`/project/${project.id}`)
                  }}
                  className="mt-auto self-start bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Open →
                </button>

                {/* Context menu trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(menuOpen === project.id ? null : project.id)
                  }}
                  className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ···
                </button>

                {/* Context menu */}
                {menuOpen === project.id && (
                  <div className="absolute top-10 right-4 z-10 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                    <button
                      onClick={() => {
                        setRenaming(project.id)
                        setRenameValue(project.title)
                        setMenuOpen(null)
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Click-outside to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  )
}
