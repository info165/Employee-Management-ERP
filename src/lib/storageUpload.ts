// Uploads a real selected file to Firebase Storage and returns the metadata
// needed to create an EmployeeDocument record. Unlike firestoreSync's writes,
// this throws on failure — the caller is a form submit action and the user
// needs to know immediately if an upload didn't go through.
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase';

export interface UploadedFileMeta {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
}

/**
 * Uploads `file` to `employee_documents/{employeeId}/{docType}/{timestamp}_{filename}`
 * and returns its real name, size, type, and a public download URL.
 */
export async function uploadEmployeeDocumentFile(
  employeeId: string,
  docType: string,
  file: File
): Promise<UploadedFileMeta> {
  const path = `employee_documents/${employeeId}/${docType}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  // Storage rules check this metadata to confirm who's allowed to read/write
  // this specific file, since Storage objects don't carry the app's own
  // userId field the way the matching Firestore document does.
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: { uploadedBy: auth.currentUser?.uid || '' },
  });
  const fileUrl = await getDownloadURL(storageRef);
  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    fileUrl,
  };
}
