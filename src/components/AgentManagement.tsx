import React, { useState } from 'react';
import { Agent } from '../types';
import { Users, Edit2, Save, X, UserPlus } from 'lucide-react';
import { db } from '../lib/database';

interface AgentManagementProps {
  agents: Agent[];
  onUpdate: () => void;
}

interface EditingAgent extends Agent {
  password?: string;
}

export const AgentManagement: React.FC<AgentManagementProps> = ({ agents, onUpdate }) => {
  const [editingAgent, setEditingAgent] = useState<EditingAgent | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAgent, setNewAgent] = useState<EditingAgent>({
    name: '',
    email: '',
    role: 'agent',
    department: '',
    password: ''
  } as EditingAgent);

  const handleSave = async (agent: EditingAgent) => {
    try {
      if (agent.id) {
        // Update existing agent
        await db.agents.update(agent.id, {
          name: agent.name,
          email: agent.email,
          department: agent.department,
          role: agent.role
        });
      } else {
        // Add new agent
        await db.agents.add({
          name: agent.name,
          email: agent.email,
          department: agent.department,
          role: agent.role
        });
      }
      
      setEditingAgent(null);
      setIsAddingNew(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Failed to save agent');
    }
  };

  const startEdit = (agent: Agent) => {
    setIsAddingNew(false);
    setEditingAgent({ ...agent });
  };

  const cancelEdit = () => {
    setEditingAgent(null);
    setIsAddingNew(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agent Management</h3>
        </div>
        <button
          onClick={() => {
            setIsAddingNew(true);
            setEditingAgent(null);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Agent</span>
        </button>
      </div>

      {/* Add New Agent Form */}
      {isAddingNew && (
        <div className="mb-6 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h4 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">Add New Agent</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={newAgent.name}
              onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={newAgent.email}
              onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={newAgent.password}
              onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Department"
              value={newAgent.department}
              onChange={(e) => setNewAgent({ ...newAgent, department: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
            />
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(newAgent)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Add Agent
            </button>
          </div>
        </div>
      )}

      {/* Agents List */}
      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            {editingAgent?.id === agent.id && editingAgent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={editingAgent.name || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
                />
                <input
                  type="email"
                  value={editingAgent.email || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, email: e.target.value })}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  value={editingAgent.department || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, department: e.target.value })}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => editingAgent && handleSave(editingAgent)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">{agent.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.email} • {agent.department}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {agent.role}
                  </span>
                </div>
                <button
                  onClick={() => startEdit(agent)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
