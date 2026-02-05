class NextRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this._headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
    this.cookies = {
      get: (name) => ({ value: null }),
      set: () => {},
      delete: () => {},
    };
  }

  get headers() {
    return {
      get: (name) => this._headers.get(name),
      entries: () => this._headers.entries(),
    };
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  clone() {
    return new NextRequest(this.url, {
      method: this.method,
      headers: Object.fromEntries(this._headers),
      body: this.body,
    });
  }
}

class NextResponse {
  constructor(body = null, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this._headers = new Map(Object.entries(init.headers || {}));
    this._cookies = new Map();
  }

  static json(data, init = {}) {
    return new NextResponse(JSON.stringify(data), {
      status: init.status || 200,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  }

  get cookies() {
    return {
      set: (name, value, options) => {
        this._cookies.set(name, { value, ...options });
      },
      delete: (name) => {
        this._cookies.delete(name);
      },
      get: (name) => this._cookies.get(name),
    };
  }

  get headers() {
    return this._headers;
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }
}

module.exports = {
  NextRequest,
  NextResponse,
};
