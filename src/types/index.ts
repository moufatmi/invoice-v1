
export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  invoiceId: string;
}

export interface Client {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  passportNumber?: string;
  gender?: 'Male' | 'Female';
  dateOfBirth?: string;
}

export interface Invoice {
  id?: string;
  clientName: string;
  clientEmail: string;
  agentId: string;
  subtotal?: number;
  tax?: number;
  total: number;
  items?: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  dueDate?: string;
  invoiceNumber?: string;
  client?: Client;
  agentName?: string;
  // Umrah Specific Fields
  passportNumber?: string;
  gender?: 'Male' | 'Female';
  flightNumber?: string;
  roomType?: 'Double' | 'Triple' | 'Quad' | 'Quint';
  visaStatus?: 'Pending' | 'Issued';
  departureDate?: string;
  dateOfBirth?: string;
}

export interface Agent {
  id?: string;
  name: string;
  email: string;
  role: 'agent' | 'director';
  department?: string;
}

export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  pendingInvoices: number;
  recentInvoices: Invoice[];
}

export interface Setting {
  id: string;
  theme: 'light' | 'dark';
  language: 'fr' | 'en';
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
}

export interface User {
  id: string;
  password: string;
  role: 'agent' | 'director';
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface Room {
  id: string;
  hotelName: string;
  type: 'Double' | 'Triple' | 'Quad' | 'Quint';
  capacity: number;
  floorNumber?: number;
  roomNumber?: string;
  createdAt?: string;
  assignments?: RoomAssignment[]; // Joined data
  // UI helpers
  currentOccupancy?: number;
}

export interface RoomAssignment {
  id: string;
  roomId: string;
  clientId: string;
  assignedAt: string;
  client?: Client; // Joined data
}