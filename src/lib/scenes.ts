import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export type SceneState =
  | 'untouched'
  | 'outline_in_progress'
  | 'outline_complete'
  | 'community_theater_in_progress'
  | 'community_theater_complete'
  | 'liars_pass_in_progress'
  | 'liars_pass_complete'

export interface CharacterData {
  id: string
  name: string
  want: string           // Q1: what do they want/need from scene partner
  comingFrom: string     // Q2: where coming from, expectation, all 5 senses
  realization: string    // Q3: when do they realize they're not in the scene they thought
  needsToGetThrough: string  // Q4: what do they need from scene partner to get through
  whereNow: string       // Q5: where is the character now
}

export interface SceneOutline {
  characters: CharacterData[]
  settingPlot: string
  completedAt: Timestamp | null
}

export interface ScriptElement {
  id: string
  type: 'scene_heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition'
  text: string
}

export interface Scene {
  id: string
  order: number
  sceneHeader: string
  state: SceneState
  outline: SceneOutline
  communityTheater: {
    content: ScriptElement[]
    startedAt: Timestamp | null
    completedAt: Timestamp | null
  }
  liarsPass: {
    content: ScriptElement[]
    startedAt: Timestamp | null
    completedAt: Timestamp | null
  }
}

export function emptyCharacter(name = ''): CharacterData {
  return {
    id: crypto.randomUUID(),
    name,
    want: '',
    comingFrom: '',
    realization: '',
    needsToGetThrough: '',
    whereNow: '',
  }
}

const emptyOutline = (): SceneOutline => ({
  characters: [],
  settingPlot: '',
  completedAt: null,
})

function scenesRef(userId: string, projectId: string) {
  return collection(db, 'users', userId, 'projects', projectId, 'scenes')
}

function sceneRef(userId: string, projectId: string, sceneId: string) {
  return doc(db, 'users', userId, 'projects', projectId, 'scenes', sceneId)
}

export function subscribeToScenes(
  userId: string,
  projectId: string,
  callback: (scenes: Scene[]) => void
) {
  const q = query(scenesRef(userId, projectId), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    const scenes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Scene))
    callback(scenes)
  })
}

export async function createScene(userId: string, projectId: string, order: number) {
  await addDoc(scenesRef(userId, projectId), {
    order,
    sceneHeader: '',
    state: 'untouched',
    outline: emptyOutline(),
    communityTheater: { content: [], startedAt: null, completedAt: null },
    liarsPass: { content: [], startedAt: null, completedAt: null },
    createdAt: serverTimestamp(),
  })
}

export async function deleteScene(userId: string, projectId: string, sceneId: string) {
  await deleteDoc(sceneRef(userId, projectId, sceneId))
}

export async function updateSceneHeader(
  userId: string,
  projectId: string,
  sceneId: string,
  sceneHeader: string
) {
  await updateDoc(sceneRef(userId, projectId, sceneId), { sceneHeader })
}

export async function updateSceneOutline(
  userId: string,
  projectId: string,
  sceneId: string,
  outline: Partial<Omit<SceneOutline, 'completedAt'>>,
  state?: SceneState
) {
  const update: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(outline)) {
    update[`outline.${k}`] = v
  }
  if (state) update.state = state
  await updateDoc(sceneRef(userId, projectId, sceneId), update)
}

export async function updateScenePlot(
  userId: string,
  projectId: string,
  sceneId: string,
  settingPlot: string
) {
  await updateDoc(sceneRef(userId, projectId, sceneId), { 'outline.settingPlot': settingPlot })
}

export async function updateSceneState(
  userId: string,
  projectId: string,
  sceneId: string,
  state: SceneState
) {
  await updateDoc(sceneRef(userId, projectId, sceneId), { state })
}

export async function updateCommunityTheaterContent(
  userId: string,
  projectId: string,
  sceneId: string,
  content: ScriptElement[],
  state?: SceneState
) {
  const update: Record<string, unknown> = { 'communityTheater.content': content }
  if (state) update.state = state
  await updateDoc(sceneRef(userId, projectId, sceneId), update)
}

export async function updateLiarsPassContent(
  userId: string,
  projectId: string,
  sceneId: string,
  content: ScriptElement[],
  state?: SceneState
) {
  const update: Record<string, unknown> = { 'liarsPass.content': content }
  if (state) update.state = state
  await updateDoc(sceneRef(userId, projectId, sceneId), update)
}

export async function reorderScenes(
  userId: string,
  projectId: string,
  scenes: Scene[]
) {
  const batch = writeBatch(db)
  scenes.forEach((scene, index) => {
    batch.update(sceneRef(userId, projectId, scene.id), { order: index })
  })
  await batch.commit()
}

export function characterIsComplete(c: CharacterData): boolean {
  return (
    c.name.trim().length > 0 &&
    c.want.trim().length > 0 &&
    c.comingFrom.trim().length > 0 &&
    c.realization.trim().length > 0 &&
    c.needsToGetThrough.trim().length > 0 &&
    c.whereNow.trim().length > 0
  )
}

export function outlineIsComplete(outline: SceneOutline): boolean {
  return (
    outline.characters.length > 0 &&
    outline.characters.every(characterIsComplete) &&
    outline.settingPlot.trim().length > 0
  )
}
