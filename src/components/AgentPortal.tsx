import React, { useState } from 'react';
import { Plus, Calendar, TrendingUp, AlertCircle, LogOut } from 'lucide-react';
import Layout from './Layout';
import InvoiceForm from './InvoiceForm';
import InvoiceList from './InvoiceList';
import InvoiceView from './InvoiceView';
import DashboardStats from './DashboardStats';
import AllInvoicesView from './AllInvoicesView';
import { Invoice } from '../types';
import { useInvoices, useDashboardStats, useTodaysInvoices, useAgents } from '../hooks/useLocalDb';
import { useAuth } from '../contexts/AuthContext';

interface AgentPortalProps {
  // Removed onDirectorLogin prop since it's no longer needed
}

const AgentPortal: React.FC<AgentPortalProps> = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'edit' | 'view' | 'all-invoices'>('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { agentProfile, signOut } = useAuth();

  // Use the authenticated agent's ID
  const currentAgentId = agentProfile?.id;

  const { invoices = [], error: invoicesError, createInvoice, updateInvoice, deleteInvoice } = useInvoices(currentAgentId);
  const { stats = { totalInvoices: 0, totalRevenue: 0, paidInvoices: 0, unpaidInvoices: 0, pendingInvoices: 0, recentInvoices: [] } } = useDashboardStats(currentAgentId);
  const { invoices: todaysInvoices = [] } = useTodaysInvoices(currentAgentId);
  const { agents = [], isLoading: agentsLoading } = useAgents();

  // Show loading state if agent profile is not loaded yet
  if (!agentProfile) {
    return (
      <Layout title="Agent Portal">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Get current agent info
  const currentAgent = agents.find(agent => agent.id === currentAgentId) || agentProfile;

  // Show loading state if any critical data is still loading
  if (agentsLoading && !currentAgent) {
    return (
      <Layout title="Agent Portal">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error if there's a critical error
  if (invoicesError) {
    return (
      <Layout title="Agent Portal">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error loading invoices</p>
            <p className="text-sm text-gray-600 mb-4">{invoicesError}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
              <p className="text-xs text-gray-500">
                If the problem persists, check your internet connection
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSaveInvoice = async (invoiceData: any) => {
    if (!currentAgentId) {
      alert('You must be logged in to create invoices');
      return;
    }

    if (!currentAgent) {
      alert('Agent profile not found. Please contact support.');
      return;
    }

    try {
      console.log('Creating invoice for agent:', currentAgentId, currentAgent);

      const newInvoice = {
        ...invoiceData,
        agentId: currentAgentId,
        clientName: invoiceData.client?.name || invoiceData.clientName || 'Unknown Client',
        clientEmail: invoiceData.client?.email || invoiceData.clientEmail || '',
        createdAt: new Date().toISOString()
      };

      await createInvoice(newInvoice, invoiceData.items || []);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error creating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice. Please try again.';
      alert(errorMessage);
    }
  };

  const handleUpdateInvoice = async (invoiceData: any) => {
    if (!selectedInvoice?.id) {
      alert('No invoice selected for update');
      return;
    }

    try {
      console.log('Updating invoice:', selectedInvoice.id, invoiceData);

      const updates = {
        ...invoiceData,
        clientName: invoiceData.client?.name || invoiceData.clientName || 'Unknown Client',
        clientEmail: invoiceData.client?.email || invoiceData.clientEmail || ''
      };

      await updateInvoice(selectedInvoice.id, updates, invoiceData.items);
      setCurrentView('dashboard');
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice. Please try again.';
      alert(errorMessage);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('view');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('edit');
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: 'draft' | 'sent' | 'paid' | 'overdue') => {
    try {
      await updateInvoice(invoiceId, { status: newStatus });

      // Update the selected invoice if it's the one being updated
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({ ...selectedInvoice, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Failed to update invoice status. Please try again.');
    }
  };

  // Render different views based on current view state
  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <InvoiceForm
            key="create-invoice"
            onSave={handleSaveInvoice}
            onCancel={() => setCurrentView('dashboard')}
            currentAgent={currentAgent}
          />
        );
      case 'edit':
        return selectedInvoice ? (
          <InvoiceForm
            key={`edit-invoice-${selectedInvoice.id}`}
            editingInvoice={selectedInvoice}
            onSave={handleUpdateInvoice}
            onCancel={() => setCurrentView('dashboard')}
            currentAgent={currentAgent}
          />
        ) : null;
      case 'view':
        return selectedInvoice ? (
          <InvoiceView
            invoice={selectedInvoice}
            onEdit={() => setCurrentView('edit')}
            onClose={() => setCurrentView('dashboard')}
            onStatusUpdate={handleStatusUpdate}
          />
        ) : null;
      case 'all-invoices':
        return (
          <AllInvoicesView
            invoices={invoices}
            onView={handleViewInvoice}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      default:
        return (
          <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome, {currentAgent?.name || 'Agent'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your invoices and track payments
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Invoice</span>
                </button>
                <button
                  onClick={signOut}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Dashboard Stats */}
            <DashboardStats stats={stats} />

            {/* Today's Invoices */}
            {todaysInvoices.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Today's Invoices
                  </h2>
                  <span className="text-sm text-gray-500">
                    {todaysInvoices.length} invoices
                  </span>
                </div>
                <InvoiceList
                  invoices={todaysInvoices}
                  onView={handleViewInvoice}
                  onEdit={handleEditInvoice}
                  onDelete={handleDeleteInvoice}
                  title="Today's Invoices"
                />
              </div>
            )}

            {/* Recent Invoices */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Recent Invoices
                </h2>
                <button
                  onClick={() => setCurrentView('all-invoices')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <InvoiceList
                invoices={invoices.slice(0, 5)}
                onView={handleViewInvoice}
                onEdit={handleEditInvoice}
                onDelete={handleDeleteInvoice}
                title="Recent Invoices"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Layout title="Agent Portal">
      {renderContent()}
    </Layout>
  );
};

export default AgentPortal;
