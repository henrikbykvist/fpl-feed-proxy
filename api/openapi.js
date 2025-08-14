export default function handler(req, res) {
  const baseUrl = `https://${req.headers.host}`;
  const yaml = `
openapi: 3.1.0
info:
  title: FPL Feed Proxy
  version: 1.0.0
paths:
  /api/fpl:
    get:
      operationId: getFpl
      summary: Get latest FPL feed
      responses:
        "200":
          description: Latest feed data
servers:
  - url: ${baseUrl}
`;
  res.setHeader("Content-Type", "text/yaml");
  res.send(yaml);
}
