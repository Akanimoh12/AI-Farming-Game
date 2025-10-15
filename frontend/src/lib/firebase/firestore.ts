import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryConstraint,
  type DocumentData,
  type QueryDocumentSnapshot,
  onSnapshot,
  type Unsubscribe,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore'
import { db } from './config'

/**
 * Type-safe Firestore collection reference
 */
export function getCollection<T = DocumentData>(path: string): CollectionReference<T> {
  return collection(db, path) as CollectionReference<T>
}

/**
 * Type-safe Firestore document reference
 */
export function getDocRef<T = DocumentData>(path: string, id: string): DocumentReference<T> {
  return doc(db, path, id) as DocumentReference<T>
}

/**
 * Get a single document
 */
export async function getDocument<T = DocumentData>(
  path: string,
  id: string
): Promise<T | null> {
  const docRef = getDocRef<T>(path, id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? (docSnap.data() as T) : null
}

/**
 * Get multiple documents with query
 */
export async function getDocuments<T = DocumentData>(
  path: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const collectionRef = getCollection<T>(path)
  const q = query(collectionRef, ...constraints)
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T))
}

/**
 * Create or update a document
 */
export async function setDocument<T = DocumentData>(
  path: string,
  id: string,
  data: Partial<T>,
  merge = true
): Promise<void> {
  const docRef = getDocRef(path, id)
  await setDoc(docRef, data, { merge })
}

/**
 * Update a document
 */
export async function updateDocument<T = DocumentData>(
  path: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = getDocRef(path, id)
  await updateDoc(docRef, data)
}

/**
 * Delete a document
 */
export async function deleteDocument(path: string, id: string): Promise<void> {
  const docRef = getDocRef(path, id)
  await deleteDoc(docRef)
}

/**
 * Listen to document changes
 */
export function subscribeToDocument<T = DocumentData>(
  path: string,
  id: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const docRef = getDocRef<T>(path, id)
  return onSnapshot(docRef, (doc) => {
    callback(doc.exists() ? (doc.data() as T) : null)
  })
}

/**
 * Listen to collection changes
 */
export function subscribeToCollection<T = DocumentData>(
  path: string,
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const collectionRef = getCollection<T>(path)
  const q = query(collectionRef, ...constraints)
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T))
    callback(data)
  })
}

/**
 * Batch write operations
 */
export async function batchWrite(
  operations: Array<{
    type: 'set' | 'update' | 'delete'
    path: string
    id: string
    data?: DocumentData
  }>
): Promise<void> {
  const batch = writeBatch(db)

  for (const op of operations) {
    const docRef = doc(db, op.path, op.id)
    switch (op.type) {
      case 'set':
        batch.set(docRef, op.data || {})
        break
      case 'update':
        batch.update(docRef, op.data || {})
        break
      case 'delete':
        batch.delete(docRef)
        break
    }
  }

  await batch.commit()
}

/**
 * Paginated query helper
 */
export async function getPaginatedDocuments<T = DocumentData>(
  path: string,
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot<T>,
  constraints: QueryConstraint[] = []
): Promise<{
  docs: T[]
  lastDoc: QueryDocumentSnapshot<T> | null
  hasMore: boolean
}> {
  const collectionRef = getCollection<T>(path)
  const queryConstraints = [...constraints, limit(pageSize + 1)]

  if (lastDoc) {
    queryConstraints.push(startAfter(lastDoc))
  }

  const q = query(collectionRef, ...queryConstraints)
  const snapshot = await getDocs(q)

  const hasMore = snapshot.docs.length > pageSize
  const docs = snapshot.docs.slice(0, pageSize).map((doc) => ({ id: doc.id, ...doc.data() } as T))
  const lastDocument = hasMore ? snapshot.docs[pageSize - 1] : null

  return {
    docs,
    lastDoc: lastDocument as QueryDocumentSnapshot<T> | null,
    hasMore,
  }
}

/**
 * Server timestamp helper
 */
export { serverTimestamp, Timestamp }

/**
 * Query builders
 */
export { where, orderBy, limit, startAfter }
