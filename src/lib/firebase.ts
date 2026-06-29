import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Quota exceeded') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('quota') ||
    msg.includes('Quota') ||
    msg.includes('QUOTA')
  );
}

export function isPermissionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('permission') ||
    msg.includes('Permission') ||
    msg.includes('PERMISSION') ||
    msg.includes('insufficient permissions')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUserId = localStorage.getItem('sethi_session_userId');
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMsg,
    authInfo: {
      userId: currentUserId,
      email: currentUserId ? `${currentUserId}@sethielectronics.com` : null,
      emailVerified: true,
      isAnonymous: false,
    },
    operationType,
    path
  };

  if (isQuotaError(error)) {
    console.warn('Firestore Quota Alert (Handled gracefully): ', JSON.stringify(errInfo));
    throw new Error(`QUOTA_EXCEEDED: ${errorMsg}`);
  }

  if (isPermissionError(error)) {
    console.warn('Firestore Permission Alert (Handled gracefully): ', JSON.stringify(errInfo));
    throw new Error(`PERMISSION_DENIED: ${errorMsg}`);
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
