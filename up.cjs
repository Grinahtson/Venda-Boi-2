const fs = require('fs');
const path = require('path');

const TOKEN = process.argv[2];
const REPO = 'Grinahtson/Venda-Boi-2';
const BASE_DIR = 'C:/Users/DELL/Downloads/Nova pasta';

async function request(endpoint, method = 'GET', body = null, retries=5) {
  const url = `https://api.github.com/repos/${REPO}/${endpoint}`;
  for(let i=0; i<retries; i++){
      try {
          const res = await fetch(url, {
            method,
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'User-Agent': 'NodeJS/VendaBoi Script'
            },
            body: body ? JSON.stringify(body) : undefined
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`API falhou ${res.status}: ${text}`);
          }
          return await res.json();
      } catch(e) {
          if(i===retries-1) throw e;
          console.log(`Falhou (tentativa ${i+1}). Tentando novamente em 2s...`);
          await new Promise(r=>setTimeout(r, 2000));
      }
  }
}

async function start() {
  console.log('Iniciando Upload BLINDADO v3...');
  
  const ref = await request('git/refs/heads/main');
  const commitSha = ref.object.sha;
  const commit = await request(`git/commits/${commitSha}`);
  const baseTreeSha = commit.tree.sha;

  const files = [];
  function walk(dir) {
    const list = fs.readdirSync(dir, {withFileTypes: true});
    for(const entry of list) {
        if(['node_modules', '.git', 'dist', '.next', '.local', 'MinGit', 'uploads'].includes(entry.name)) continue;
        if(entry.name.endsWith('.zip') || entry.name.endsWith('.tar.gz') || entry.name.endsWith('.log')) continue;
        const full = path.join(dir, entry.name);
        if(entry.isDirectory()) walk(full);
        else files.push(full);
    }
  }
  walk(BASE_DIR);
  
  console.log(`Localizou ${files.length} arquivos limpos.`);
  const treeItems = [];
  for(let i = 0; i < files.length; i++) {
     const file = files[i];
     const relative = path.relative(BASE_DIR, file).replace(/\\/g, '/');
     console.log(`[${i+1}/${files.length}] Subindo: ${relative}`);
     
     const content = fs.readFileSync(file);
     const blob = await request('git/blobs', 'POST', {
       content: content.toString('base64'),
       encoding: 'base64'
     });
     treeItems.push({
         path: relative,
         mode: '100644',
         type: 'blob',
         sha: blob.sha
     });
  }

  console.log('Criando Tree...');
  const tree = await request('git/trees', 'POST', {
      base_tree: baseTreeSha,
      tree: treeItems
  });

  console.log('Criando Commit...');
  const newCommit = await request('git/commits', 'POST', {
      message: 'Sistema Venda Boi - Deploy Inicial Total',
      tree: tree.sha,
      parents: [commitSha]
  });

  console.log('Atualizando main...');
  await request('git/refs/heads/main', 'PATCH', {
      sha: newCommit.sha
  });
  
  console.log('🚀 SUCESSO TOTAL! VERIFIQUE A RAILWAY!');
}

start().catch(console.error);
