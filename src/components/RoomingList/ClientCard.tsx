
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Client } from '../../types';
import { User, GripVertical } from 'lucide-react';

interface ClientCardProps {
    client: Client;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `client-${client.id}`,
        data: {
            type: 'client',
            client
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : undefined,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
        p-3 rounded-lg border shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing
        transition-colors duration-200 touch-none mb-2
        ${isDragging ? 'bg-blue-50 border-blue-300 shadow-lg opacity-80' : 'bg-white hover:bg-gray-50 border-gray-200'}
      `}
        >
            <div className="text-gray-400">
                <GripVertical size={16} />
            </div>
            <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{client.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <User size={12} />
                    {client.passportNumber || 'No Passport Info'}
                </div>
            </div>
            <div className={`
        text-xs font-semibold px-2 py-1 rounded
        ${client.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}
      `}>
                {client.gender === 'Male' ? 'M' : 'F'}
            </div>
        </div>
    );
};
