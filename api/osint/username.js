const { safeFetch } = require('../../lib/relay');

const PLATFORMS = [
  ['GitHub', u => `https://github.com/${u}`],
  ['GitLab', u => `https://gitlab.com/${u}`],
  ['Codeberg', u => `https://codeberg.org/${u}`],
  ['Reddit', u => `https://www.reddit.com/user/${u}/about.json`],
  ['Hacker News', u => `https://news.ycombinator.com/user?id=${u}`],
  ['Keybase', u => `https://keybase.io/${u}`],
  ['Twitch', u => `https://www.twitch.tv/${u}`],
  ['Vimeo', u => `https://vimeo.com/${u}`],
  ['SoundCloud', u => `https://soundcloud.com/${u}`],
  ['Pinterest', u => `https://www.pinterest.com/${u}/`],
  ['Medium', u => `https://medium.com/@${u}`],
  ['Dev.to', u => `https://dev.to/${u}`],
  ['Replit', u => `https://replit.com/@${u}`],
  ['npm', u => `https://www.npmjs.com/~${u}`],
  ['PyPI', u => `https://pypi.org/user/${u}/`]
];

function validUsername(value) {
  const u = String(value || '').trim();
  if (!u || u.length > 64) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(u)) return null;
  return u;
}

async function check(name, url) {
  try {
    const { response, finalUrl } = await safeFetch(url);
    try { await response.body?.cancel(); } catch {}
    let state = 'uncertain';
    if (response.status === 404 || response.status === 410) state = 'not_found';
    else if (response.status >= 200 && response.status < 400) state = 'found';
    else if ([401, 403, 429].includes(response.status)) state = 'uncertain';
    return { platform: name, url, finalUrl: finalUrl.href, status: response.status, state };
  } catch (err) {
    return { platform: name, url, status: null, state: 'uncertain', note: String(err.message || err).slice(0, 120) };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const username = validUsername(req.query.username);
  if (!username) return res.status(400).json({ error: 'Username must use letters, numbers, dot, underscore or hyphen and be 1-64 chars.' });

  const results = [];
  const concurrency = 4;
  for (let i = 0; i < PLATFORMS.length; i += concurrency) {
    const batch = PLATFORMS.slice(i, i + concurrency);
    results.push(...await Promise.all(batch.map(([name, fn]) => check(name, fn(encodeURIComponent(username))))));
  }
  const summary = results.reduce((a, r) => {
    a[r.state] = (a[r.state] || 0) + 1;
    return a;
  }, {});
  return res.status(200).json({
    username,
    checked: results.length,
    summary,
    results,
    disclaimer: 'Results are passive public-page checks. Some services use anti-bot pages or return 200 for missing users, so uncertain/false-positive results are possible.'
  });
};
