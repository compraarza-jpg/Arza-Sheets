/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

let firebaseApp;
let auth: any;
const provider = new GoogleAuthProvider();
// Required Workspace spreadsheet scopes for sheets parsing
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

try {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
} catch (err) {
  console.warn("Could not load firebase-applet-config.json, running with offline mock authentication:", err);
}

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem('arza_google_access_token');
  } catch (e) {
    return null;
  }
})();

export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        try {
          localStorage.removeItem('arza_google_access_token');
        } catch (e) {}
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        localStorage.removeItem('arza_google_access_token');
      } catch (e) {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  if (!auth) {
    // Return a perfect simulated authentication in trial sandbox
    cachedAccessToken = "simulated-token-abc-123";
    try {
      localStorage.setItem('arza_google_access_token', cachedAccessToken);
    } catch (e) {}
    const simulatedUser = {
      uid: "simulated-rossy-lares",
      displayName: "Rossy Lares Morales",
      email: "compraarza@gmail.com",
      photoURL: "https://lh3.googleusercontent.com/a/default-user"
    };
    return { user: simulatedUser, accessToken: cachedAccessToken };
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el Token de Acceso de Google Workspace.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem('arza_google_access_token', cachedAccessToken);
    } catch (e) {}
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  if (auth) {
    await auth.signOut();
  }
  cachedAccessToken = null;
  try {
    localStorage.removeItem('arza_google_access_token');
  } catch (e) {}
};
