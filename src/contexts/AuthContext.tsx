import React, { createContext, useContext, useEffect, useState } from 'react';
import { Agent } from '../types';
import { db } from '../lib/database';
import { defaultPasswords } from '../data/defaultAgents';

interface AuthContextType {
  isAuthenticated: boolean;
  agentProfile: Agent | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ agent?: Agent; error?: string }>;
  signOut: () => Promise<void>;
  retryAuth: () => Promise<void>;
  forceInitComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agentProfile, setAgentProfile] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database and check saved session
  useEffect(() => {
    const initializeDb = async () => {
      try {
        // Wait for any agents to be added (initialization)
        await new Promise<void>((resolve) => {
          const checkDb = async () => {
            const count = await db.agents.count();
            if (count > 0) {
              resolve();
            } else {
              setTimeout(checkDb, 100);
            }
          };
          checkDb();
        });

        // Try to restore session
        const savedAgent = localStorage.getItem('agent');
        if (savedAgent) {
          const agent = JSON.parse(savedAgent) as Agent;
          const dbAgent = await db.agents.where('id').equals(agent.id || '').first();
          if (dbAgent) {
            setAgentProfile(dbAgent);
          } else {
            localStorage.removeItem('agent');
          }
        }
      } catch (err) {
        console.error('Error initializing:', err);
        setError('Failed to initialize application');
      } finally {
        setDbInitialized(true);
        setLoading(false);
      }
    };

    initializeDb();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Check for the primary director account (Ibrahim Fatmi)
      const isDirector = email === 'brahim@fatmi.com' && password === 'Ibrahim1972';

      if (isDirector) {
        // Force get or create in local DB for high reliability
        let agent = await db.agents.where('email').equals(email).first();
        if (!agent) {
          const { defaultAgents } = await import('../data/defaultAgents');
          const defaultAgent = defaultAgents.find(a => a.email === email);
          if (defaultAgent) {
            await db.agents.add(defaultAgent);
            agent = defaultAgent;
          }
        }

        if (agent) {
          setAgentProfile(agent);
          localStorage.setItem('agent', JSON.stringify(agent));
          return { agent };
        }
      }

      // 2. Check Password Map for other users
      const validPassword = defaultPasswords[email];
      if (validPassword && password === validPassword) {
        const agent = await db.agents.where('email').equals(email).first();
        if (agent) {
          setAgentProfile(agent);
          localStorage.setItem('agent', JSON.stringify(agent));
          return { agent };
        }
      }

      return { error: 'Incorrect email or password' };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: 'Failed to sign in. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('agent');
      setAgentProfile(null);
      // We no longer wipe the database on logout to prevent data loss
      console.log('User signed out successfully');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const retryAuth = async () => {
    setError(null);
    const savedAgent = localStorage.getItem('agent');
    if (savedAgent) {
      try {
        const agent = JSON.parse(savedAgent) as Agent;
        const dbAgent = await db.agents.where('id').equals(agent.id || '').first();
        if (dbAgent) {
          setAgentProfile(dbAgent);
        } else {
          localStorage.removeItem('agent');
          setError('Session expired. Please sign in again.');
        }
      } catch (err) {
        setError('Failed to restore session');
      }
    }
    setLoading(false);
  };

  const forceInitComplete = () => {
    setLoading(false);
    setError(null);
  };

  // Context value
  const value = {
    isAuthenticated: !!agentProfile,
    agentProfile,
    loading,
    error,
    signIn,
    signOut,
    retryAuth,
    forceInitComplete
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
