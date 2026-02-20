
import React, { useState, useEffect } from 'react';
import {
    Search, Plus, LayoutGrid, Save,
    FileSpreadsheet, Loader2, RefreshCw
} from 'lucide-react';
import {
    DndContext, DragOverlay,
    useSensor, useSensors, PointerSensor, useDroppable
} from '@dnd-kit/core';
import { RoomCard } from '../components/RoomingList/RoomCard';
import { ClientCard } from '../components/RoomingList/ClientCard';
import { appwriteService } from '../services/appwriteService';
import { Room, Client } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { RoomForm } from '../components/RoomingList/RoomForm';
import { parseExcelFile } from '../utils/excelService';
import toast from 'react-hot-toast';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [draggedClient, setDraggedClient] = useState<Client | null>(null);
    const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
    const [activeCity, setActiveCity] = useState<'Makkah' | 'Madinah'>('Makkah');
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Initial load and polling sync (fallback for non-realtime)
    useEffect(() => {
        fetchData();

        // 1. Auto-refresh every 30 seconds (fallback)
        const interval = setInterval(fetchData, 30000);

        // 2. Sync whenever tab is focused
        const onFocus = () => fetchData();
        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    // 3. REAL-TIME SYNC: Listen for direct changes in DB
    const lastDragTime = React.useRef<number>(0);

    useEffect(() => {
        const channel = appwriteService.subscribeToChanges(() => {
            // Ignore realtime events if we just performed a drag (to avoid jiggling)
            if (Date.now() - lastDragTime.current < 2000) return;

            console.log('Real-time update received! Syncing...');
            fetchData();
        });

        return () => {
            appwriteService.unsubscribe(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [roomsData, clientsData, invoicesData] = await Promise.all([
                appwriteService.getRooms(),
                appwriteService.getClients(),
                appwriteService.getInvoices()
            ]);

            // Create a map of the latest Umrah info for each client from invoices
            const clientUmrahInfo: Record<string, { passportNumber?: string, gender?: string }> = {};

            // Sort invoices by date descending to get the latest info
            const sortedInvoices = [...invoicesData].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            sortedInvoices.forEach(inv => {
                if (inv.client?.id && !clientUmrahInfo[inv.client.id]) {
                    if (inv.passportNumber || inv.gender) {
                        clientUmrahInfo[inv.client.id] = {
                            passportNumber: inv.passportNumber,
                            gender: inv.gender
                        };
                    }
                }
            });

            // Enrich clients with info from invoices ONLY IF MISSING in clients table
            const enrichedClients = clientsData.map(client => {
                const info = client.id ? clientUmrahInfo[client.id] : null;
                return {
                    ...client,
                    // Prioritize client table values, use invoice as fallback
                    passportNumber: client.passportNumber || info?.passportNumber || '',
                    gender: client.gender || (info?.gender as any) || undefined
                };
            });

            setRooms(roomsData);
            setClients(enrichedClients);
        } catch (error) {
            console.error('Failed to load rooming list:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveRoom = async (roomData: Omit<Room, 'id' | 'assignments'>) => {
        const loadingToast = toast.loading('Saving room...');
        try {
            await appwriteService.createRoom(roomData);
            await fetchData();
            setIsRoomFormOpen(false);
            toast.success('تمت إضافة الغرفة بنجاح!', { id: loadingToast });
        } catch (error) {
            console.error('Failed to save room:', error);
            toast.error('فشل في إضافة الغرفة.', { id: loadingToast });
        }
    };

    const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const loadingToast = toast.loading('Importing pilgrims from Excel...');

        try {
            const parsedClients = await parseExcelFile(file);

            if (parsedClients.length === 0) {
                toast.error('No data found in the Excel file.', { id: loadingToast });
                return;
            }

            await appwriteService.bulkCreateClients(parsedClients);
            await fetchData(); // Refresh the list

            toast.success(`Successfully imported ${parsedClients.length} pilgrims!`, { id: loadingToast });
        } catch (error: any) {
            console.error('Excel Import Error:', error);
            toast.error(error.message || 'Failed to import Excel file.', { id: loadingToast });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteRoom = async (id: string) => {
        try {
            await appwriteService.deleteRoom(id);
            await fetchData();
        } catch (error) {
            console.error('Failed to delete room:', error);
            alert('فشل في حذف الغرفة. يرجى التأكد من أنها فارغة أولاً.');
        }
    };

    const handleExport = async () => {
        const loadingToast = toast.loading('Syncing latest data before export...');
        try {
            setIsLoading(true); // Show spinner to ensure UI updates are blocked
            await fetchData();
            setIsLoading(false);
            toast.success('Data synced! Opening print view...', { id: loadingToast });

            // Give React more time to flush state updates to the DOM
            // and ensure images/fonts are ready if any
            setTimeout(() => {
                window.print();
            }, 1000);
        } catch (error) {
            console.error('Sync before export failed:', error);
            setIsLoading(false);
            toast.error('Failed to sync latest data. Printing current view anyway.', { id: loadingToast });
            window.print();
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
            const updatedRooms = rooms.map(room => {
                if (room.city === activeCity) {
                    return {
                        ...room,
                        assignments: room.assignments?.filter(a => a.clientId !== clientId) || []
                    };
                }
                return room;
            });
            setRooms(updatedRooms);

            try {
                await appwriteService.removeClientFromRoom(clientId, activeCity);
            } catch (error) {
                console.error('Unassign failed:', error);
                toast.error('Failed to unassign client');
                fetchData();
            }
            return;
        }

        const targetRoom = over.data.current.room;
        const roomId = targetRoom.id;
        const city = targetRoom.city;

        // Prevent overflow
        const roomToUpdate = rooms.find(r => r.id === roomId);
        if (roomToUpdate && (roomToUpdate.assignments?.length || 0) >= roomToUpdate.capacity) {
            toast.error('الغرفة ممتلئة!');
            return;
        }

        // Optimistic UI Update (IMPROVED: No mutation)
        const updatedRooms = rooms.map(room => {
            // 1. Remove client from any other room in the SAME CITY
            let newAssignments = room.assignments?.filter(a => a.clientId !== clientId) || [];

            // 2. Add to new room
            if (room.id === roomId) {
                newAssignments = [
                    ...newAssignments,
                    { id: 'temp-' + Date.now(), roomId, clientId, assignedAt: new Date().toISOString() }
                ];
            }

            return {
                ...room,
                assignments: newAssignments
            };
        });
        setRooms(updatedRooms);

        // Backend Sync
        lastDragTime.current = Date.now();
        try {
            await appwriteService.assignClientToRoom(roomId, clientId, city);
        } catch (error: any) {
            console.error('Assignment failed:', error);
            toast.error(error.message || 'فشل في تسكين المعتمر');
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchData()}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <div className="h-6 w-px bg-gray-200 mx-1" />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleExcelImport}
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors disabled:opacity-50"
                        >
                            {isImporting ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                            Import Excel
                        </button>
                        <button
                            onClick={() => setIsRoomFormOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                        >
                            <Plus size={18} />
                            Add Room
                        </button>
                        <button
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95"
                            onClick={handleExport}
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
                        {/* City Tabs */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl mb-8 w-fit mx-auto shadow-inner">
                            <button
                                onClick={() => setActiveCity('Makkah')}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${activeCity === 'Makkah' ? 'bg-white dark:bg-gray-700 shadow-xl text-blue-600 scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                تسكين مكة المكرمة
                            </button>
                            <button
                                onClick={() => setActiveCity('Madinah')}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${activeCity === 'Madinah' ? 'bg-white dark:bg-gray-700 shadow-xl text-blue-600 scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                تسكين المدينة المنورة
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {rooms.filter(r => r.city === activeCity).map((room) => (
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
                        initialCity={activeCity}
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
                            <h1 className="text-3xl font-bold text-gray-900">
                                تقرير لائحة التسكين - {activeCity === 'Makkah' ? 'مكة المكرمة' : 'المدينة المنورة'}
                            </h1>
                            <p className="text-blue-600 font-medium mt-1">Beausejour Voyage</p>
                        </div>
                        <div className="text-left" dir="ltr">
                            <p className="text-sm text-gray-500">التاريخ: {new Date().toLocaleDateString('ar-MA')}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {['Makkah', 'Madinah'].map((city) => {
                            const cityRooms = rooms.filter(r => r.city === city && (r.assignments?.length || 0) > 0);

                            if (cityRooms.length === 0) return null;

                            return (
                                <div key={city} className="space-y-6">
                                    <div className="bg-blue-50 border-r-4 border-blue-600 p-4 mb-4">
                                        <h2 className="text-xl font-bold text-blue-900">
                                            اللائحة الخاصة بـ: {city === 'Makkah' ? 'مكة المكرمة' : 'المدينة المنورة'}
                                        </h2>
                                    </div>

                                    {cityRooms.map((room) => {
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
                                                <table className="w-full text-right border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-200">
                                                            <th className="px-4 py-2 text-right text-sm text-gray-600 w-1/2">اسم المعتمر الكامل</th>
                                                            <th className="px-4 py-2 text-right text-sm text-gray-600">الجنس</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {roomClients.map((client) => (
                                                            <tr key={client.id} className="border-b border-gray-100">
                                                                <td className="px-4 py-3 font-semibold text-gray-900">{client.name}</td>
                                                                <td className="px-4 py-3 text-gray-700">{client.gender === 'Male' ? 'ذكر' : client.gender === 'Female' ? 'أنثى' : '---'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })}
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
