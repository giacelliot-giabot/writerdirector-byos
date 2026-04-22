import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function getHasSeenOnboarding(uid: string): Promise<boolean> {
  // #region agent log
  console.warn('[dbg:aa554a][H-A][users.ts:entry] getHasSeenOnboarding called', { uid })
  // #endregion
  try {
    const ref = doc(db, 'users', uid)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('getDoc timeout')), 4000)
    )
    const snap = await Promise.race([getDoc(ref), timeoutPromise])
    // #region agent log
    console.warn('[dbg:aa554a][H-A/H-C][users.ts:after-getDoc] snap result', { exists: snap.exists(), data: snap.exists() ? snap.data() : null })
    // #endregion
    if (!snap.exists()) return false
    return snap.data()?.hasSeenOnboarding === true
  } catch (err) {
    // #region agent log
    console.warn('[dbg:aa554a][H-A][users.ts:catch] getDoc threw or timed out', { error: String(err) })
    // #endregion
    return false
  }
}

export async function setHasSeenOnboarding(uid: string): Promise<void> {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { hasSeenOnboarding: true }, { merge: true })
}
