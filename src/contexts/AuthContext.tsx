import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: () => void = () => {};

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      profileUnsubscribe(); // Clean up previous listener

      if (authUser) {
        // First check if user exists
        const userRef = doc(db, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const isInitialAdmin = authUser.email === 'md3048284@gmail.com';
          const newProfile = {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
            role: isInitialAdmin ? 'admin' : 'user',
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userRef, newProfile);
        }

        // Set up real-time listener for profile
        profileUnsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data());
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      profileUnsubscribe();
    };
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isSuspended: profile?.status === 'suspended',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
