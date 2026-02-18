import { Agent } from '../types';

export const defaultAgents: Agent[] = [
    {
        id: 'd1111111-1111-1111-1111-111111111111',
        name: 'Demo Director',
        email: 'director@example.com',
        role: 'director',
        department: 'Management'
    },
    {
        id: 'a1111111-1111-1111-1111-111111111111',
        name: 'Demo Agent',
        email: 'demo@example.com',
        role: 'agent',
        department: 'General'
    },
    {
        id: 'a2222222-2222-2222-2222-222222222222',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'agent',
        department: 'Sales'
    }
];

// Default password map (in a real app, use proper password hashing)
export const defaultPasswords: Record<string, string> = {
    'director@example.com': 'admin123',
    'demo@example.com': 'demo123',
    'john@example.com': 'password123'
};
