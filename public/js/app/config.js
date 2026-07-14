window.SB = window.SB || {};

/* ══════════ SB.Config — Configurações: banca, meta, ciclos, reset ══════════ */
window.SB.Config = (function() {
  var U = SB.Util, ST = SB.Store;
  var K = ST.KEYS.CFG;
  var defaults = {bancaSimples:0,bancaSure:0,bancaDG:0,metaSimples:0,metaSure:0,metaDG:0,cicloInicioSimples:null,cicloInicioSure:null,cicloInicioDG:null};
  var cfg = (function(){ var s = ST.load(K); return s ? Object.assign({}, defaults, s) : Object.assign({}, defaults); })();

  function saveCfg(){ ST.save(K, cfg); }
  function fillCfgForm(){
    document.getElementById('cfg-banca-simples').value=cfg.bancaSimples||'';
    document.getElementById('cfg-banca-sure').value=cfg.bancaSure||'';
    document.getElementById('cfg-banca-dg').value=cfg.bancaDG||'';
    document.getElementById('cfg-meta-simples').value=cfg.metaSimples||'';
    document.getElementById('cfg-meta-sure').value=cfg.metaSure||'';
    document.getElementById('cfg-meta-dg').value=cfg.metaDG||'';
    document.getElementById('ciclo-info-simples').textContent='Ciclo atual iniciado em: '+(cfg.cicloInicioSimples?U.fmtDataShort(cfg.cicloInicioSimples):'desde o início');
    document.getElementById('ciclo-info-sure').textContent='Ciclo atual iniciado em: '+(cfg.cicloInicioSure?U.fmtDataShort(cfg.cicloInicioSure):'desde o início');
    document.getElementById('ciclo-info-dg').textContent='Ciclo atual iniciado em: '+(cfg.cicloInicioDG?U.fmtDataShort(cfg.cicloInicioDG):'desde o início');
  }
  function onCfgChange(){
    cfg.bancaSimples=parseFloat(document.getElementById('cfg-banca-simples').value)||0;
    cfg.bancaSure=parseFloat(document.getElementById('cfg-banca-sure').value)||0;
    cfg.bancaDG=parseFloat(document.getElementById('cfg-banca-dg').value)||0;
    cfg.metaSimples=parseFloat(document.getElementById('cfg-meta-simples').value)||0;
    cfg.metaSure=parseFloat(document.getElementById('cfg-meta-sure').value)||0;
    cfg.metaDG=parseFloat(document.getElementById('cfg-meta-dg').value)||0;
    saveCfg();
    SB.Home.renderAll();
  }
  function toggleNovoCiclo(modulo){
    var el=document.getElementById('novociclo-form-'+modulo);
    var showing=el.style.display==='block';
    el.style.display=showing?'none':'block';
    if(!showing){
      var st = modulo==='simples' ? SB.Simples.statsSimples() : modulo==='sure' ? SB.Surebets.statsSure() : SB.DuploGreen.statsDG();
      document.getElementById('novociclo-banca-preview-'+modulo).textContent='R$ '+U.R2(st.banca);
      document.getElementById('novociclo-meta-'+modulo).value='';
    }
  }
  function confirmarNovoCiclo(modulo){
    var metaInput=document.getElementById('novociclo-meta-'+modulo);
    var novaMeta=parseFloat(metaInput.value)||0;
    if(!confirm('Iniciar um novo ciclo agora? A banca atual vira a nova banca inicial e as estatísticas do dashboard zeram a partir de agora.')) return;
    if(modulo==='simples'){
      var st=SB.Simples.statsSimples();
      cfg.bancaSimples=st.banca; cfg.metaSimples=novaMeta; cfg.cicloInicioSimples=new Date().toISOString();
    } else if(modulo==='sure'){
      var stU=SB.Surebets.statsSure();
      cfg.bancaSure=stU.banca; cfg.metaSure=novaMeta; cfg.cicloInicioSure=new Date().toISOString();
    } else {
      var stD=SB.DuploGreen.statsDG();
      cfg.bancaDG=stD.banca; cfg.metaDG=novaMeta; cfg.cicloInicioDG=new Date().toISOString();
    }
    saveCfg();
    fillCfgForm();
    toggleNovoCiclo(modulo);
    SB.Home.renderAll();
    U.showToast('Novo ciclo iniciado!',ICO.check);
  }
  function toggleCasasPanel(){
    var body=document.getElementById('casas-panel-body');
    var chev=document.getElementById('casas-chevron');
    var showing=body.style.display==='block';
    body.style.display=showing?'none':'block';
    chev.style.transform=showing?'rotate(0deg)':'rotate(180deg)';
  }
  function onConfirmZerarInput(){
    var v=document.getElementById('confirmzerar').value.trim().toUpperCase();
    document.getElementById('btnzerar').disabled = (v!=='ZERAR');
  }
  function resetAll(){
    if(!confirm('Tem certeza absoluta? Todos os dados serão apagados permanentemente.')) return;
    try{
      Object.keys(ST.KEYS).forEach(function(k){ try{ localStorage.removeItem(ST.KEYS[k]); }catch(e){} });
    }catch(e){}
    Object.assign(cfg, defaults);
    SB.Casas.casas.length=0;
    SB.Simples.bets.length=0; SB.Simples.nid=1;
    SB.Surebets.sure.length=0; SB.Surebets.snid=1;
    SB.DuploGreen.dg.length=0; SB.DuploGreen.dgnid=1;
    SB.Lixeira.trashBets.length=0; SB.Lixeira.trashSure.length=0; SB.Lixeira.trashDG.length=0;
    document.getElementById('confirmzerar').value='';
    document.getElementById('btnzerar').disabled=true;
    fillCfgForm();
    SB.Casas.renderCasaSelects();
    SB.Casas.renderCasas();
    SB.Lixeira.renderTrash();
    SB.Home.renderAll();
    U.showToast('Todos os dados foram zerados.',ICO.check);
    SB.Nav.showTab('home');
  }

  return {
    cfg: cfg,
    saveCfg: saveCfg, fillCfgForm: fillCfgForm, onCfgChange: onCfgChange,
    toggleNovoCiclo: toggleNovoCiclo, confirmarNovoCiclo: confirmarNovoCiclo,
    toggleCasasPanel: toggleCasasPanel,
    onConfirmZerarInput: onConfirmZerarInput, resetAll: resetAll
  };
})();
