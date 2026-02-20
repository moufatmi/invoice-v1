import React, { useState } from 'react';
import { X, Save, Hotel, Users } from 'lucide-react';
import { Room } from '../../types';

interface RoomFormProps {
    onSave: (room: Omit<Room, 'id' | 'assignments'>) => void;
    onCancel: () => void;
    initialCity?: 'Makkah' | 'Madinah';
}

export const RoomForm: React.FC<RoomFormProps> = ({ onSave, onCancel, initialCity = 'Makkah' }) => {
    const [room, setRoom] = useState<Omit<Room, 'id' | 'assignments'>>({
        hotelName: '',
        city: initialCity,
        type: 'Double',
        capacity: 2,
        floorNumber: 0,
        roomNumber: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!room.hotelName) {
            alert('يرجى إدخال اسم الفندق');
            return;
        }
        onSave(room);
    };

    const handleTypeChange = (type: Room['type']) => {
        let capacity = 2;
        if (type === 'Triple') capacity = 3;
        if (type === 'Quad') capacity = 4;
        if (type === 'Quint') capacity = 5;
        setRoom({ ...room, type, capacity });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Hotel className="text-blue-600" />
                        إضافة غرفة جديدة
                    </h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">اسم الفندق</label>
                        <div className="relative">
                            <Hotel className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                required
                                type="text"
                                dir="rtl"
                                className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                placeholder="مثلاً: فندق دار التقوى"
                                value={room.hotelName}
                                onChange={e => setRoom({ ...room, hotelName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المدينة</label>
                        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl" dir="rtl">
                            <button
                                type="button"
                                onClick={() => setRoom({ ...room, city: 'Makkah' })}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${room.city === 'Makkah' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                مكة المكرمة
                            </button>
                            <button
                                type="button"
                                onClick={() => setRoom({ ...room, city: 'Madinah' })}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${room.city === 'Madinah' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                المدينة المنورة
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">نوع الغرفة</label>
                        <div className="grid grid-cols-2 gap-3" dir="rtl">
                            {['Double', 'Triple', 'Quad', 'Quint'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTypeChange(t as Room['type'])}
                                    className={`px-4 py-3 rounded-lg border text-sm font-bold transition-all ${room.type === t
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                        }`}
                                >
                                    {t === 'Double' ? 'ثنائية (2)' : t === 'Triple' ? 'ثلاثية (3)' : t === 'Quad' ? 'رباعية (4)' : 'خماسية (5)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex flex-row-reverse items-center justify-between">
                        <div className="flex flex-row-reverse items-center gap-2 text-blue-700 dark:text-blue-400 font-medium">
                            <Users size={20} />
                            طاقة الاستيعاب
                        </div>
                        <span className="text-2xl font-bold text-blue-800 dark:text-blue-300">{room.capacity}</span>
                    </div>

                    <div className="pt-4 flex gap-3 flex-row-reverse">
                        <button
                            type="submit"
                            className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all flex flex-row-reverse items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            حفظ الغرفة
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
