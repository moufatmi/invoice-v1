import { GEMINI_API_KEY, GEMINI_API_URL } from '../config/secrets';

export interface ExtractedPassportData {
    passportNumber?: string;
    name?: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female';
    nationality?: string;
    address?: string;
    flightNumber?: string;
    departureDate?: string;
    visaStatus?: 'Pending' | 'Issued';
}

export const extractPassportDetails = async (base64Image: string): Promise<ExtractedPassportData> => {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing. Please configure it in src/config/secrets.ts');
    }

    // Extract mime type and base64 data
    const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

    if (!matches) {
        throw new Error('Invalid image format. Please upload a valid image file.');
    }

    const mimeType = matches[1];
    const cleanBase64 = matches[2];

    const payload = {
        contents: [
            {
                parts: [
                    {
                        text: "Extract ALL relevant details from this image to fill an invoice form. Return a JSON object with these keys: passportNumber, name (full name), dateOfBirth (YYYY-MM-DD), gender (Male/Female), nationality, address (if available), flightNumber (if available), departureDate (YYYY-MM-DD, if available). Also infer logical defaults if possible: visaStatus ('Issued' if visa is visible, else 'Pending'). Return ONLY the JSON object, no markdown."
                    },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: cleanBase64
                        }
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error Detail:', errorData);
            const errorMessage = errorData.error?.message || response.statusText || 'Unknown Error';
            throw new Error(`Gemini API Error (${response.status}): ${errorMessage}`);
        }

        const data = await response.json();

        // Parse the extracted text
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            throw new Error('No text extracted from the image');
        }

        // Clean up the response to ensure it's valid JSON
        const cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedData = JSON.parse(cleanJson);

            // Map to our interface
            return {
                passportNumber: parsedData.passportNumber,
                name: parsedData.name,
                dateOfBirth: parsedData.dateOfBirth,
                gender: parsedData.gender === 'M' ? 'Male' : parsedData.gender === 'F' ? 'Female' : parsedData.gender,
                // Add new fields to the return object
                nationality: parsedData.nationality,
                address: parsedData.address,
                flightNumber: parsedData.flightNumber,
                departureDate: parsedData.departureDate,
                visaStatus: parsedData.visaStatus
            };
        } catch (e) {
            console.error('Failed to parse Gemini response:', textContent);
            throw new Error('Failed to parse extracted passport data');
        }

    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    }
};
