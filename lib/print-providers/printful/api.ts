import axios, { AxiosInstance } from 'axios';

export class PrintfulAPI {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.printful.com',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Test connection
  async testConnection() {
    try {
      const { data } = await this.client.get('/stores');
      return { success: true, data: data.result };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  // Get catalog products
  async getProducts() {
    try {
      const { data } = await this.client.get('/products');
      return data.result || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch products: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get product details
  async getProduct(id: number) {
    try {
      const { data } = await this.client.get(`/products/${id}`);
      return data.result;
    } catch (error: any) {
      throw new Error(`Failed to fetch product ${id}: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get product variants
  async getProductVariants(id: number) {
    try {
      const { data } = await this.client.get(`/products/${id}/variants`);
      return data.result || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch variants for product ${id}: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Store Products (Your synced products)
  async getStoreProducts() {
    const { data } = await this.client.get('/store/products');
    return data.result;
  }

  async createStoreProduct(productData: any) {
    const { data } = await this.client.post('/store/products', productData);
    return data.result;
  }

  async updateStoreProduct(id: number, productData: any) {
    const { data } = await this.client.put(`/store/products/${id}`, productData);
    return data.result;
  }

  async deleteStoreProduct(id: number) {
    const { data } = await this.client.delete(`/store/products/${id}`);
    return data.result;
  }

  // Orders
  async createOrder(orderData: any) {
    const { data } = await this.client.post('/orders', orderData);
    return data.result;
  }

  async getOrder(orderId: string) {
    const { data } = await this.client.get(`/orders/@${orderId}`);
    return data.result;
  }

  async confirmOrder(orderId: string) {
    const { data } = await this.client.post(`/orders/@${orderId}/confirm`);
    return data.result;
  }

  async cancelOrder(orderId: string) {
    const { data } = await this.client.delete(`/orders/@${orderId}`);
    return data.result;
  }

  // Shipping
  async calculateShipping(shippingData: any) {
    const { data } = await this.client.post('/shipping/rates', shippingData);
    return data.result;
  }

  // Files (Design Upload)
  async uploadFile(fileBuffer: Buffer, fileName: string) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fileBuffer, fileName);
    form.append('type', 'default');

    const { data } = await this.client.post('/files', form, {
      headers: form.getHeaders(),
    });
    return data.result;
  }

  // Mockups
  async generateMockup(taskData: any) {
    const { data } = await this.client.post(
      `/mockup-generator/create-task/${taskData.product_id}`, 
      taskData
    );
    return data.result;
  }

  async getMockupTask(taskKey: string) {
    const { data } = await this.client.get(`/mockup-generator/task`, {
      params: { task_key: taskKey }
    });
    return data.result;
  }

  // Webhooks
  async registerWebhook(url: string, types: string[]) {
    const { data } = await this.client.post('/webhooks', {
      url,
      types,
    });
    return data.result;
  }

  async getWebhooks() {
    const { data } = await this.client.get('/webhooks');
    return data.result;
  }

  async deleteWebhook(id: number) {
    const { data } = await this.client.delete(`/webhooks/${id}`);
    return data.result;
  }
}

// Export singleton instance
export const printfulAPI = new PrintfulAPI(process.env.PRINTFUL_API_KEY || '');
