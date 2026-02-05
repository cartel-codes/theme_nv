import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  it('renders the logo', () => {
    render(<Header />);
    const logo = screen.getByText('Novraux');
    expect(logo).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
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
