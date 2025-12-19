'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from "../firebase.config";
import { User, UserRole } from '../types/firebase'

const ADMIN_EMAIL = 'samchalissery24bcs41@iiitkottayam.ac.in'

function deriveDisplayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? ''
  const cleaned = localPart.replace(/[^a-zA-Z]+/g, ' ').trim()
  if (!cleaned) return localPart || 'User'

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function getRoleForEmail(email?: string): UserRole {
  if (!email) return 'player'
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'player'
}

interface AuthContextValue {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, displayName: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
          
          if (userDoc.exists()) {
            const existingUser = userDoc.data() as User
            const nextRole = getRoleForEmail(fbUser.email ?? existingUser.email)
            const nextDisplayName =
              existingUser.displayName ||
              fbUser.displayName ||
              (fbUser.email ? deriveDisplayNameFromEmail(fbUser.email) : undefined) ||
              'User'

            const updatedUser: User = {
              ...existingUser,
              email: fbUser.email ?? existingUser.email,
              displayName: nextDisplayName,
              role: nextRole,
              lastLogin: new Date()
            }

            await setDoc(doc(db, 'users', fbUser.uid), updatedUser)
            setUser(updatedUser)
          } else {
            // Check if user is new - we can't use getAdditionalUserInfo here since we only have FirebaseUser
            // isNewUser detection will be handled in the sign-in functions instead
            const displayName =
              fbUser.displayName ||
              (fbUser.email ? deriveDisplayNameFromEmail(fbUser.email) : undefined) ||
              'User'
            
            const newUser: User = {
              uid: fbUser.uid,
              email: fbUser.email ?? undefined,
              displayName: displayName,
              role: getRoleForEmail(fbUser.email ?? undefined),
              createdAt: new Date(),
              lastLogin: new Date()
            }
            
            await setDoc(doc(db, 'users', fbUser.uid), newUser)
            setUser(newUser)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      if (!result.user) {
        throw new Error('Sign in failed - No user returned')
      }
      
      // Fetch user data directly instead of waiting for state update
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        setUser(userData)
        return userData
      } else {
        // Create user document if it doesn't exist
        const newUser: User = {
          uid: result.user.uid,
          email: result.user.email || undefined,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          role: 'player',
          createdAt: new Date(),
          lastLogin: new Date()
        }
        await setDoc(doc(db, 'users', result.user.uid), newUser)
        setUser(newUser)
        return newUser
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address')
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address')
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later')
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password')
      } else {
        throw error
      }
    }
  }

  async function signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(auth, provider)
      if (!result.user) {
        throw new Error('Google sign in failed - No user returned')
      }

      const email = result.user.email || undefined
      const role = getRoleForEmail(email)

      const derivedName = email ? deriveDisplayNameFromEmail(email) : 'User'
      const displayName = result.user.displayName || derivedName

      if (!result.user.displayName && displayName) {
        await updateProfile(result.user, { displayName })
      }
      
      // Fetch user data directly instead of waiting for state update
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        const updatedUser: User = {
          ...userData,
          email,
          displayName: userData.displayName || displayName,
          role,
          lastLogin: new Date()
        }
        await setDoc(doc(db, 'users', result.user.uid), updatedUser)
        setUser(updatedUser)
        return updatedUser
      } else {
        // Create user document if it doesn't exist
        const newUser: User = {
          uid: result.user.uid,
          email,
          displayName,
          role,
          createdAt: new Date(),
          lastLogin: new Date()
        }
        await setDoc(doc(db, 'users', result.user.uid), newUser)
        setUser(newUser)
        return newUser
      }
    } catch (error: any) {
      console.error('Google sign in error:', error)
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site')
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign in cancelled')
      } else {
        throw error
      }
    }
  }

  async function signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      if (!result.user) {
        throw new Error('Sign up failed - No user returned')
      }

      // Update the user's display name
      await updateProfile(result.user, { displayName })

      // Create user document in Firestore
      const newUser: User = {
        uid: result.user.uid,
        email: result.user.email || undefined,
        displayName: displayName,
        role: 'player',
        createdAt: new Date(),
        lastLogin: new Date()
      }

      await setDoc(doc(db, 'users', result.user.uid), newUser)
      setUser(newUser)

      return newUser
    } catch (error: any) {
      console.error('Sign up error:', error)

      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address')
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak')
      } else {
        throw error
      }
    }
  }

  async function signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value: AuthContextValue = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAdmin: user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
