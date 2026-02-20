import { Client, Account, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('6998683e0023e334f519');

export const account = new Account(client);
export const databases = new Databases(client);
export { client };

// These IDs match the fixed IDs used in scripts/init-appwrite.js
export const APPWRITE_CONFIG = {
    databaseId: 'invoice_manager_db',
    collections: {
        clients: 'clients',
        invoices: 'invoices',
        items: 'items',
        rooms: 'rooms',
        assignments: 'assignments'
    }
};
