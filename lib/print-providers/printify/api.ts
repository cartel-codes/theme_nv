
import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://api.printify.com/v1';

export class PrintifyAPI {
    private client: AxiosInstance;

    constructor(apiKey: string) {
        this.client = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    async getShops() {
        try {
            const { data } = await this.client.get('/shops.json');
            return data; // Array of shops
        } catch (error: any) {
            console.error('getShops error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getProducts(shopId: string, limit: number = 50, page: number = 1) {
        try {
            const { data } = await this.client.get(`/shops/${shopId}/products.json`, {
                params: { limit, page }
            });
            // Printify returns { data: [...] }, extract it if present
            return data;
        } catch (error: any) {
            console.error('getProducts error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getProduct(shopId: string, productId: string) {
        const { data } = await this.client.get(`/shops/${shopId}/products/${productId}.json`);
        return data;
    }

    // --- Catalog Methods ---
    async getBlueprints() {
        try {
            const { data } = await this.client.get('/catalog/blueprints.json');
            return data;
        } catch (error: any) {
            console.error('getBlueprints error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getBlueprintProviders(blueprintId: number) {
        try {
            const { data } = await this.client.get(`/catalog/blueprints/${blueprintId}/print_providers.json`);
            return data;
        } catch (error: any) {
            console.error('getBlueprintProviders error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getBlueprintVariants(blueprintId: number, providerId: number) {
        try {
            const { data } = await this.client.get(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`);
            return data;
        } catch (error: any) {
            console.error('getBlueprintVariants error:', error.response?.data || error.message);
            throw error;
        }
    }

    // --- Creation Methods ---
    async uploadImage(imageInput: string, fileName: string) {
        try {
            // Check if input is Base64 (starts with data:image...)
            const isBase64 = imageInput.startsWith('data:');

            let payload: any = { file_name: fileName };

            if (isBase64) {
                // Remove the prefix "data:image/png;base64," and remove any extra characters
                const base64Data = imageInput.split(',')[1];
                if (!base64Data) {
                    throw new Error('Invalid base64 image format');
                }
                payload.contents = base64Data;
            } else {
                // For URL input, Printify might accept URL directly
                payload.url = imageInput;
            }

            const { data } = await this.client.post('/uploads/images.json', payload);
            console.log('Image upload response:', data);
            return data;
        } catch (error: any) {
            console.error('uploadImage error:', error.response?.data || error.message);
            throw error;
        }
    }

    async createProduct(shopId: string, productData: any) {
        try {
            // productData structure: { title, description, blueprint_id, print_provider_id, variants: [...], print_areas: [...] }
            console.log('Creating product with payload:', JSON.stringify(productData, null, 2));
            const { data } = await this.client.post(`/shops/${shopId}/products.json`, productData);
            console.log('Create product response:', data);
            return data;
        } catch (error: any) {
            console.error('createProduct error:', error.response?.data || error.message);
            throw error;
        }
    }

    async publishProduct(shopId: string, productId: string) {
        try {
            const { data } = await this.client.post(`/shops/${shopId}/products/${productId}/publish.json`, {
                publish: true
            });
            console.log('Publish product response:', data);
            return data;
        } catch (error: any) {
            console.error('publishProduct error:', error.response?.data || error.message);
            throw error;
        }
    }
}
