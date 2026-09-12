# Null Sec OS 7.8

## Vercel worker edge fix

7.7 could show:

- ASSETS OK
- WISP OK
- WORKER FAIL

because the isolation headers were set in Express middleware, while Vercel may serve `public/index.html` directly as a static file. In that case the page never becomes cross-origin isolated and Scramjet initialization stops before the worker/controller flow completes.

7.8 moves the required headers into `vercel.json`:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Origin-Agent-Cluster: ?1`

`/sw.js` also gets:

- `Service-Worker-Allowed: /`
- `Cache-Control: no-store`
- JavaScript content type

## Browser changes

- Worker registration starts immediately when Null Browser opens.
- Diagnostics will attempt registration if there is no controlling worker.
- Diagnostics now include `ISOLATION`.
- Worker activation and cross-origin isolation are reported separately.
- Scramjet controller creation only happens after the page has a controlling `/sw.js` worker.

Expected result:

- ASSETS OK
- WISP OK
- WORKER OK
- ISOLATION OK

If `WORKER OK` but `ISOLATION FAIL`, the deployed Vercel project is not applying the new `vercel.json` headers.
