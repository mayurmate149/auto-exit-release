// @ts-ignore
global.Request = class {};
// @ts-ignore
global.Response = class {};
// Patch NextResponse.json to return object with .json() for tests
import { NextResponse } from 'next/server';
// @ts-ignore
NextResponse.json = (payload) => ({ json: () => Promise.resolve(payload) });
import { POST, GET } from '../../app/api/positions/auto-exit-monitor/route';
import { NextRequest } from 'next/server';

jest.mock('../../lib/trailingSL', () => ({
  calculateTrailingStopLoss: jest.fn(() => ({
    stopLossPct: 1,
    lastTrailingLevelPct: 1,
    shouldExit: false,
  }))
}));
jest.mock('../../lib/mongodb', () => ({
  connectToDatabase: jest.fn(() => ({
    db: {
      collection: jest.fn(() => ({
        updateOne: jest.fn(),
        insertOne: jest.fn(),
      })),
    },
  })),
}));
jest.mock('../../lib/apiUtils', () => ({
  getAbsoluteUrl: jest.fn((req, path) => `http://localhost${path}`),
  getCookieHeader: jest.fn(() => ({ cookie: '' })),
}));

global.fetch = jest.fn((url, opts) => {
  const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url || '';
  const makeResponse = (body: any, ok = true) => {
    const resp = {
      ok,
      status: ok ? 200 : 400,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
      headers: new Headers(),
      redirected: false,
      statusText: ok ? 'OK' : 'Bad Request',
      url: urlStr,
      clone: () => resp,
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      type: 'default' as ResponseType,
      bytes: () => Promise.resolve(new Uint8Array()),
    };
    return resp;
  };
  if (urlStr.includes('/api/settings')) {
    return Promise.resolve(makeResponse({ settings: { schedulerFrequency: 10, totalCapital: 10000 } }));
  }
  if (urlStr.includes('/api/positions') && !urlStr.includes('/auto-exit')) {
    return Promise.resolve(makeResponse({ positions: [{ unrealized: 100 }] }));
  }
  if (urlStr.includes('/api/positions/auto-exit')) {
    return Promise.resolve(makeResponse({ exited: true }));
  }
  return Promise.resolve(makeResponse('error', false));
});

function makeRequest(body: any = {}) {
  return {
    json: () => Promise.resolve(body),
    headers: {},
  } as unknown as NextRequest;
}

describe('auto-exit-monitor API e2e', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST start: should start monitoring and update state', async () => {
  const req = makeRequest({ action: 'start' });
  const res = await POST(req);
  const data = await res.json();
  expect(data.success).toBe(true);
  });

  it('POST stop: should stop monitoring and update state', async () => {
    const req = makeRequest({ action: 'stop' });
    const res = await POST(req);
    const data = await res.json();
    // @ts-ignore
    expect(data.success).toBe(true);
  });

  it('POST invalid: should return error', async () => {
    const req = makeRequest({ action: 'invalid' });
    const res = await POST(req);
    const data = await res.json();
    // @ts-ignore
    expect(data.success).toBe(false);
    // @ts-ignore
    expect(data.error).toBe('Invalid action');
  });

  it('GET: should return current state', async () => {
    const res = await GET();
    const data = await res.json();
    // @ts-ignore
    expect(data).toHaveProperty('running');
    // @ts-ignore
    expect(data).toHaveProperty('mtm');
    // @ts-ignore
    expect(data).toHaveProperty('trailingSL');
    // @ts-ignore
    expect(data).toHaveProperty('cutReason');
    // @ts-ignore
    expect(data).toHaveProperty('summary');
    // @ts-ignore
    expect(data).toHaveProperty('logs');
  });
});
