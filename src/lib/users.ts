import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function getHasSeenOnboarding(uid: string): Promise<boolean> {
  try {
    const ref = doc(db, 'users', uid)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('getDoc timeout')), 4000)
    )
    const snap = await Promise.race([getDoc(ref), timeoutPromise])
    if (!snap.exists()) return false
    return snap.data()?.hasSeenOnboarding === true
  } catch {
    return false
  }
}

export async function setHasSeenOnboarding(uid: string): Promise<void> {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { hasSeenOnboarding: true }, { merge: true })
}
