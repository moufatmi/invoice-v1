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
    if (!dbInitialized) {
      return { error: 'Application is still initializing' };
    }

    try {
      setLoading(true);
      setError(null);

      // Find agent in database first
      let agent = await db.agents.where('email').equals(email).first();

      if (!agent) {
        return { error: 'Agent not found in database' };
      }

      // Get the password from defaultPasswords map
      const validPassword = defaultPasswords[email];

      if (password !== validPassword) {
        return { error: 'Invalid password' };
      }

      if (!agent) {
        console.log('Agent not found, retrying after delay...');
        // Wait for initialization and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        agent = await db.agents.where('email').equals(email).first();

        if (!agent) {
          return { error: 'Agent not found in database. Please try again.' };
        }
      }

      console.log('Found agent:', agent);
      // Set state and save to local storage
      setAgentProfile(agent);
      localStorage.setItem('agent', JSON.stringify(agent));

      return { agent };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: 'Failed to sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('agent');
      setAgentProfile(null);
      // Import the reset function dynamically to avoid circular dependencies
      const { resetAndInitializeDatabase } = await import('../lib/database');
      await resetAndInitializeDatabase();
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
