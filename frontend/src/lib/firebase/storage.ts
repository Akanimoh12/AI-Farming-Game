import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
  type StorageReference,
} from 'firebase/storage'
import { storage } from './config'

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  path: string,
  file: File,
  metadata?: Record<string, unknown>
): Promise<string> {
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file, metadata)
  return getDownloadURL(snapshot.ref)
}

/**
 * Upload a file with progress tracking
 */
export function uploadFileWithProgress(
  path: string,
  file: File,
  onProgress: (progress: number) => void,
  metadata?: Record<string, unknown>
): {
  uploadTask: UploadTask
  getDownloadURL: () => Promise<string>
} {
  const storageRef = ref(storage, path)
  const uploadTask = uploadBytesResumable(storageRef, file, metadata)

  uploadTask.on('state_changed', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    onProgress(progress)
  })

  return {
    uploadTask,
    getDownloadURL: async () => {
      const snapshot = await uploadTask
      return getDownloadURL(snapshot.ref)
    },
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

/**
 * Get storage reference
 */
export function getStorageRef(path: string): StorageReference {
  return ref(storage, path)
}

/**
 * Get download URL for a file
 */
export async function getFileURL(path: string): Promise<string> {
  const storageRef = ref(storage, path)
  return getDownloadURL(storageRef)
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const path = `avatars/${userId}/${Date.now()}_${file.name}`

  if (onProgress) {
    const { uploadTask, getDownloadURL } = uploadFileWithProgress(path, file, onProgress)
    await uploadTask
    return getDownloadURL()
  }

  return uploadFile(path, file)
}

/**
 * Upload game asset
 */
export async function uploadGameAsset(
  category: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const path = `game-assets/${category}/${Date.now()}_${file.name}`

  if (onProgress) {
    const { uploadTask, getDownloadURL } = uploadFileWithProgress(path, file, onProgress)
    await uploadTask
    return getDownloadURL()
  }

  return uploadFile(path, file)
}
