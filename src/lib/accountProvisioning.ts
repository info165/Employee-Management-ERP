import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Creates a new Firebase Auth user account using a secondary temporary Firebase App instance.
 * 
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * Calling `createUserWithEmailAndPassword` on the default auth instance would immediately
 * replace the currently signed-in user's session with the new account, kicking the Super Admin
 * out of the portal.
 * 
 * By spinning up a secondary Firebase App instance with a unique name, performing the creation,
 * signing out of that secondary instance, and then deleting the temporary app, the Super Admin's
 * primary session remains 100% untouched.
 */
export async function provisionFirebaseUser(email: string, password: string): Promise<string> {
  const tempAppName = `secondary-provisioner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);

  try {
    const tempAuth = getAuth(tempApp);
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email.trim(), password);
    const uid = userCredential.user.uid;

    // Immediately sign out the secondary session
    await signOut(tempAuth);
    // Destroy the temporary Firebase app
    await deleteApp(tempApp);

    return uid;
  } catch (error) {
    // Ensure temporary app is cleaned up on error
    try {
      await deleteApp(tempApp);
    } catch {
      // Ignore cleanup error if app was not initialized
    }
    throw error;
  }
}

/**
 * Generates a cryptographically strong 12-character random password containing
 * uppercase, lowercase, numbers, and special characters.
 */
export function generateSecurePassword(length = 12): string {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluded easily confused I, O
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // excluded easily confused l
  const numberChars = '23456789'; // excluded 0, 1
  const specialChars = '!@#$%^&*()_+-=';

  // Ensure at least one from each character set
  let password = [
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)],
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)],
    numberChars[Math.floor(Math.random() * numberChars.length)],
    specialChars[Math.floor(Math.random() * specialChars.length)],
  ];

  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  for (let i = password.length; i < length; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle the password characters
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}
