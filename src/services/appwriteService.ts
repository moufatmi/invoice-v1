import { Query, ID } from 'appwrite';
import { databases, client, APPWRITE_CONFIG } from '../lib/appwrite';
import { Invoice, Client, Room } from '../types';
import { defaultAgents } from '../data/defaultAgents';

const sanitize = (data: any) => {
    const clean = { ...data };
    Object.keys(clean).forEach(key => {
        // Remove system fields, related data objects, and frontend-only properties
        if (key.startsWith('$') ||
            key === 'id' ||
            key === 'assignments' ||
            key === 'items' ||
            key === 'client' ||
            key === 'currentOccupancy' ||
            key === 'agentName' ||
            key === 'subtotal' ||
            key === 'tax' ||
            key === 'createdAt' ||
            key === 'updatedAt' ||
            key === 'clientName' ||
            key === 'clientEmail' ||
            key === 'total') {
            delete clean[key];
        }
    });
    return clean;
};

export const appwriteService = {
    // --- Invoices ---
    async getInvoices(): Promise<Invoice[]> {
        const [invoicesResponse, clientsResponse] = await Promise.all([
            databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.invoices,
                [Query.orderDesc('$createdAt'), Query.limit(100)]
            ),
            databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.clients,
                [Query.limit(100)]
            )
        ]);

        const clients = clientsResponse.documents.map(this.mapClientFromDb);

        return invoicesResponse.documents.map(doc => this.mapInvoiceFromDb(doc, clients));
    },

    async getInvoice(id: string): Promise<Invoice | null> {
        try {
            const doc = await databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.invoices,
                id
            );

            // For a single invoice, we can fetch the specific client if doc.clientId is just a string
            let clientObj = undefined;
            if (typeof doc.clientId === 'string') {
                try {
                    const clientDoc = await databases.getDocument(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collections.clients,
                        doc.clientId
                    );
                    clientObj = this.mapClientFromDb(clientDoc);
                } catch (e) {
                    console.error('Error fetching client for invoice:', e);
                }
            }

            return this.mapInvoiceFromDb(doc, clientObj ? [clientObj] : []);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            return null;
        }
    },

    async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
        // 1. Handle Client
        let clientId = invoice.client?.id;
        if (!clientId && invoice.client) {
            const newClient = await this.createClient(invoice.client);
            clientId = newClient.id;
        }

        // 2. Create Invoice
        const invoiceData = {
            ...sanitize(invoice),
            total: invoice.total,
            clientId: clientId || null // Relationship ID
        };

        const response = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.invoices,
            ID.unique(),
            invoiceData
        );

        // 3. Create Items
        if (invoice.items && invoice.items.length > 0) {
            await Promise.all(invoice.items.map(item =>
                databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.items,
                    ID.unique(),
                    {
                        ...sanitize(item),
                        invoiceId: response.$id // Relationship ID
                    }
                )
            ));
        }

        return this.getInvoice(response.$id) as Promise<Invoice>;
    },

    async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
        const updateData: any = sanitize(invoice);
        if (invoice.total !== undefined) updateData.total = invoice.total;

        await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.invoices,
            id,
            updateData
        );

        // Update items if provided (Appwrite doesn't have a simple bulk upsert, so we delete and recreate or selective update)
        if (invoice.items) {
            // Fetch existing items
            const existingItems = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.items,
                [Query.equal('invoiceId', id)]
            );

            // Delete existing
            await Promise.all(existingItems.documents.map(item =>
                databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.items, item.$id)
            ));

            // Create new
            await Promise.all(invoice.items.map(item =>
                databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.items,
                    ID.unique(),
                    {
                        ...sanitize(item),
                        invoiceId: id
                    }
                )
            ));
        }

        return this.getInvoice(id) as Promise<Invoice>;
    },

    async deleteInvoice(id: string): Promise<void> {
        await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.invoices,
            id
        );
        // Cascading deletes should be handled by Appwrite Relationship if set up to cascade, 
        // otherwise we iterate and delete items.
    },

    // --- Clients ---
    async getClients(): Promise<Client[]> {
        const response = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.clients,
            [Query.orderAsc('name'), Query.limit(100)]
        );
        return response.documents.map(this.mapClientFromDb);
    },

    async createClient(client: Client): Promise<Client> {
        const response = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.clients,
            ID.unique(),
            sanitize(client)
        );
        return this.mapClientFromDb(response);
    },

    async bulkCreateClients(clients: Omit<Client, 'id'>[]): Promise<Client[]> {
        // Appwrite doesn't have a bulk API, so we use Promise.all
        const results = await Promise.all(clients.map(c => this.createClient(c as any)));
        return results;
    },

    async updateClient(id: string, client: Partial<Client>): Promise<Client> {
        const updateData = sanitize(client);

        const response = await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.clients,
            id,
            updateData
        );
        return this.mapClientFromDb(response);
    },

    async deleteClient(id: string): Promise<void> {
        await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.clients,
            id
        );
    },

    // --- Rooms ---
    async getRooms(): Promise<Room[]> {
        const [roomsResponse, assignmentsResponse] = await Promise.all([
            databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.rooms,
                [Query.limit(100)]
            ),
            databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.assignments,
                [Query.limit(1000)]
            )
        ]);

        const assignments = assignmentsResponse.documents;

        return roomsResponse.documents.map(roomDoc => {
            const roomAssignments = assignments.filter((a: any) => {
                const rId = a.roomId?.$id || a.roomId;
                return rId === roomDoc.$id;
            });
            return this.mapRoomFromDb({ ...roomDoc, assignments: roomAssignments });
        });
    },

    async createRoom(room: Omit<Room, 'id' | 'assignments'>): Promise<Room> {
        const response = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.rooms,
            ID.unique(),
            sanitize(room)
        );
        return this.mapRoomFromDb(response);
    },

    async bulkCreateRooms(rooms: Omit<Room, 'id' | 'assignments'>[]): Promise<Room[]> {
        const results = await Promise.all(rooms.map(r => this.createRoom(r)));
        return results;
    },

    async updateRoom(id: string, room: Partial<Room>): Promise<Room> {
        const updateData = sanitize(room);

        const response = await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.rooms,
            id,
            updateData
        );
        return this.mapRoomFromDb(response);
    },

    async deleteRoom(id: string): Promise<void> {
        await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.rooms,
            id
        );
    },

    async assignClientToRoom(roomId: string, clientId: string, city: 'Makkah' | 'Madinah'): Promise<void> {
        // Clean up existing assignments in the same city
        const existing = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.assignments,
            [
                Query.equal('clientId', clientId)
            ]
        );

        await Promise.all(existing.documents.map(async (a: any) => {
            // If the city attribute exists and matches, or if we can't find it (legacy), delete it
            if (!a.city || a.city === city) {
                await databases.deleteDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.assignments,
                    a.$id
                ).catch(() => { });
            }
        }));

        await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.assignments,
            ID.unique(),
            {
                roomId,
                clientId,
                city, // New attribute for faster lookups/cleanup
                assignedAt: new Date().toISOString()
            }
        );
    },

    async removeClientFromRoom(clientId: string, city?: 'Makkah' | 'Madinah'): Promise<void> {
        const queries = [Query.equal('clientId', clientId)];
        if (city) queries.push(Query.equal('city', city));

        const existing = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.assignments,
            queries
        );

        await Promise.all(existing.documents.map(a =>
            databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.assignments, a.$id)
        ));
    },

    // --- Mappers ---
    mapInvoiceFromDb(doc: any, clients: Client[] = []): Invoice {
        const clientId = doc.clientId?.$id || doc.clientId;
        const clientObj = typeof doc.clientId === 'object' ? doc.clientId : clients.find(c => c.id === clientId);
        const agent = defaultAgents.find(a => a.id === doc.agentId);

        return {
            id: doc.$id,
            invoiceNumber: doc.invoiceNumber,
            clientName: clientObj?.name || 'Unknown',
            clientEmail: clientObj?.email || '',
            client: clientObj ? (typeof clientObj.id === 'string' ? clientObj as Client : this.mapClientFromDb(clientObj)) : undefined,
            agentId: doc.agentId,
            agentName: agent?.name || 'Unknown Agent',
            status: doc.status,
            dueDate: doc.dueDate,
            total: doc.total,
            notes: doc.notes,
            createdAt: doc.$createdAt,
            passportNumber: doc.passportNumber,
            gender: doc.gender,
            flightNumber: doc.flightNumber,
            roomType: doc.roomType,
            visaStatus: doc.visaStatus,
            departureDate: doc.departureDate,
            dateOfBirth: doc.dateOfBirth,
            items: doc.items?.map((item: any) => ({
                id: item.$id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                invoiceId: item.invoiceId
            })) || []
        };
    },

    mapClientFromDb(doc: any): Client {
        return {
            id: doc.$id,
            name: doc.name,
            email: doc.email,
            phone: doc.phone,
            address: doc.address,
            passportNumber: doc.passportNumber,
            gender: doc.gender,
            dateOfBirth: doc.dateOfBirth
        };
    },

    mapRoomFromDb(doc: any): Room {
        const assignments = doc.assignments?.map((a: any) => ({
            id: a.$id,
            roomId: a.roomId?.$id || a.roomId,
            clientId: a.clientId?.$id || a.clientId,
            city: a.city,
            assignedAt: a.assignedAt,
            client: a.clientId && typeof a.clientId === 'object' ? appwriteService.mapClientFromDb(a.clientId) : undefined
        })) || [];

        return {
            id: doc.$id,
            hotelName: doc.hotelName,
            city: doc.city,
            type: doc.type,
            capacity: doc.capacity,
            floorNumber: doc.floorNumber,
            roomNumber: doc.roomNumber,
            createdAt: doc.$createdAt,
            assignments: assignments,
            currentOccupancy: assignments.length
        };
    },

    // --- Real-time ---
    subscribeToChanges(callback: () => void) {
        return client.subscribe([
            `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.rooms}.documents`,
            `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.assignments}.documents`,
            `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.clients}.documents`
        ], () => {
            callback();
        });
    },

    unsubscribe(sub: any) {
        if (typeof sub === 'function') sub();
    }
};
