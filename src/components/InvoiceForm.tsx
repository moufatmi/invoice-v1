import React, { useState, useRef } from 'react';
import { Plus, Trash2, Save, Send, User, Plane, FileText, Bed, Calendar, Scan, Loader2 } from 'lucide-react';
import { Invoice, Client, InvoiceItem, Agent } from '../types';
import { generateInvoiceNumber, calculateItemTotal, calculateSubtotal, calculateTax, calculateTotal, formatCurrency } from '../utils/helpers';
import { TRAVEL_SERVICES, TAX_RATE } from '../utils/constants';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../utils/translations';
import { extractPassportDetails } from '../services/ocrService';
import toast from 'react-hot-toast';

interface InvoiceFormProps {
  onSave: (invoice: any) => void;
  onCancel: () => void;
  currentAgent?: Agent;
  editingInvoice?: Invoice;
}

const formatDateForInput = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel, currentAgent, editingInvoice }) => {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [client, setClient] = useState<Client>({
    id: editingInvoice?.client?.id || '',
    name: editingInvoice?.client?.name || editingInvoice?.clientName || '',
    email: editingInvoice?.client?.email || editingInvoice?.clientEmail || '',
    phone: editingInvoice?.client?.phone || '',
    address: editingInvoice?.client?.address || '',
    passportNumber: editingInvoice?.client?.passportNumber || '',
    gender: editingInvoice?.client?.gender,
    dateOfBirth: editingInvoice?.client?.dateOfBirth || ''
  });

  const [items, setItems] = useState<InvoiceItem[]>(
    editingInvoice?.items || [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0, invoiceId: '' }]
  );

  const [dueDate, setDueDate] = useState(formatDateForInput(editingInvoice?.dueDate || editingInvoice?.createdAt));
  const [notes, setNotes] = useState(editingInvoice?.notes || '');

  // Umrah Specific States
  const [passportNumber, setPassportNumber] = useState(editingInvoice?.passportNumber || '');
  const [gender, setGender] = useState<'Male' | 'Female' | undefined>(editingInvoice?.gender);
  const [flightNumber, setFlightNumber] = useState(editingInvoice?.flightNumber || '');
  const [roomType, setRoomType] = useState<Invoice['roomType']>(editingInvoice?.roomType || 'Double');
  const [visaStatus, setVisaStatus] = useState<Invoice['visaStatus']>(editingInvoice?.visaStatus || 'Pending');
  const [departureDate, setDepartureDate] = useState(formatDateForInput(editingInvoice?.departureDate));
  const [dateOfBirth, setDateOfBirth] = useState(formatDateForInput(editingInvoice?.dateOfBirth));


  const handlePassportScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const extractedData = await extractPassportDetails(base64String);

        // Auto-fill form fields
        if (extractedData.name) setClient(prev => ({ ...prev, name: extractedData.name! }));
        if (extractedData.passportNumber) {
          setClient(prev => ({ ...prev, passportNumber: extractedData.passportNumber }));
          setPassportNumber(extractedData.passportNumber);
        }
        if (extractedData.gender) {
          setClient(prev => ({ ...prev, gender: extractedData.gender }));
          setGender(extractedData.gender);
        }
        if (extractedData.dateOfBirth) {
          setClient(prev => ({ ...prev, dateOfBirth: extractedData.dateOfBirth }));
          setDateOfBirth(extractedData.dateOfBirth);
        }
        if (extractedData.address) setClient(prev => ({ ...prev, address: extractedData.address! }));
        if (extractedData.flightNumber) setFlightNumber(extractedData.flightNumber);
        if (extractedData.departureDate) setDepartureDate(extractedData.departureDate);
        if (extractedData.visaStatus) setVisaStatus(extractedData.visaStatus);

        toast.success('Passport details extracted successfully!');
      } catch (error: any) {
        console.error('OCR Error:', error);
        toast.error(error.message || t('ocrError'));
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0, invoiceId: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = calculateItemTotal(updatedItem.quantity, updatedItem.unitPrice);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal, TAX_RATE);
  const total = calculateTotal(subtotal, tax);

  const handleSubmit = (newStatus: Invoice['status']) => {
    if (!client.name || !client.email) {
      alert('Please fill in required client information');
      return;
    }

    if (items.some(item => !item.description || !item.quantity || !item.unitPrice)) {
      alert('Please complete all item details');
      return;
    }

    const invoice = {
      ...(editingInvoice?.id ? { id: editingInvoice.id } : {}),
      invoiceNumber: editingInvoice?.invoiceNumber || generateInvoiceNumber(),
      client: {
        ...client,
        ...(editingInvoice?.client?.id ? { id: editingInvoice.client.id } : {})
      },
      agentId: currentAgent?.id || editingInvoice?.agentId || '',
      agentName: currentAgent?.name || editingInvoice?.agentName || 'Unknown Agent',
      items,
      subtotal,
      tax,
      total,
      status: newStatus,
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      dueDate: dueDate,
      notes,
      // Umrah Fields
      passportNumber,
      gender,
      flightNumber,
      roomType,
      visaStatus,
      departureDate,
      dateOfBirth
    };

    onSave(invoice);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingInvoice ? (language === 'ar' ? 'تعديل الفاتورة' : 'Edit Invoice') : t('createInvoice')}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
        >
          <Trash2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Client Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-[#03989e]" />
          Client Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
              placeholder="Enter client name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={client.email}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
              placeholder="client@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={client.phone}
              onChange={(e) => setClient({ ...client, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <input
              type="text"
              value={client.address}
              onChange={(e) => setClient({ ...client, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      {/* Umrah Details Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Plane className="w-5 h-5 text-[#03989e]" />
            {t('umrahDetails')}
          </h3>

          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePassportScan}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-[#03989e] text-white rounded-lg hover:bg-[#02868b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('scanning')}
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  {t('scanPassport')}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Passport Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('passportNumber')}
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
                placeholder={t('passportNumber')}
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('gender')}
            </label>
            <div className="flex gap-4 h-[50px] items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={gender === 'Male'}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                  className="w-4 h-4 text-[#03989e] focus:ring-[#03989e]"
                />
                <span className="text-gray-700 dark:text-gray-300">{t('male')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={gender === 'Female'}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                  className="w-4 h-4 text-[#03989e] focus:ring-[#03989e]"
                />
                <span className="text-gray-700 dark:text-gray-300">{t('female')}</span>
              </label>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('dateOfBirth')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Flight Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('flightNumber')}
            </label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
                placeholder="SVW123"
              />
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('roomType')}
            </label>
            <div className="relative">
              <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
                style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
              >
                <option value="Double">{t('double')}</option>
                <option value="Triple">{t('triple')}</option>
                <option value="Quad">{t('quad')}</option>
                <option value="Quint">{t('quint')}</option>
              </select>
            </div>
          </div>

          {/* Visa Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('visaStatus')}
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={visaStatus}
                onChange={(e) => setVisaStatus(e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
                style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
              >
                <option value="Pending">{t('visaPending')}</option>
                <option value="Issued">{t('visaIssued')}</option>
              </select>
            </div>
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('departureDate')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
              />
            </div>
          </div>
        </div>
      </div>


      {/* Invoice Items */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Services & Items</h3>
          <button
            onClick={addItem}
            className="text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            style={{ backgroundColor: '#03989e' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#027a7f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#03989e';
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service/Description *
                  </label>
                  <select
                    value={item.description || ''}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
                  >
                    <option value="">Select a service</option>
                    {TRAVEL_SERVICES.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity ?? 0}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice ?? 0}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-600 rounded-lg text-gray-900 dark:text-white font-medium">
                    {formatCurrency(item.total || 0)}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="w-full p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Invoice Summary */}
      <div className="mb-8">
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Summary</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tax ({(TAX_RATE * 100).toFixed(0)}%):</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(tax)}</span>
            </div>
            <div className="border-t dark:border-gray-600 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="text-lg font-bold" style={{ color: '#03989e' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          style={{ '--tw-ring-color': '#03989e' } as React.CSSProperties}
          placeholder="Add any additional notes or terms..."
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          Cancel
        </button>

        <button
          onClick={() => handleSubmit('draft')}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
        >
          <Save className="h-4 w-4" />
          <span>{editingInvoice ? 'Update as Draft' : 'Save as Draft'}</span>
        </button>

        <button
          onClick={() => handleSubmit('sent')}
          className="px-6 py-3 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
          style={{ backgroundColor: '#03989e' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#027a7f';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#03989e';
          }}
        >
          <Send className="h-4 w-4" />
          <span>{editingInvoice ? 'Update & Send' : 'Create & Send'}</span>
        </button>
      </div>
    </div >
  );
};

export default InvoiceForm;