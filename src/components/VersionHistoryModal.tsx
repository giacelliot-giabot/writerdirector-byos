import { useState, useEffect } from 'react'
import {
  subscribeToSceneVersions,
  type SceneVersion,
  type ScriptElement,
} from '../lib/scenes'
import { useAuth } from '../context/AuthContext'

interface Props {
  projectId: string
  sceneId: string
  currentPass: 'communityTheater' | 'liarsPass'
  onRestore: (content: ScriptElement[]) => void
  onClose: () => void
}

const PASS_LABEL = {
  communityTheater: 'Community Theater',
  liarsPass: 'Liars Pass',
}

function formatDate(ts: SceneVersion['savedAt']): string {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date((ts as unknown as { seconds: number }).seconds * 1000)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function VersionHistoryModal({ projectId, sceneId, currentPass, onRestore, onClose }: Props) {
  const { user } = useAuth()
  const [versions, setVersions] = useState<SceneVersion[]>([])
  const [confirming, setConfirming] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    return subscribeToSceneVersions(user.uid, projectId, sceneId, setVersions)
  }, [user, projectId, sceneId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const passVersions = versions.filter((v) => v.pass === currentPass)
  const otherVersions = versions.filter((v) => v.pass !== currentPass)

  function handleRestore(v: SceneVersion) {
    if (confirming === v.id) {
      onRestore(v.content)
      onClose()
    } else {
      setConfirming(v.id)
    }
  }

  function wordCount(content: ScriptElement[]): number {
    return content.reduce((n, b) => n + b.text.trim().split(/\s+/).filter(Boolean).length, 0)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <span className="text-zinc-200 text-sm font-medium">Version History</span>
            <span className="text-zinc-600 text-xs ml-2">— {PASS_LABEL[currentPass]}</span>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
            ESC to close
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {passVersions.length === 0 && otherVersions.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-zinc-600 text-sm">No saved versions yet.</p>
              <p className="text-zinc-700 text-xs mt-1">Versions are saved automatically when you advance passes, or manually via the footer.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {passVersions.length > 0 && (
                <div>
                  {passVersions.map((v) => (
                    <VersionRow
                      key={v.id}
                      version={v}
                      wordCount={wordCount(v.content)}
                      confirming={confirming === v.id}
                      onRestore={() => handleRestore(v)}
                      onCancelConfirm={() => setConfirming(null)}
                    />
                  ))}
                </div>
              )}

              {otherVersions.length > 0 && (
                <div>
                  <p className="text-zinc-700 text-[10px] uppercase tracking-widest px-6 pt-4 pb-2">
                    {PASS_LABEL[currentPass === 'communityTheater' ? 'liarsPass' : 'communityTheater']} versions
                    <span className="normal-case tracking-normal text-zinc-600 ml-1">(view only — restoring would overwrite the wrong pass)</span>
                  </p>
                  {otherVersions.map((v) => (
                    <VersionRow
                      key={v.id}
                      version={v}
                      wordCount={wordCount(v.content)}
                      confirming={false}
                      readOnly
                      onRestore={() => {}}
                      onCancelConfirm={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-zinc-800">
          <p className="text-zinc-700 text-[10px]">Restoring a version replaces your current draft. This cannot be undone.</p>
        </div>
      </div>
    </div>
  )
}

function VersionRow({
  version,
  wordCount,
  confirming,
  readOnly = false,
  onRestore,
  onCancelConfirm,
}: {
  version: SceneVersion
  wordCount: number
  confirming: boolean
  readOnly?: boolean
  onRestore: () => void
  onCancelConfirm: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-800/40 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-zinc-300 text-xs font-medium truncate">{version.label}</p>
        <p className="text-zinc-600 text-[11px] mt-0.5">
          {formatDate(version.savedAt)} · {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </p>
      </div>

      {!readOnly && (
        confirming ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-amber-400 text-[11px]">Replace current draft?</span>
            <button
              onClick={onRestore}
              className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded-md transition-colors"
            >
              Yes, restore
            </button>
            <button
              onClick={onCancelConfirm}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onRestore}
            className="shrink-0 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-2.5 py-1 rounded-md transition-colors"
          >
            Restore
          </button>
        )
      )}
    </div>
  )
}
