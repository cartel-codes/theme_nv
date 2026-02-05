import { getProducts } from '../route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');

const mockProducts = [
  { id: '1', name: 'Product 1', price: '10.00' },
  { id: '2', name: 'Product 2', price: '20.00' },
];

describe('getProducts', () => {
  it('returns a list of products', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const searchParams = new URLSearchParams();
    const products = await getProducts(searchParams);

    expect(products).toEqual(mockProducts);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
  });
});


