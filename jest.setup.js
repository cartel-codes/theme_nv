require('@testing-library/jest-dom');

// Simple Request mock for Node.js test environment
class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this._body = options.body;
    this.headers = new Map(Object.entries(options.headers || {}));
  }
  async json() {
    return JSON.parse(this._body || '{}');
  }
  async text() {
    return this._body || '';
  }
}

if (typeof Request === 'undefined') {
  global.Request = MockRequest;
}

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
    status: 404,
    json: async () => ({}),
  })
);

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: null })),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn(() => new Map()),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
