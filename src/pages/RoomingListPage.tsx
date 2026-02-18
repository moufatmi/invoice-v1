
import React, { useState, useEffect } from 'react';
import {
    Users, BedDouble, Filter,
    Search, Plus, LayoutGrid, CheckCircle, Save
} from 'lucide-react';
import {
    DndContext, DragOverlay, useDraggable,
    useSensor, useSensors, PointerSensor, useDroppable
} from '@dnd-kit/core';
import { RoomCard } from '../components/RoomingList/RoomCard';
import { ClientCard } from '../components/RoomingList/ClientCard';
import { supabaseService } from '../services/supabaseService';
import { Room, Client } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { RoomForm } from '../components/RoomingList/RoomForm';
import { generateRoomingListPDF } from '../utils/pdfGenerator';

const UnassignZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'unassign-zone',
        data: { type: 'unassign' }
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 overflow-y-auto services-scrollbar transition-colors ${isOver ? 'bg-red-50 ring-2 ring-red-200 ring-inset' : ''}`}
        >
            {children}
        </div>
    );
};

export const RoomingListPage: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [draggedClient, setDraggedClient] = useState<Client | null>(null);
    const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);

    // Initial load
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [roomsData, clientsData] = await Promise.all([
                supabaseService.getRooms(),
                supabaseService.getClients()
            ]);
            setRooms(roomsData);
            setClients(clientsData);
        } catch (error) {
            console.error('Failed to load rooming list:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveRoom = async (roomData: Omit<Room, 'id' | 'assignments'>) => {
        setIsSaving(true);
        try {
            await supabaseService.createRoom(roomData);
            await fetchData();
            setIsRoomFormOpen(false);
        } catch (error) {
            console.error('Failed to save room:', error);
            alert('Failed to save room. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRoom = async (id: string) => {
        try {
            await supabaseService.deleteRoom(id);
            await fetchData();
        } catch (error) {
            console.error('Failed to delete room:', error);
            alert('فشل في حذف الغرفة. يرجى التأكد من أنها فارغة أولاً.');
        }
    };

    const handleDragStart = (event: any) => {
        const { active } = event;
        const client = clients.find(c => `client-${c.id}` === active.id);
        if (client) setDraggedClient(client);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setDraggedClient(null);

        if (!over) return;

        const clientId = active.data.current.client.id;

        // Handle Unassigning
        if (over.id === 'unassign-zone') {
            const updatedRooms = rooms.map(room => ({
                ...room,
                assignments: room.assignments?.filter(a => a.clientId !== clientId) || []
            }));
            setRooms(updatedRooms);

            try {
                await supabaseService.removeClientFromRoom(clientId);
            } catch (error) {
                console.error('Unassign failed:', error);
                fetchData();
            }
            return;
        }

        const roomId = over.data.current.room.id;

        // Optimistic UI Update
        const updatedRooms = rooms.map(room => {
            if (room.id === roomId) {
                // Remove client from any other room first (if already assigned)
                const currentRoom = rooms.find(r => r.assignments?.some(a => a.clientId === clientId));
                if (currentRoom) {
                    currentRoom.assignments = currentRoom.assignments?.filter(a => a.clientId !== clientId);
                }

                // Add to new room
                return {
                    ...room,
                    assignments: [
                        ...(room.assignments || []),
                        { id: 'temp-' + Date.now(), roomId, clientId, assignedAt: new Date().toISOString() }
                    ]
                };
            }
            return room;
        });
        setRooms(updatedRooms);

        // Backend Sync
        try {
            await supabaseService.assignClientToRoom(roomId, clientId);
        } catch (error) {
            console.error('Drag failed:', error);
            fetchData(); // Revert on failure
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Filter unassigned clients
    const assignedClientIds = new Set(
        rooms.flatMap(r => r.assignments?.map(a => a.clientId) || [])
    );

    const unassignedClients = clients.filter(c =>
        !assignedClientIds.has(c.id!) &&
        (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.passportNumber?.includes(searchQuery))
    );

    if (isLoading) return <LoadingSpinner />;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex flex-col bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <LayoutGrid className="text-blue-600" />
                            Unassigned Rooming List
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {unassignedClients.length} unassigned clients • {rooms.length} rooms
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsRoomFormOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                        >
                            <Plus size={18} />
                            Add Room
                        </button>
                        <button
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95"
                            onClick={() => window.print()}
                        >
                            <Save size={18} />
                            Export List
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar: Unassigned Clients */}
                    <aside className="w-80 bg-white border-r flex flex-col z-10 shadow-lg">
                        <div className="p-4 border-b bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <UnassignZone>
                            <div className="p-4 space-y-2">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                    Unassigned ({unassignedClients.length})
                                </h3>
                                {unassignedClients.map(client => (
                                    <ClientCard key={client.id} client={client} />
                                ))}
                            </div>
                        </UnassignZone>
                    </aside>

                    {/* Main Canvas: Rooms Grid */}
                    <main className="flex-1 overflow-y-auto p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {rooms.map(room => (
                                <RoomCard
                                    key={room.id}
                                    room={room}
                                    clients={clients.filter(c =>
                                        room.assignments?.some(a => a.clientId === c.id)
                                    )}
                                    onDelete={handleDeleteRoom}
                                />
                            ))}

                            {/* Add Room Placeholder */}
                            <button
                                onClick={() => setIsRoomFormOpen(true)}
                                className="h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="p-4 rounded-full bg-gray-100 group-hover:bg-blue-100 mb-4 transition-colors">
                                    <Plus size={32} />
                                </div>
                                <span className="font-medium">Add New Room</span>
                            </button>
                        </div>
                    </main>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {draggedClient ? (
                        <div className="opacity-90 scale-105 rotate-2 transform cursor-grabbing">
                            <ClientCard client={draggedClient} />
                        </div>
                    ) : null}
                </DragOverlay>

                {isRoomFormOpen && (
                    <RoomForm
                        onSave={handleSaveRoom}
                        onCancel={() => setIsRoomFormOpen(false)}
                    />
                )}

                {/* --- Printable Report Section (Hidden by default) --- */}
                <div id="printable-rooming-report" className="hidden print:block p-8 bg-white" dir="rtl">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            #printable-rooming-report, #printable-rooming-report * { visibility: visible; }
                            #printable-rooming-report { 
                                position: absolute; 
                                left: 0; 
                                top: 0; 
                                width: 100%;
                                display: block !important;
                            }
                            @page { size: A4; margin: 1cm; }
                            .no-print { display: none !important; }
                        }
                    `}</style>

                    <div className="flex justify-between items-center border-b-4 border-blue-600 pb-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">تقرير لائحة التسكين</h1>
                            <p className="text-blue-600 font-medium mt-1">Beausejour Voyage</p>
                        </div>
                        <div className="text-left" dir="ltr">
                            <p className="text-sm text-gray-500">التاريخ: {new Date().toLocaleDateString('ar-MA')}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {rooms.map((room) => {
                            const roomClients = clients.filter(c =>
                                room.assignments?.some(a => a.clientId === c.id)
                            );

                            return (
                                <div key={room.id} className="border-2 border-gray-200 rounded-xl overflow-hidden break-inside-avoid">
                                    <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b-2 border-gray-200">
                                        <h3 className="text-lg font-bold">
                                            غرفة رقم: <span className="text-blue-700">{room.roomNumber || '---'}</span>
                                            <span className="mr-2 text-sm text-gray-500 font-normal">
                                                ({room.type === 'Double' ? 'ثنائية' : room.type === 'Triple' ? 'ثلاثية' : room.type === 'Quad' ? 'رباعية' : 'خماسية'})
                                            </span>
                                        </h3>
                                        <span className="text-sm font-medium">الفندق: {room.hotelName || '---'}</span>
                                    </div>
                                    <table className="w-full text-inner">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-4 py-2 text-right text-sm text-gray-600">اسم المعتمر الكامل</th>
                                                <th className="px-4 py-2 text-right text-sm text-gray-600">رقم الجواز</th>
                                                <th className="px-4 py-2 text-right text-sm text-gray-600">الجنس</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roomClients.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic">لا يوجد معتمرين مسكنين</td>
                                                </tr>
                                            ) : (
                                                roomClients.map((client) => (
                                                    <tr key={client.id} className="border-b border-gray-100">
                                                        <td className="px-4 py-3 font-semibold text-gray-900">{client.name}</td>
                                                        <td className="px-4 py-3 text-gray-700">{client.passportNumber || '---'}</td>
                                                        <td className="px-4 py-3 text-gray-700">{client.gender === 'Male' ? 'ذكر' : client.gender === 'Female' ? 'أنثى' : '---'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 pt-4 border-t border-gray-200 text-center text-gray-400 text-xs">
                        تم إنشاء هذا التقرير عبر نظام Beausejour Voyage • {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </DndContext>
    );
};

export default RoomingListPage;
