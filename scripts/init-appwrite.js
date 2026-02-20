const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

// --- CONFIGURATION ---
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6998683e0023e334f519';
const API_KEY = 'standard_c71013156d8c1797ff538e456cfff13f8d35a7fe6994896061f389391559be72daf505be311f481690394947585813331a754d9f405b43dd06b2931999f58b122cb98210f77aa3a2f370b722963c3d134a8bc66acad7c138c4831fc193e72796c254831098ccd2e98f8c0d4d4e0fc080ff3ccaf07ba5f554b9d36830ce795b59';
// ---------------------

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

// Fixed IDs for consistency
const DB_ID = 'invoice_manager_db';
const COLL_CLIENTS = 'clients';
const COLL_INVOICES = 'invoices';
const COLL_ITEMS = 'items';
const COLL_ROOMS = 'rooms';
const COLL_ASSIGNMENTS = 'assignments';

async function createAttribute(dbId, collId, name, type, options = {}) {
    try {
        console.log(`  - Creating attribute: ${name} (${type})...`);
        switch (type) {
            case 'string':
                await databases.createStringAttribute(dbId, collId, name, options.size || 255, options.required || false, options.default, options.array);
                break;
            case 'email':
                await databases.createEmailAttribute(dbId, collId, name, options.required || false, options.default, options.array);
                break;
            case 'float':
                await databases.createFloatAttribute(dbId, collId, name, options.required || false, options.min, options.max, options.default, options.array);
                break;
            case 'integer':
                await databases.createIntegerAttribute(dbId, collId, name, options.required || false, options.min, options.max, options.default, options.array);
                break;
            case 'enum':
                await databases.createEnumAttribute(dbId, collId, name, options.elements, options.required || false, options.default, options.array);
                break;
            case 'relationship':
                await databases.createRelationshipAttribute(
                    dbId,
                    collId,
                    options.relatedCollectionId,
                    options.relationType,
                    options.twoWay !== undefined ? options.twoWay : true,
                    name,
                    options.relatedKey,
                    options.onDelete
                );
                break;
        }
    } catch (e) {
        if (e.code === 409) {
            console.log(`    [!] Attribute ${name} already exists.`);
        } else {
            console.error(`    [X] Failed to create attribute ${name}:`, e.message);
        }
    }
}

