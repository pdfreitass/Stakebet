window.SB = window.SB || {};

/* ══════════ SB.Nav — Navegação entre abas ══════════ */
window.SB.Nav = (function() {
  var U = SB.Util;
  var curTab = 'home', novaTipo = 'simples', curHistTipo = 'simples';
  var TAB_TAGS = {home:'Visão geral',simples:'Apostas simples',sure:'Surebets — arbitragem',dg:'Duplo Green — pagamento antecipado',historico:'Histórico completo',nova:'Registrar nova entrada',config:'Configurações e gestão de risco'};

  function hasUnsavedNovaData(){
    if(novaTipo==='simples'){
      var ap=document.getElementById('fap'), odd=document.getElementById('fodd'), titulo=document.getElementById('ftitulo'), descricao=document.getElementById('fdescricao'), outra=document.getElementById('foutra');
      return !!((ap&&ap.value) || (odd&&odd.value) || (titulo&&titulo.value.trim()) || (descricao&&descricao.value.trim()) || (outra&&outra.value.trim()));
    } else if(novaTipo==='sure'){
      var v0=document.getElementById('legvalor0');
      var evento=document.getElementById('sevento'), descricaoS=document.getElementById('sdescricao'), nota=document.getElementById('snota');
      if((v0&&v0.value) || (evento&&evento.value.trim()) || (descricaoS&&descricaoS.value.trim()) || (nota&&nota.value.trim())) return true;
      var n=SB.Surebets.legCounts['leg']||0;
      for(var i=0;i<n;i++){ var oddEl=document.getElementById('legodd'+i); if(oddEl&&oddEl.value) return true; }
      return false;
    } else {
      var v0d=document.getElementById('dgvalor0');
      var eventoD=document.getElementById('dgevento'), descricaoD=document.getElementById('dgdescricao'), notaD=document.getElementById('dgnota');
      if((v0d&&v0d.value) || (eventoD&&eventoD.value.trim()) || (descricaoD&&descricaoD.value.trim()) || (notaD&&notaD.value.trim())) return true;
      var nd=SB.Surebets.legCounts['dg']||0;
      for(var j=0;j<nd;j++){ var oddElD=document.getElementById('dgodd'+j); if(oddElD&&oddElD.value) return true; }
      return false;
    }
  }
  function showTab(t){
    if(curTab==='nova' && t!=='nova' && hasUnsavedNovaData()){
      if(!confirm('Você tem dados não salvos nessa aposta. Quer sair sem salvar?')) return;
      SB.Simples.resetSimplesForm();
      SB.Surebets.resetSureForm();
      SB.DuploGreen.resetDGForm();
    }
    curTab=t;
    document.querySelectorAll('.tabpage').forEach(function(e){e.classList.remove('on');});
    document.getElementById('tab-'+t).classList.add('on');
    document.querySelectorAll('.bnav-btn,.bnav-fab').forEach(function(e){e.classList.remove('on');});
    var bnavEl=document.getElementById('bnav-'+t);
    if(bnavEl) bnavEl.classList.add('on');
    document.getElementById('hdrtag').textContent=TAB_TAGS[t]||'';
    SB.Home.updateHeaderBanca();
    if(t==='simples') SB.Simples.renderSimples();
    else if(t==='sure') SB.Surebets.renderSure();
    else if(t==='dg') SB.DuploGreen.renderDG();
    else if(t==='historico'){ SB.Simples.renderSimples(); SB.Surebets.renderSure(); SB.DuploGreen.renderDG(); }
    else if(t==='home') SB.Home.renderHome();
    else if(t==='config'){ SB.Config.fillCfgForm(); SB.Casas.renderCasas(); SB.Lixeira.renderTrash(); SB.Sync.fillSyncForm(); SB.Relatorios.updateReportPreview(); }
    window.scrollTo(0,0);
  }
  function setNovaTipo(t){
    novaTipo=t;
    document.getElementById('novaopt-simples').classList.toggle('on',t==='simples');
    document.getElementById('novaopt-sure').classList.toggle('on',t==='sure');
    document.getElementById('novaopt-dg').classList.toggle('on',t==='dg');
    document.getElementById('novaform-simples').style.display=t==='simples'?'block':'none';
    document.getElementById('novaform-sure').style.display=t==='sure'?'block':'none';
    document.getElementById('novaform-dg').style.display=t==='dg'?'block':'none';
  }
  function setHistoricoTipo(t){
    curHistTipo=t;
    document.getElementById('histtab-simples').classList.toggle('ti',t==='simples');
    document.getElementById('histtab-sure').classList.toggle('ti',t==='sure');
    document.getElementById('histtab-dg').classList.toggle('ti',t==='dg');
    document.getElementById('historico-simples-wrap').style.display=t==='simples'?'block':'none';
    document.getElementById('historico-sure-wrap').style.display=t==='sure'?'block':'none';
    document.getElementById('historico-dg-wrap').style.display=t==='dg'?'block':'none';
  }
  function cancelEdit(){
    var wasSimples=!!SB.Simples.editingBetId, wasSure=!!SB.Surebets.editingSureId, wasDG=!!SB.DuploGreen.editingDGId;
    SB.Simples.resetSimplesForm();
    SB.Surebets.resetSureForm();
    SB.DuploGreen.resetDGForm();
    if(wasSimples) showTab('simples');
    else if(wasSure) showTab('sure');
    else if(wasDG) showTab('dg');
  }

  return {
    curTab: curTab, novaTipo: novaTipo,
    showTab: showTab, setNovaTipo: setNovaTipo, setHistoricoTipo: setHistoricoTipo,
    cancelEdit: cancelEdit, hasUnsavedNovaData: hasUnsavedNovaData
  };
})();
