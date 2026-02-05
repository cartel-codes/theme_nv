import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';
import { Product, Prisma } from '@prisma/client';

const mockProduct: Product = {
  id: 'clx123456',
  name: 'Test Product',
  description: 'This is a test product.',
  price: new Prisma.Decimal('99.99'),
  slug: 'test-product',
  imageUrl: 'https://via.placeholder.com/300',
  createdAt: new Date(),
  updatedAt: new Date(),
  categoryId: null,
  metaTitle: null,
  metaDescription: null,
  keywords: null,
};

describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);

    const productName = screen.getByText('Test Product');
    const productPrice = screen.getByText('$99.99');
    const productDescription = screen.getByText('This is a test product.');

    expect(productName).toBeInTheDocument();
    expect(productPrice).toBeInTheDocument();
    expect(productDescription).toBeInTheDocument();
  });
});
