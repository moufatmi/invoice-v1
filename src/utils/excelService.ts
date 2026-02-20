import * as XLSX from 'xlsx';
import { Client } from '../types';

/**
 * Keywords to ignore during Smart Scan (headers, room types, etc.)
 * These are filtered out to avoid importing metadata as pilgrims.
 */
const IGNORE_KEYWORDS = [
    'خماسي', 'رباعي', 'ثلاثي', 'ثنائي', 'فردي',
    'مكة', 'المدينة', 'Makkah', 'Madinah',
    'رجال', 'نساء', 'غرفة', 'غرفه', 'رقم',
    'Room', 'Type', 'Hotel', 'Floor',
    'تسكين', 'لائحة', 'تقرير', 'بواسطة',
    'Beausejour', 'Voyage', 'Unknown', 'Name'
];

/**
 * Validates if a string looks like a person's name (2+ words, no numbers)
 */
const looksLikeName = (text: string): boolean => {
    const trimmed = text.trim();
    if (trimmed.length < 5) return false;
    if (/\d/.test(trimmed)) return false; // Ignore if contains numbers

    // Check if it's in the ignore list
    if (IGNORE_KEYWORDS.some(k => trimmed.includes(k))) return false;

    // Check for word count (usually names are 2+ words)
    const words = trimmed.split(/\s+/).filter(w => w.length > 1);
    return words.length >= 2;
};

/**
 * Parses an Excel or CSV file and returns an array of Client objects
 * Uses a "Smart Scan" algorithm to extract names from ANY layout by scanning all cells.
 */
export const parseExcelFile = async (file: File): Promise<Omit<Client, 'id'>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert sheet to a 2D array of all values
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                const foundNames = new Set<string>();
                const clients: Omit<Client, 'id'>[] = [];

                // Smart Scan: Iterate through every single cell in the Excel file
                jsonData.forEach((row) => {
                    row.forEach((cellValue) => {
                        if (!cellValue) return;

                        const textValue = String(cellValue).trim();

                        // If cell looks like a name and we haven't added it yet
                        if (looksLikeName(textValue) && !foundNames.has(textValue)) {
                            foundNames.add(textValue);
                            clients.push({
                                name: textValue,
                                email: `${textValue.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                                gender: undefined, // User will assign gender via room/manual edit
                                passportNumber: '',
                                address: '',
                                phone: ''
                            });
                        }
                    });
                });

                resolve(clients);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
