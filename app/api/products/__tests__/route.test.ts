import { GET } from '../route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
    },
  },
}));

const mockProducts = [
  { id: '1', name: 'Product 1', price: '10.00', category: { slug: 'test' } },
  { id: '2', name: 'Product 2', price: '20.00', category: { slug: 'test' } },
];

describe('GET /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a list of products', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = new Request('http://localhost:3000/api/products');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockProducts);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  it('filters products by category', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = new Request('http://localhost:3000/api/products?category=shirts');
    const response = await GET(request);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: { slug: 'shirts' } },
      })
    );
  });

  it('sorts products by price', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const request = new Request('http://localhost:3000/api/products?sort=price&order=desc');
    const response = await GET(request);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { price: 'desc' },
      })
    );
  });

  it('returns 500 on database error', async () => {
    (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const request = new Request('http://localhost:3000/api/products');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch products');
  });
});
