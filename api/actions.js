// api/actions.js
export default function handler(req, res) {
  res
    .status(200)
    .setHeader('Content-Type','application/json')
    .json({
      openapi: '3.1.0',
      info: { title: 'FPL Feed Proxy - Summary', version: '1.0.2' },
      servers: [{ url: 'https://fpl-feed-proxy.vercel.app' }],
      paths: {
        '/api/ping': {
          get: {
            operationId: 'ping',
            summary: 'Ping (sanity)',
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { ok: { type: 'boolean' }, ts: { type: 'integer' }, hint: { type: 'string' } },
                      additionalProperties: true
                    }
                  }
                }
              }
            }
          }
        },
        '/api/summary': {
          get: {
            operationId: 'getSummary',
            summary: 'Hent FPL summary-data (slanket feed)',
            parameters: [
              { name: 'gw', in: 'query', required: false, schema: { type: 'integer', minimum: 0, maximum: 50 }, description: 'Gameweek-nummer. Hvis utelatt, server default.' },
              { name: 'fixtures', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200, default: 20 }, description: 'Antall fixtures (default 20).' },
              { name: 'topn', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 600, default: 300 }, description: 'Antall spillere (default 300).' }
            ],
            responses: {
              200: {
                description: 'OK – slank JSON',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: {}, additionalProperties: true },
                    examples: {
                      sample: {
                        value: {
                          _generated_at_utc: '2025-08-14T12:34:56Z',
                          fpl: { events: [], teams: [], elements: [], fixtures: [] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/fpl': {
          get: {
            operationId: 'getFplFeed',
            summary: 'Hent full FPL-feed (stor)',
            responses: {
              200: {
                description: 'OK – stor JSON',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: {}, additionalProperties: true }
                  }
                }
              }
            }
          }
        }
      }
    });
}
