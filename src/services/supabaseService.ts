
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceItem, Client, Room } from '../types';

export const supabaseService = {
    // --- Invoices ---
    async getInvoices(): Promise<Invoice[]> {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, items(*), clients(*)');

        if (error) throw error;

        return data.map(this.mapInvoiceFromDb);
    },

    async getInvoice(id: string): Promise<Invoice | null> {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, items(*), clients(*)')
            .eq('id', id)
            .single();

        if (error) return null;

        return this.mapInvoiceFromDb(data);
    },

    async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
        // 1. Create or get client
        let clientId = invoice.client?.id;
        if (!clientId && invoice.client) {
            const newClient = await this.createClient(invoice.client);
            clientId = newClient.id;
        }

        // 2. Insert Invoice
        const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                client_id: clientId,
                agent_id: invoice.agentId,
                invoice_number: invoice.invoiceNumber,
                status: invoice.status,
                due_date: invoice.dueDate && !isNaN(Date.parse(invoice.dueDate)) ? new Date(invoice.dueDate).toISOString() : new Date().toISOString(),
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                total: invoice.total,
                notes: invoice.notes,
                passport_number: invoice.passportNumber,
                gender: invoice.gender,
                flight_number: invoice.flightNumber,
                room_type: invoice.roomType,
                visa_status: invoice.visaStatus,
                departure_date: invoice.departureDate && !isNaN(Date.parse(invoice.departureDate)) ? new Date(invoice.departureDate).toISOString() : null,
                date_of_birth: invoice.dateOfBirth && !isNaN(Date.parse(invoice.dateOfBirth)) ? new Date(invoice.dateOfBirth).toISOString() : null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (invoiceError) throw invoiceError;

        // Sync client info if provided
        if (clientId && (invoice.passportNumber || invoice.gender || invoice.dateOfBirth)) {
            await this.updateClient(clientId, {
                passportNumber: invoice.passportNumber,
                gender: invoice.gender,
                dateOfBirth: invoice.dateOfBirth
            });
        }

        // 3. Insert Items
        if (invoice.items && invoice.items.length > 0) {
            const itemsToInsert = invoice.items.map(item => ({
                invoice_id: invoiceData.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice
            }));

            const { error: itemsError } = await supabase
                .from('items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return this.getInvoice(invoiceData.id) as Promise<Invoice>;
    },

    async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
        // Update main invoice fields
        const { error: invoiceError } = await supabase
            .from('invoices')
            .update({
                status: invoice.status,
                due_date: invoice.dueDate && !isNaN(Date.parse(invoice.dueDate)) ? new Date(invoice.dueDate).toISOString() : undefined,
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                total: invoice.total,
                notes: invoice.notes,
                passport_number: invoice.passportNumber,
                gender: invoice.gender,
                flight_number: invoice.flightNumber,
                room_type: invoice.roomType,
                visa_status: invoice.visaStatus,
                departure_date: invoice.departureDate && !isNaN(Date.parse(invoice.departureDate)) ? new Date(invoice.departureDate).toISOString() : null,
                date_of_birth: invoice.dateOfBirth && !isNaN(Date.parse(invoice.dateOfBirth)) ? new Date(invoice.dateOfBirth).toISOString() : null
            })
            .eq('id', id);

        if (invoiceError) throw invoiceError;

        // Sync client info if provided
        if (invoice.client?.id && (invoice.passportNumber || invoice.gender || invoice.dateOfBirth)) {
            await this.updateClient(invoice.client.id, {
                passportNumber: invoice.passportNumber,
                gender: invoice.gender,
                dateOfBirth: invoice.dateOfBirth
            });
        }

        // Update items (delete all and recreate for simplicity, or smart update)
        if (invoice.items) {
            await supabase.from('items').delete().eq('invoice_id', id);

            const itemsToInsert = invoice.items.map(item => ({
                invoice_id: id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice
            }));

            await supabase.from('items').insert(itemsToInsert);
        }

        return this.getInvoice(id) as Promise<Invoice>;
    },

    async deleteInvoice(id: string): Promise<void> {
        // 1. Get client ID before deleting invoice
        const { data: invoice } = await supabase
            .from('invoices')
            .select('client_id')
            .eq('id', id)
            .single();

        const clientId = invoice?.client_id;

        // 2. Delete the invoice
        const { error: deleteError } = await supabase.from('invoices').delete().eq('id', id);
        if (deleteError) throw deleteError;

        // 3. If we have a client ID, check if the client has any other invoices
        if (clientId) {
            const { count, error: countError } = await supabase
                .from('invoices')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', clientId);

            if (!countError && count === 0) {
                // If no other invoices exist, delete the client
                // This will also cascade delete any room assignments due to DB FK setup
                await supabase.from('clients').delete().eq('id', clientId);
            }
        }
    },

    // --- Clients ---
    async getClients(): Promise<Client[]> {
        const { data, error } = await supabase.from('clients').select('*');
        if (error) throw error;
        return data.map(this.mapClientFromDb);
    },

    async createClient(client: Client): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .insert({
                name: client.name,
                email: client.email,
                phone: client.phone,
                address: client.address,
                passport_number: client.passportNumber,
                gender: client.gender,
                date_of_birth: client.dateOfBirth && client.dateOfBirth.trim() !== '' ? client.dateOfBirth : null
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapClientFromDb(data);
    },

    async updateClient(id: string, client: Partial<Client>): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .update({
                name: client.name,
                email: client.email,
                phone: client.phone,
                address: client.address,
                passport_number: client.passportNumber,
                gender: client.gender,
                date_of_birth: client.dateOfBirth && client.dateOfBirth.trim() !== '' ? client.dateOfBirth : undefined
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapClientFromDb(data);
    },

    // --- Helpers ---
    mapInvoiceFromDb(dbInvoice: any): Invoice {
        const clientData = Array.isArray(dbInvoice.clients) ? dbInvoice.clients[0] : dbInvoice.clients;

        return {
            id: dbInvoice.id,
            invoiceNumber: dbInvoice.invoice_number,
            clientName: clientData?.name || 'Unknown',
            clientEmail: clientData?.email || '',
            client: clientData ? supabaseService.mapClientFromDb(clientData) : undefined,
            agentId: dbInvoice.agent_id,
            status: dbInvoice.status,
            dueDate: dbInvoice.due_date,
            subtotal: dbInvoice.subtotal,
            tax: dbInvoice.tax,
            total: dbInvoice.total,
            notes: dbInvoice.notes,
            createdAt: dbInvoice.created_at,
            passportNumber: dbInvoice.passport_number,
            gender: dbInvoice.gender,
            flightNumber: dbInvoice.flight_number,
            roomType: dbInvoice.room_type,
            visaStatus: dbInvoice.visa_status,
            departureDate: dbInvoice.departure_date,
            dateOfBirth: dbInvoice.date_of_birth,
            items: dbInvoice.items?.map((item: any) => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                total: item.quantity * item.unit_price,
                invoiceId: item.invoice_id
            })) || []
        };
    },


    mapClientFromDb(dbClient: any): Client {
        return {
            id: dbClient.id,
            name: dbClient.name,
            email: dbClient.email,
            phone: dbClient.phone,
            address: dbClient.address,
            passportNumber: dbClient.passport_number,
            gender: dbClient.gender,
            dateOfBirth: dbClient.date_of_birth
        };
    },

    // --- Rooms ---
    async getRooms(): Promise<Room[]> {
        const { data, error } = await supabase
            .from('rooms')
            .select(`
                *,
                assignments:room_assignments(
                    *,
                    client:clients(*)
                )
            `);

        if (error) throw error;
        return data.map(this.mapRoomFromDb);
    },

    async createRoom(room: Omit<Room, 'id' | 'assignments'>): Promise<Room> {
        const { data, error } = await supabase
            .from('rooms')
            .insert({
                hotel_name: room.hotelName,
                city: room.city,
                type: room.type,
                capacity: room.capacity,
                floor_number: room.floorNumber,
                room_number: room.roomNumber
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapRoomFromDb(data);
    },

    async deleteRoom(id: string): Promise<void> {
        const { error } = await supabase.from('rooms').delete().eq('id', id);
        if (error) throw error;
    },

    async assignClientToRoom(roomId: string, clientId: string): Promise<void> {
        // First remove client from any other room (since unique constraint exists, but let's be safe)
        // Actually, the unique constraint on client_id in DB handles this, but we might want to clean up gracefully
        await supabase.from('room_assignments').delete().eq('client_id', clientId);

        const { error } = await supabase.from('room_assignments').insert({
            room_id: roomId,
            client_id: clientId
        });

        if (error) throw error;
    },

    async removeClientFromRoom(clientId: string): Promise<void> {
        const { error } = await supabase.from('room_assignments').delete().eq('client_id', clientId);
        if (error) throw error;
    },

    mapRoomFromDb(dbRoom: any): Room {
        const assignments = dbRoom.assignments?.map((a: any) => ({
            id: a.id,
            roomId: a.room_id,
            clientId: a.client_id,
            assignedAt: a.assigned_at,
            client: a.client ? supabaseService.mapClientFromDb(a.client) : undefined
        })) || [];

        return {
            id: dbRoom.id,
            hotelName: dbRoom.hotel_name,
            city: dbRoom.city || 'Makkah', // Default to Makkah if missing
            type: dbRoom.type,
            capacity: dbRoom.capacity,
            floorNumber: dbRoom.floor_number,
            roomNumber: dbRoom.room_number,
            createdAt: dbRoom.created_at,
            assignments: assignments,
            currentOccupancy: assignments.length
        };
    }
};
