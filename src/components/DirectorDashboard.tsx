import React, { useState, useMemo } from 'react';
import { LogOut, Download, AlertCircle } from 'lucide-react';
import Layout from './Layout';
import InvoiceList from './InvoiceList';
import InvoiceView from './InvoiceView';
import InvoiceForm from './InvoiceForm';
import DashboardStats from './DashboardStats';
import { Invoice } from '../types';
import { useInvoices, useDashboardStats, useTodaysInvoices } from '../hooks/useLocalDb';
import { useAuth } from '../contexts/AuthContext';

interface DirectorDashboardProps {
  onLogout: () => void;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ onLogout }) => {
  const { agentProfile } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Fetch data from local DB
  const { invoices = [], isLoading: invoicesLoading, error: invoicesError, updateInvoice, deleteInvoice } = useInvoices();
  const { stats = {
    totalInvoices: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    pendingInvoices: 0,
    recentInvoices: []
  }, isLoading: statsLoading } = useDashboardStats();
  const { invoices: todaysInvoices = [], isLoading: todaysLoading } = useTodaysInvoices();

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseInvoiceView = () => {
    setSelectedInvoice(null);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setSelectedInvoice(null);
  };

  const handleUpdateInvoice = async (invoiceData: any) => {
    if (!editingInvoice) {
      alert('No invoice selected for update');
      return;
    }

    try {
      const items = invoiceData.items.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      }));

      await updateInvoice(editingInvoice.id!, {
        client: {
          name: invoiceData.client.name,
          email: invoiceData.client.email,
          phone: invoiceData.client.phone,
          address: invoiceData.client.address
        },
        subtotal: invoiceData.subtotal,
        tax: invoiceData.tax,
        total: invoiceData.total,
        status: invoiceData.status,
        dueDate: invoiceData.dueDate,
        notes: invoiceData.notes
      }, items);

      setEditingInvoice(null);
      alert('Invoice updated successfully!');
    } catch (error) {
      console.error('Error updating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await deleteInvoice(id);
        alert('Invoice deleted successfully');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: 'draft' | 'sent' | 'paid' | 'overdue') => {
    try {
      await updateInvoice(invoiceId, { status: newStatus });
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({ ...selectedInvoice, status: newStatus });
      }

      const statusMessages = {
        draft: 'Invoice moved to draft',
        sent: 'Invoice marked as sent to client',
        paid: 'Invoice marked as paid - great job!',
        overdue: 'Invoice marked as overdue'
      };

      alert(statusMessages[newStatus]);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  };

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a: Invoice, b: Invoice) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices]);

  if (invoicesLoading || statsLoading || todaysLoading) {
    return (
      <Layout
        title="Director Dashboard"
        userType="director"
        userName={agentProfile?.name || 'Director'}
        onLogout={onLogout}
      >
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (invoicesError) {
    return (
      <Layout
        title="Director Dashboard"
        userType="director"
        userName={agentProfile?.name || 'Director'}
        onLogout={onLogout}
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 dark:text-red-200 mb-2">Connection Error</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{invoicesError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  if (editingInvoice) {
    return (
      <Layout
        title="Edit Invoice"
        userType="director"
        userName={agentProfile?.name || 'Director'}
        onLogout={onLogout}
      >
        <InvoiceForm
          onSave={handleUpdateInvoice}
          onCancel={() => setEditingInvoice(null)}
          editingInvoice={editingInvoice}
        />
      </Layout>
    );
  }

  if (selectedInvoice) {
    return (
      <Layout
        title="Invoice Details"
        userType="director"
        userName={agentProfile?.name || 'Director'}
        onLogout={onLogout}
      >
        <InvoiceView
          invoice={selectedInvoice}
          onClose={handleCloseInvoiceView}
          onEdit={() => handleEditInvoice(selectedInvoice)}
          onStatusUpdate={handleStatusUpdate}
        />
      </Layout>
    );
  }

  return (
    <Layout
      title="Director Dashboard"
      userType="director"
      userName={agentProfile?.name || 'Director'}
      onLogout={onLogout}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Director Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of all agency operations</p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats stats={stats} />

      {/* Invoice List */}
      <InvoiceList
        invoices={sortedInvoices}
        onView={handleViewInvoice}
        onEdit={handleEditInvoice}
        onDelete={handleDeleteInvoice}
        title="All Invoices"
      />
    </Layout>
  );
};

export default DirectorDashboard;