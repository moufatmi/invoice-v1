import React, { useState, useEffect } from 'react';
import {
    Users, Search, Edit2, Trash2,
    Filter,
    UserPlus, Phone,
    CreditCard, RefreshCw
} from 'lucide-react';
import { appwriteService } from '../services/appwriteService';
import { Client } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientModal from '../components/ClientModal';
import toast from 'react-hot-toast';

const ClientsPage: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const clientsData = await appwriteService.getClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Error fetching clients:', error);
            if (!silent) toast.error('Failed to load pilgrims.');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        document.title = 'Pilgrim Management - Invoice System';

        const onFocus = () => fetchData(true);
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const handleSaveClient = async (clientData: Partial<Client>) => {
        try {
            if (selectedClient?.id) {
                await appwriteService.updateClient(selectedClient.id, clientData);
                toast.success('Pilgrim updated successfully');
            } else {
                await appwriteService.createClient(clientData as Client);
                toast.success('Pilgrim added successfully');
            }
            await fetchData();
        } catch (error) {
            console.error('Error saving client:', error);
            throw error;
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (!window.confirm('بعد حذف هذا المعتمر، سيتم حذفه أيضاً من جميع قوائم التسكين المرتبطة به. هل أنت متأكد؟')) return;

        try {
            await appwriteService.deleteClient(id);
            toast.success('Pilgrim deleted successfully');
            await fetchData();
        } catch (error) {
            console.error('Error deleting client:', error);
            toast.error('Failed to delete pilgrim.');
        }
    };

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.passportNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-16" dir="rtl">
            {/* Page Header */}
            <div className="bg-white border-b px-8 py-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                <Users size={24} />
                            </div>
                            إدارة المعتمرين
                        </h1>
                        <p className="text-gray-500 mt-1">عرض وتعديل بيانات جميع المعتمرين المسجلين في النظام</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchData()}
                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100 hover:border-blue-200"
                            title="تحديث"
                        >
                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => {
                                setSelectedClient(null);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <UserPlus size={20} />
                            إضافة معتمر جديد
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-8">
                {/* Search & Filters */}
                <div className="mb-8 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="البحث عن معتمر (الاسم، رقم الجواز، الهاتف)..."
                            className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white rounded-2xl border border-gray-200 p-1.5 shadow-sm">
                        <button className="px-4 py-2 bg-gray-100 rounded-xl text-gray-600 font-medium flex items-center gap-2">
                            <Filter size={18} />
                            فلترة
                        </button>
                    </div>
                </div>

                {/* Table Layout */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">المعتمر</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">الجواز والجنس</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">معلومات الاتصال</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">العنوان</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users size={48} className="opacity-20" />
                                                <p>لم يتم العثور على أي معتمر بهذا البحث</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${client.gender === 'Female' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                                                        {client.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{client.name}</div>
                                                        <div className="text-xs text-gray-500">{client.email || 'بدون بريد'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                        <CreditCard size={14} className="text-gray-400" />
                                                        <span className="font-mono">{client.passportNumber || '---'}</span>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${client.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {client.gender === 'Female' ? 'أنثى' : 'ذكر'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <span dir="ltr">{client.phone || '---'}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {client.dateOfBirth ? `تاريخ الميلاد: ${client.dateOfBirth}` : ''}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                                                    {client.address || 'العنوان غير مسجل'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-left whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedClient(client);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="تعديل"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClient(client.id!)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Client Modal */}
            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveClient}
                editingClient={selectedClient}
            />
        </div>
    );
};

export default ClientsPage;
