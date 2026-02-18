
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Room } from '../../types';
import { ClientCard } from './ClientCard';
import { Users, BedDouble, Bed, Trash2 } from 'lucide-react';
import { Client } from '../../types';

interface RoomProps {
    room: Room;
    clients: Client[];
    onDelete?: (id: string) => void;
}

export const RoomCard: React.FC<RoomProps> = ({ room, clients, onDelete }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `room-${room.id}`,
        data: {
            type: 'room',
            room
        }
    });

    const getCapacityIcon = () => {
        switch (room.capacity) {
            case 2: return <BedDouble size={20} className="text-gray-600" />;
            default: return <Bed size={20} className="text-gray-600" />;
        }
    };

    const getPercentage = () => Math.round((clients.length / room.capacity) * 100);

    return (
        <div
            ref={setNodeRef}
            className={`
        relative rounded-xl border-2 transition-all duration-200
        ${isOver ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-gray-200 bg-white hover:border-gray-300'}
        ${clients.length >= room.capacity ? 'border-red-200 bg-red-50' : ''}
      `}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                        {getCapacityIcon()}
                        Room {room.roomNumber}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1">
                        {room.type} • Floor {room.floorNumber}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`
              px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1
              ${clients.length >= room.capacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
            `}>
                        <Users size={14} />
                        {clients.length}/{room.capacity}
                    </div>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('هل أنت متأكد من حذف هذه الغرفة؟')) {
                                    onDelete(room.id);
                                }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف الغرفة"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 w-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${clients.length >= room.capacity ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${getPercentage()}%` }}
                />
            </div>

            {/* Clients List */}
            <div className="p-4 min-h-[120px] space-y-2">
                {clients.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-4 border-2 border-dashed border-gray-100 rounded-lg">
                        <span>Drop clients here</span>
                    </div>
                ) : (
                    clients.map(client => (
                        <ClientCard key={client.id} client={client} />
                    ))
                )}
            </div>
        </div>
    );
};
