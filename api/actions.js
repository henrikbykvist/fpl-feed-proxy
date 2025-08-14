// api/actions.js
export default function handler(req, res) {
  res
    .status(200)
    .setHeader('Content-Type','application/json')
    .json({
      openapi: '3.1.0',
      info: {
        title: 'FPL Feed Proxy - Summary',
        version: '1.0.3',
        description: 'OpenAPI for GPT Actions: ping, summary (slank), og fpl (full).'
      },
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
                      properties: {
                        ok: { type: 'boolean' },
                        ts: { type: 'integer' },
                        hint: { type: 'string' }
                      },
                      additionalProperties: true
                    },
                    examples: {
                      ok: { value: { ok: true, ts: 1755180000000, hint: 'ping' } }
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
            // Viktig: ingen "required" params her, enkel validering
            parameters: [
              { name: 'gw', in: 'query', required: false, schema: { type: 'integer' }, description: 'Gameweek (valgfri)' },
              { name: 'fixtures', in: 'query', required: false, schema: { type: 'integer' }, description: 'Antall fixtures (valgfri)' },
              { name: 'topn', in: 'query', required: false, schema: { type: 'integer' }, description: 'Antall spillere (valgfri)' }
            ],
            responses: {
              200: {
                description: 'OK – slank JSON',
                content: {
                  'application/json': {
                    // Løst schema for å unngå connector-feil
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
                description: 'OK – stor JSON (kan være for stor for GPT)',
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
