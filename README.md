# Null Sec OS 3.7

This build uses physical Vercel Function files instead of a root Express server.

Important paths:

- `/api/proxy/index.js` -> `/api/proxy?url=https://example.com`
- `/api/health.js` -> `/api/health`
- `/api/qr.js` -> `/api/qr?text=hello`
- `/api/osint/dns.js`
- `/api/osint/rdap.js`
- `/api/osint/ct.js`
- `/api/osint/headers.js`
- `/api/osint/robots.js`
- `/lib/relay.js` contains shared server-only relay and SSRF-protection code.

Deploy by pushing the contents of this folder to the repository root and redeploying on Vercel.
Do not put the whole `null-sec-os-3.7-api-folder` directory one level below the repository root.

The relay intentionally blocks localhost, private IP space, credentialed URLs, non-HTTP protocols, oversized responses, and unsupported content types.
