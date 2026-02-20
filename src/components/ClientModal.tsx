import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, CreditCard, Calendar, Check } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (clientData: Partial<Client>) => Promise<void>;
    editingClient?: Client | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, editingClient }) => {
    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        email: '',
        phone: '',
        address: '',
        passportNumber: '',
        gender: 'Male',
        dateOfBirth: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingClient) {
            setFormData(editingClient);
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                passportNumber: '',
                gender: 'Male',
                dateOfBirth: ''
            });
        }
    }, [editingClient, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Failed to save pilgrim details. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity" dir="rtl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <User className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        {editingClient ? 'تعديل بيانات المعتمر' : 'إضافة معتمر جديد'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
                            <div className="relative">
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="مثال: محمد العلوي"
                                />
                            </div>
                        </div>

                        {/* Passport */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">رقم الجواز</label>
                            <div className="relative">
                                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="passportNumber"
                                    value={formData.passportNumber || ''}
                                    onChange={handleChange}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="مثال: AB123456"
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">الجنس</label>
                            <select
                                name="gender"
                                value={formData.gender || 'Male'}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Male">ذكر</option>
                                <option value="Female">أنثى</option>
                            </select>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                            <div className="relative">
                                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-left"
                                    placeholder="06..."
                                />
                            </div>
                        </div>

                        {/* DOB */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">تاريخ الميلاد</label>
                            <div className="relative">
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth || ''}
                                    onChange={handleChange}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-left"
                                    placeholder="example@mail.com"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
                            <div className="relative">
                                <MapPin className="absolute right-3 top-3 text-gray-400" size={18} />
                                <textarea
                                    name="address"
                                    value={formData.address || ''}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="العنوان الكامل للمعتمر..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Check size={20} />
                                    {editingClient ? 'حفظ التغييرات' : 'إضافة المعتمر'}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientModal;