async function setup() {
    try {
        // 1. Database
        try {
            console.log(`Checking/Creating Database: ${DB_ID}...`);
            await databases.create(DB_ID, 'InvoiceManagerDB');
            console.log('Database created.');
        } catch (e) {
            if (e.code === 409) console.log('Database already exists.');
            else throw e;
        }

        // 2. Clients Collection
        console.log(`Checking/Creating Clients Collection: ${COLL_CLIENTS}...`);
        try {
            await databases.createCollection(DB_ID, COLL_CLIENTS, 'Clients', [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
            ]);
            console.log('Collection created.');
        } catch (e) {
            if (e.code === 409) console.log('Collection already exists.');
            else throw e;
        }
        await createAttribute(DB_ID, COLL_CLIENTS, 'name', 'string', { size: 255, required: true });
        await createAttribute(DB_ID, COLL_CLIENTS, 'email', 'string', { size: 255, required: false });
        await createAttribute(DB_ID, COLL_CLIENTS, 'phone', 'string', { size: 50 });
        await createAttribute(DB_ID, COLL_CLIENTS, 'address', 'string', { size: 500 });
        await createAttribute(DB_ID, COLL_CLIENTS, 'passportNumber', 'string', { size: 50 });
        await createAttribute(DB_ID, COLL_CLIENTS, 'gender', 'enum', { elements: ['Male', 'Female'] });
        await createAttribute(DB_ID, COLL_CLIENTS, 'dateOfBirth', 'string', { size: 50 });

        // 3. Invoices Collection
        console.log(`Checking/Creating Invoices Collection: ${COLL_INVOICES}...`);
        try {
            await databases.createCollection(DB_ID, COLL_INVOICES, 'Invoices', [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
            ]);
            console.log('Collection created.');
        } catch (e) {
            if (e.code === 409) console.log('Collection already exists.');
            else throw e;
        }
        await createAttribute(DB_ID, COLL_INVOICES, 'invoiceNumber', 'string', { size: 50, required: true });
        await createAttribute(DB_ID, COLL_INVOICES, 'total', 'float', { required: true });
        await createAttribute(DB_ID, COLL_INVOICES, 'status', 'enum', { elements: ['draft', 'sent', 'paid', 'overdue'], required: true });
        await createAttribute(DB_ID, COLL_INVOICES, 'agentId', 'string', { size: 50, required: true });
        await createAttribute(DB_ID, COLL_INVOICES, 'notes', 'string', { size: 1000 });
        await createAttribute(DB_ID, COLL_INVOICES, 'dueDate', 'string', { size: 50 });
        await createAttribute(DB_ID, COLL_INVOICES, 'passportNumber', 'string', { size: 50 });
        await createAttribute(DB_ID, COLL_INVOICES, 'flightNumber', 'string', { size: 50 });
        await createAttribute(DB_ID, COLL_INVOICES, 'gender', 'enum', { elements: ['Male', 'Female'] });
        await createAttribute(DB_ID, COLL_INVOICES, 'roomType', 'enum', { elements: ['Double', 'Triple', 'Quad', 'Quint'] });
        await createAttribute(DB_ID, COLL_INVOICES, 'visaStatus', 'enum', { elements: ['Pending', 'Issued'] });
        await createAttribute(DB_ID, COLL_INVOICES, 'departureDate', 'string', { size: 50 });
        await createAttribute(DB_ID, COLL_INVOICES, 'dateOfBirth', 'string', { size: 50 });
        // Relationship to Client
        await createAttribute(DB_ID, COLL_INVOICES, 'clientId', 'relationship', {
            relatedCollectionId: COLL_CLIENTS,
            relationType: 'manyToOne',
            relatedKey: 'invoices',
            onDelete: 'setNull'
        });

        // 4. Items Collection
        console.log(`Checking/Creating Items Collection: ${COLL_ITEMS}...`);
        try {
            await databases.createCollection(DB_ID, COLL_ITEMS, 'Items', [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
            ]);
            console.log('Collection created.');
        } catch (e) {
            if (e.code === 409) console.log('Collection already exists.');
            else throw e;
        }
        await createAttribute(DB_ID, COLL_ITEMS, 'description', 'string', { size: 500, required: true });
        await createAttribute(DB_ID, COLL_ITEMS, 'quantity', 'integer', { required: true });
        await createAttribute(DB_ID, COLL_ITEMS, 'unitPrice', 'float', { required: true });
        // Relationship to Invoice
        await createAttribute(DB_ID, COLL_ITEMS, 'invoiceId', 'relationship', {
            relatedCollectionId: COLL_INVOICES,
            relationType: 'manyToOne',
            relatedKey: 'items',
            onDelete: 'cascade'
        });

        // 5. Rooms Collection
        console.log(`Checking/Creating Rooms Collection: ${COLL_ROOMS}...`);
        try {
            await databases.createCollection(DB_ID, COLL_ROOMS, 'Rooms', [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
            ]);
            console.log('Collection created.');
        } catch (e) {
            if (e.code === 409) console.log('Collection already exists.');
            else throw e;
        }
        await createAttribute(DB_ID, COLL_ROOMS, 'hotelName', 'string', { size: 255, required: true });
        await createAttribute(DB_ID, COLL_ROOMS, 'city', 'enum', { elements: ['Makkah', 'Madinah'], required: true });
        await createAttribute(DB_ID, COLL_ROOMS, 'type', 'enum', { elements: ['Double', 'Triple', 'Quad', 'Quint'], required: true });
        await createAttribute(DB_ID, COLL_ROOMS, 'capacity', 'integer', { required: true });
        await createAttribute(DB_ID, COLL_ROOMS, 'floorNumber', 'integer');
        await createAttribute(DB_ID, COLL_ROOMS, 'roomNumber', 'string', { size: 50 });

        // 6. Assignments Collection
        console.log(`Checking/Creating Assignments Collection: ${COLL_ASSIGNMENTS}...`);
        try {
            await databases.createCollection(DB_ID, COLL_ASSIGNMENTS, 'Assignments', [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
            ]);
            console.log('Collection created.');
        } catch (e) {
            if (e.code === 409) console.log('Collection already exists.');
            else throw e;
        }
        await createAttribute(DB_ID, COLL_ASSIGNMENTS, 'assignedAt', 'string', { size: 50, required: true });
        await createAttribute(DB_ID, COLL_ASSIGNMENTS, 'city', 'enum', { elements: ['Makkah', 'Madinah'], required: true });
        // Relationships
        await createAttribute(DB_ID, COLL_ASSIGNMENTS, 'roomId', 'relationship', {
            relatedCollectionId: COLL_ROOMS,
            relationType: 'manyToOne',
            relatedKey: 'assignments',
            onDelete: 'cascade'
        });
        await createAttribute(DB_ID, COLL_ASSIGNMENTS, 'clientId', 'relationship', {
            relatedCollectionId: COLL_CLIENTS,
            relationType: 'manyToOne',
            relatedKey: 'assignments',
            onDelete: 'cascade'
        });

        console.log('\n--- SETUP COMPLETE ---');
        console.log(`DATABASE_ID: ${DB_ID}`);
        console.log(`COLLECTIONS: clients, invoices, items, rooms, assignments`);
        console.log('----------------------');
        console.log('\nCopy these IDs to src/lib/appwrite.ts!');

    } catch (error) {
        console.error('\n[X] Setup failed:', error.message);
        if (error.response) console.error('Response:', error.response);
    }
}

setup();
