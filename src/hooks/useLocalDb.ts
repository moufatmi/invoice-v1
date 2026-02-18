import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Invoice, Agent, InvoiceItem, DashboardStats } from '../types';

export function useInvoices(agentId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      let data = await supabaseService.getInvoices();
      if (agentId) {
        data = data.filter(inv => inv.agentId === agentId);
      }
      // Sort in memory since Supabase ordering might be basic
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setInvoices(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const createInvoice = async (invoice: Omit<Invoice, 'id'>, items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]) => {
    try {
      const fullInvoice = { ...invoice, items } as any;
      await supabaseService.createInvoice(fullInvoice);
      await fetchInvoices();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create invoice');
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>, items?: InvoiceItem[]) => {
    try {
      const fullUpdates = { ...updates, items } as any;
      await supabaseService.updateInvoice(id, fullUpdates);
      await fetchInvoices();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update invoice');
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await supabaseService.deleteInvoice(id);
      await fetchInvoices();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete invoice');
    }
  };

  return {
    invoices,
    isLoading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refetch: fetchInvoices
  };
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      // For now, mock agents or fetch if table exists. 
      // Supabase migration didn't strictly include 'agents' table yet, relying on 'users' usually.
      // We will return the default mock agents for now to keep the app working until Auth is fully migrated.
      const { defaultAgents } = await import('../data/defaultAgents');
      setAgents(defaultAgents);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      setError(err.message || 'Failed to fetch agents');
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    isLoading,
    error,
    refetch: fetchAgents
  };
}

export function useDashboardStats(agentId?: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    recentInvoices: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      let invoices = await supabaseService.getInvoices();
      if (agentId) {
        invoices = invoices.filter(inv => inv.agentId === agentId);
      }

      const paidInvoicesHeaders = invoices.filter(inv => inv.status === 'paid');
      const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft');
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

      setStats({
        totalInvoices: invoices.length,
        paidInvoices: paidInvoicesHeaders.length,
        unpaidInvoices: overdueInvoices.length, // 'unpaid' in stats usually means overdue or outstanding
        pendingInvoices: pendingInvoices.length,
        totalRevenue: paidInvoicesHeaders.reduce((sum, inv) => sum + inv.total, 0),
        recentInvoices: invoices.slice(0, 5) // Invoices are already sorted in getInvoices if we did it right, otherwise sort here
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard stats');
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
}

export function useTodaysInvoices(agentId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaysInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let allInvoices = await supabaseService.getInvoices();

      let todaysInvoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate >= today;
      });

      if (agentId) {
        todaysInvoices = todaysInvoices.filter(inv => inv.agentId === agentId);
      }

      setInvoices(todaysInvoices);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch today\'s invoices');
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchTodaysInvoices();
  }, [fetchTodaysInvoices]);

  return {
    invoices,
    isLoading,
    error,
    refetch: fetchTodaysInvoices
  };
}
