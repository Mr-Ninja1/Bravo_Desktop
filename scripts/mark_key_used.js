#!/usr/bin/env node
// Usage: node mark_key_used.js --repo owner/repo --path keys.json --key KEY --action used|unused
// Requires: set GITHUB_TOKEN env var with a token that has repo contents write access

const [,, ...argv] = process.argv;
const args = {};
argv.forEach(a => {
  if (a.startsWith('--')) {
    const [k, v] = a.split('=');
    args[k.replace(/^--/, '')] = v === undefined ? true : v;
  } else if (!args._) args._ = [a]; else args._.push(a);
});

const repo = args.repo || process.env.GH_REPO;
const filePath = args.path || 'keys.json';
const key = args.key || (args._ && args._[0]);
const action = (args.action || 'used').toLowerCase();
const token = process.env.GITHUB_TOKEN;

if (!repo || !key || !token) {
  console.error('Missing required parameters. Example:');
  console.error('GITHUB_TOKEN=... node scripts/mark_key_used.js --repo=me/myrepo --path=keys.json --key=ABC-123 --action=used');
  process.exit(2);
}

const [owner, repoName] = repo.split('/');
if (!owner || !repoName) { console.error('Invalid --repo (expected owner/repo)'); process.exit(2); }

const apiBase = `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(filePath)}`;

async function main() {
  try {
    const getRes = await fetch(apiBase, { headers: { 'Authorization': `token ${token}`, 'User-Agent': 'bravo-admin-script' } });
    if (!getRes.ok) {
      console.error('Failed to fetch file:', getRes.status, await getRes.text());
      process.exit(3);
    }
    const fileInfo = await getRes.json();
    const sha = fileInfo.sha;
    const content = Buffer.from(fileInfo.content, fileInfo.encoding || 'base64').toString('utf8');
    let data = null;
    try { data = JSON.parse(content); } catch (e) { console.error('File content is not valid JSON'); process.exit(4); }

    // keys.json can be an object with `keys` array or a top-level array
    let list = Array.isArray(data) ? data : (data.keys || data.list || null);
    if (!list) {
      console.error('Could not find an array of keys in the JSON (expected top-level array or object.keys)');
      process.exit(5);
    }

    const found = list.find(k => (k && (k.key === key || k.code === key)));
    if (!found) {
      console.error('Key not found in hosted file');
      process.exit(6);
    }

    const newUsed = action === 'used' || action === 'mark-used' || action === 'mark_used';
    found.used = !!newUsed;

    // write back
    let newContent = null;
    if (Array.isArray(data)) newContent = JSON.stringify(list, null, 2);
    else {
      const copy = Object.assign({}, data);
      if (Array.isArray(copy.keys)) copy.keys = list; else if (copy.list) copy.list = list; else copy.keys = list;
      newContent = JSON.stringify(copy, null, 2);
    }

    const putBody = {
      message: `${newUsed ? 'Mark' : 'Unmark'} key ${key} via admin script`,
      content: Buffer.from(newContent, 'utf8').toString('base64'),
      sha: sha
    };

    const putRes = await fetch(apiBase, { method: 'PUT', headers: { 'Authorization': `token ${token}`, 'User-Agent': 'bravo-admin-script', 'Content-Type': 'application/json' }, body: JSON.stringify(putBody) });
    if (!putRes.ok) {
      console.error('Failed to update file:', putRes.status, await putRes.text());
      process.exit(7);
    }
    console.log('Success: key updated.');
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error', e);
    process.exit(10);
  }
}

main();
