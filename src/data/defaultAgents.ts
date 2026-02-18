import { Agent } from '../types';

export const defaultAgents: Agent[] = [
    {
        id: 'd1111111-1111-1111-1111-111111111111',
        name: 'Ibrahim Fatmi',
        email: 'brahim@fatmi.com',
        role: 'director',
        department: 'Management'
    },
    {
        id: 'a1111111-1111-1111-1111-111111111111',
        name: 'Ibrahim Fatmi',
        email: 'brahim@fatmi.com',
        role: 'agent',
        department: 'General'
    }
];

// Default password map (in a real app, use proper password hashing)
export const defaultPasswords: Record<string, string> = {
    'brahim@fatmi.com': 'Ibrahim1972'
};
