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
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Project {
  id: string
  title: string
  createdAt: Timestamp
  updatedAt: Timestamp
  lastOpenedAt: Timestamp
}

export function subscribeToProjects(
  userId: string,
  callback: (projects: Project[]) => void
) {
  const ref = collection(db, 'users', userId, 'projects')
  const q = query(ref, orderBy('lastOpenedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project))
    callback(projects)
  })
}

export async function createProject(userId: string, title: string) {
  const ref = collection(db, 'users', userId, 'projects')
  await addDoc(ref, {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastOpenedAt: serverTimestamp(),
  })
}

export async function renameProject(userId: string, projectId: string, title: string) {
  const ref = doc(db, 'users', userId, 'projects', projectId)
  await updateDoc(ref, { title, updatedAt: serverTimestamp() })
}

export async function deleteProject(userId: string, projectId: string) {
  const ref = doc(db, 'users', userId, 'projects', projectId)
  await deleteDoc(ref)
}

export async function touchProject(userId: string, projectId: string) {
  const ref = doc(db, 'users', userId, 'projects', projectId)
  await updateDoc(ref, { lastOpenedAt: serverTimestamp() })
}
