window.SB = window.SB || {};

/* ══════════ SB.Sync — Sincronização + backup/restore ══════════ */
window.SB.Sync = (function() {
  var U = SB.Util, ST = SB.Store;
  var SYNC_FILE_DATA_JS = "// api/data.js\n// API de sincronização do StakeBet — Vercel Serverless Function + Vercel Postgres\n//\n// Rotas:\n//   GET  /api/data   -> devolve o estado salvo (ou null se ainda não existir)\n//   POST /api/data   -> salva/substitui o estado (recebe { data: {...} })\n//\n// Autenticação simples: um PIN compartilhado, enviado no header \"x-pin\".\n// Como é um app pessoal (uso individual, não multi-usuário), não usamos\n// login completo — só uma senha que só você conhece.\n\nimport { sql } from '@vercel/postgres';\n\nexport default async function handler(req, res) {\n  // Libera CORS pro arquivo HTML (que roda em file:// ou em qualquer domínio)\n  res.setHeader('Access-Control-Allow-Origin', '*');\n  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');\n  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Pin');\n\n  if (req.method === 'OPTIONS') {\n    return res.status(200).end();\n  }\n\n  const pin = req.headers['x-pin'];\n  if (!process.env.ACCESS_PIN) {\n    return res.status(500).json({ error: 'Servidor não configurado: falta a variável de ambiente ACCESS_PIN.' });\n  }\n  if (!pin || pin !== process.env.ACCESS_PIN) {\n    return res.status(401).json({ error: 'PIN inválido ou ausente.' });\n  }\n\n  try {\n    // Garante que a tabela existe (idempotente, roda toda vez sem problema)\n    await sql`\n      CREATE TABLE IF NOT EXISTS stakebet_state (\n        key TEXT PRIMARY KEY,\n        value JSONB NOT NULL,\n        updated_at TIMESTAMPTZ DEFAULT NOW()\n      );\n    `;\n\n    if (req.method === 'GET') {\n      const { rows } = await sql`SELECT value, updated_at FROM stakebet_state WHERE key = 'stakebet' LIMIT 1;`;\n      if (rows.length === 0) {\n        return res.status(200).json({ data: null, updatedAt: null });\n      }\n      return res.status(200).json({ data: rows[0].value, updatedAt: rows[0].updated_at });\n    }\n\n    if (req.method === 'POST') {\n      const body = req.body || {};\n      const v";
  var SYNC_FILE_PACKAGE_JSON = "{\n  \"name\": \"stakebet-sync\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"description\": \"API de sincronização na nuvem para o StakeBet (Vercel Serverless + Postgres).\",\n  \"dependencies\": {\n    \"@vercel/postgres\": \"^0.9.0\"\n  }\n}\n";
  var SYNC_FILE_SCHEMA_SQL = "-- Schema do StakeBet Sync\n-- Este script é opcional: a API (api/data.js) já cria essa tabela\n-- automaticamente na primeira chamada, caso ela ainda não exista.\n-- Mas se preferir criar manualmente antes, é só rodar isso no painel\n-- de Query da Vercel Postgres.\n\nCREATE TABLE IF NOT EXISTS stakebet_state (\n  key TEXT PRIMARY KEY,\n  value JSONB NOT NULL,\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n";
  var SYNC_KEY = 'sb_sync_v1';
  var syncCfg = (function(){ var s = ST.load(SYNC_KEY); return s || {url:'',pin:'',auto:false}; })();
  var _syncPushTimer = null;

  function saveSyncCfgToStorage(){ ST.save(SYNC_KEY, syncCfg); }
  function toggleSyncGuide(){
    var el=document.getElementById('sync-guide');
    var showing=el.style.display==='block';
    el.style.display=showing?'none':'block';
    if(!showing){ setTimeout(function(){ el.scrollIntoView({behavior:'smooth',block:'start'}); },50); }
  }
  function downloadSyncFile(filename,content,mime){
    var blob=new Blob([content],{type:mime||'text/plain'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    U.showToast('Arquivo baixado.',ICO.check);
  }
  function fillSyncForm(){
    document.getElementById('sync-url').value=syncCfg.url||'';
    document.getElementById('sync-pin').value=syncCfg.pin||'';
    document.getElementById('sync-auto').checked=!!syncCfg.auto;
    updateSyncStatus(syncCfg.url ? ('Conectado a '+syncCfg.url) : 'Sincronização não configurada.');
  }
  function updateSyncStatus(msg){
    var el=document.getElementById('sync-status');
    if(el) el.textContent=msg;
  }
  function saveSyncConfig(){
    var url=document.getElementById('sync-url').value.trim().replace(/\/$/,'');
    var pin=document.getElementById('sync-pin').value.trim();
    syncCfg={url:url,pin:pin,auto:document.getElementById('sync-auto').checked};
    saveSyncCfgToStorage();
    updateSyncStatus(url ? ('Conectado a '+url) : 'Sincronização não configurada.');
    U.showToast('Conexão salva.',ICO.check);
  }
  function onSyncAutoChange(){
    syncCfg.auto=document.getElementById('sync-auto').checked;
    saveSyncCfgToStorage();
  }
  function collectAllData(){
    return {cfg:SB.Config.cfg, casas:SB.Casas.casas, bets:SB.Simples.bets, sure:SB.Surebets.sure, dg:SB.DuploGreen.dg, trashBets:SB.Lixeira.trashBets, trashSure:SB.Lixeira.trashSure, trashDG:SB.Lixeira.trashDG, exportedAt:new Date().toISOString(), version:'sb_v4'};
  }
  function applyAllData(data){
    SB.Config.cfg = data.cfg||{bancaSimples:0,bancaSure:0,bancaDG:0,metaSimples:0,metaSure:0,metaDG:0,cicloInicioSimples:null,cicloInicioSure:null,cicloInicioDG:null};
    SB.Casas.casas.length=0; Array.prototype.push.apply(SB.Casas.casas, data.casas||[]);
    SB.Simples.bets.length=0; Array.prototype.push.apply(SB.Simples.bets, data.bets||[]);
    SB.Surebets.sure.length=0; Array.prototype.push.apply(SB.Surebets.sure, data.sure||[]);
    SB.DuploGreen.dg.length=0; Array.prototype.push.apply(SB.DuploGreen.dg, data.dg||[]);
    SB.Lixeira.trashBets.length=0; Array.prototype.push.apply(SB.Lixeira.trashBets, data.trashBets||[]);
    SB.Lixeira.trashSure.length=0; Array.prototype.push.apply(SB.Lixeira.trashSure, data.trashSure||[]);
    SB.Lixeira.trashDG.length=0; Array.prototype.push.apply(SB.Lixeira.trashDG, data.trashDG||[]);
    SB.Simples.nid = SB.Simples.bets.length?Math.max.apply(null,SB.Simples.bets.map(function(b){return b.id;}))+1:1;
    SB.Surebets.snid = SB.Surebets.sure.length?Math.max.apply(null,SB.Surebets.sure.map(function(s){return s.id;}))+1:1;
    SB.DuploGreen.dgnid = SB.DuploGreen.dg.length?Math.max.apply(null,SB.DuploGreen.dg.map(function(o){return o.id;}))+1:1;
    SB.Config.saveCfg(); SB.Casas.saveCasas(); SB.Simples.saveBets(); SB.Surebets.saveSure(); SB.DuploGreen.saveDG();
    SB.Lixeira.saveTrashBets(); SB.Lixeira.saveTrashSure(); SB.Lixeira.saveTrashDG();
    SB.Config.fillCfgForm(); SB.Casas.renderCasas(); SB.Casas.renderCasaSelects(); SB.Lixeira.renderTrash(); SB.Home.renderAll();
  }
  function syncPush(showFeedback){
    if(!syncCfg.url || !syncCfg.pin){ if(showFeedback!==false) alert('Configure e salve a URL e o PIN antes de sincronizar.'); return; }
    updateSyncStatus('Enviando...');
    fetch(syncCfg.url+'/api/data',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Pin':syncCfg.pin},
      body:JSON.stringify({data:collectAllData()})
    }).then(function(r){ return r.json().then(function(j){ return {ok:r.ok, body:j}; }); })
    .then(function(res){
      if(!res.ok){ updateSyncStatus('Erro ao enviar: '+(res.body&&res.body.error?res.body.error:'falha desconhecida')); if(showFeedback!==false) U.showToast('Erro ao sincronizar.',ICO.xcirc); return; }
      updateSyncStatus('Enviado com sucesso às '+new Date().toLocaleTimeString('pt-BR')+'.');
      if(showFeedback!==false) U.showToast('Dados enviados para a nuvem.',ICO.check);
    }).catch(function(e){
      updateSyncStatus('Erro de conexão: '+e.message);
      if(showFeedback!==false) U.showToast('Não foi possível conectar ao servidor.',ICO.xcirc);
    });
  }
  function syncPull(silent){
    if(!syncCfg.url || !syncCfg.pin){ if(!silent) alert('Configure e salve a URL e o PIN antes de sincronizar.'); return; }
    if(!silent) updateSyncStatus('Baixando...');
    fetch(syncCfg.url+'/api/data',{ headers:{'X-Pin':syncCfg.pin} })
    .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, body:j}; }); })
    .then(function(res){
      if(!res.ok){ if(!silent){ updateSyncStatus('Erro ao baixar: '+(res.body&&res.body.error?res.body.error:'falha desconhecida')); U.showToast('Erro ao sincronizar.',ICO.xcirc); } return; }
      if(!res.body.data){ if(!silent){ updateSyncStatus('Ainda não há nada salvo na nuvem.'); } return; }
      if(!silent && !confirm('Isso vai substituir os dados deste aparelho pelos que estão salvos na nuvem. Continuar?')) return;
      applyAllData(res.body.data);
      updateSyncStatus('Atualizado às '+new Date().toLocaleTimeString('pt-BR')+'.');
      if(!silent) U.showToast('Dados baixados da nuvem.',ICO.check);
    }).catch(function(e){
      if(!silent){ updateSyncStatus('Erro de conexão: '+e.message); U.showToast('Não foi possível conectar ao servidor.',ICO.xcirc); }
    });
  }
  function scheduleAutoPush(){
    if(!syncCfg.auto || !syncCfg.url || !syncCfg.pin) return;
    if(_syncPushTimer) clearTimeout(_syncPushTimer);
    _syncPushTimer=setTimeout(function(){ syncPush(false); },1500);
  }
  function exportBackup(){
    var data=collectAllData();
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download='stakebet-backup-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    U.showToast('Backup baixado.',ICO.check);
  }
  function onImportFileChange(ev){
    var f=ev.target.files && ev.target.files[0];
    var lbl=document.getElementById('import-file-label');
    if(lbl) lbl.textContent = f ? f.name : 'Escolher arquivo de backup';
    importBackup(ev);
  }
  function importBackup(ev){
    var file=ev.target.files[0];
    if(!file) return;
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var data=JSON.parse(e.target.result);
        if(!confirm('Isso vai substituir todos os dados atuais pelos do backup. Continuar?')) return;
        applyAllData(data);
        U.showToast('Backup importado com sucesso.',ICO.check);
      }catch(err){
        alert('Arquivo inválido. Verifique se é um backup exportado pelo StakeBet.');
      }
    };
    reader.readAsText(file);
    ev.target.value='';
  }

  return {
    syncCfg: syncCfg,
    loadSyncCfg: function(){ return syncCfg; },
    saveSyncCfgToStorage: saveSyncCfgToStorage,
    toggleSyncGuide: toggleSyncGuide, downloadSyncFile: downloadSyncFile,
    fillSyncForm: fillSyncForm, updateSyncStatus: updateSyncStatus,
    saveSyncConfig: saveSyncConfig, onSyncAutoChange: onSyncAutoChange,
    collectAllData: collectAllData, applyAllData: applyAllData,
    syncPush: syncPush, syncPull: syncPull, scheduleAutoPush: scheduleAutoPush,
    exportBackup: exportBackup, onImportFileChange: onImportFileChange, importBackup: importBackup
  };
})();
