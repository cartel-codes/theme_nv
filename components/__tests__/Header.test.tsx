import { render, screen } from '@testing-library/react';
import Header from '../Header';
import { CartProvider } from '@/contexts/CartContext';

// Mock fetch for CartContext
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ items: [], totalItems: 0 }),
  })
) as jest.Mock;

const renderWithProviders = (component: React.ReactNode) => {
  return render(<CartProvider>{component}</CartProvider>);
};

describe('Header', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the logo', () => {
    renderWithProviders(<Header />);
    const logo = screen.getByText('Novraux');
    expect(logo).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithProviders(<Header />);
    const collectionLink = screen.getByText('Collection');
    const journalLink = screen.getByText('Journal');
    const aboutLink = screen.getByText('About');
    const contactLink = screen.getByText('Contact');

    expect(collectionLink).toBeInTheDocument();
    expect(journalLink).toBeInTheDocument();
    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
  });
});
