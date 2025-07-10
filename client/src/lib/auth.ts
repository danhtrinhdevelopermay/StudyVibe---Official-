import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  type User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import { apiRequest } from "./queryClient";
import type { User, InsertUser } from "@shared/schema";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Check if user exists in our database, create if not
    try {
      await apiRequest("GET", `/api/users/by-firebase/${result.user.uid}`);
    } catch (error) {
      // User doesn't exist, create them
      const userData: InsertUser = {
        firebaseUid: result.user.uid,
        username: result.user.email?.split('@')[0] || `user_${Date.now()}`,
        email: result.user.email!,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
      
      await apiRequest("POST", "/api/users", userData);
    }
    
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Make sure user exists in our database
    try {
      await apiRequest("GET", `/api/users/by-firebase/${result.user.uid}`);
    } catch (error) {
      // User doesn't exist in our database, this shouldn't happen for sign in
      console.error("User signed in with Firebase but not found in our database:", error);
      throw new Error("Account not found. Please sign up first.");
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, username: string, displayName: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user in our database
    const userData: InsertUser = {
      firebaseUid: result.user.uid,
      username,
      email,
      displayName,
      photoURL: result.user.photoURL,
    };
    
    await apiRequest("POST", "/api/users", userData);
    return result.user;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
}



export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  
  try {
    const response = await apiRequest("GET", `/api/users/by-firebase/${auth.currentUser.uid}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
