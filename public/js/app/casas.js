window.SB = window.SB || {};

/* ══════════ SB.Casas — Gestão de bookmakers ══════════ */
window.SB.Casas = (function() {
  var ST = SB.Store;
  var H = SB.Html;
  var U = SB.Util;
  var K = ST.KEYS.CASAS;
  var casas = (function(){ var s = ST.load(K); return s || []; })();

  function saveCasas(){ ST.save(K, casas); }
  function addCasaIfNew(name){
    if(!name) return;
    if(casas.indexOf(name)===-1){ casas.push(name); saveCasas(); }
    renderCasaSelects();
  }
  function casaOptionsHtml(){
    if(!casas.length) return '<option value="__x__">Outra... (cadastre em Configurações)</option>';
    return casas.map(function(c){return '<option>'+c+'</option>';}).join('')+'<option value="__x__">Outra...</option>';
  }
  function renderCasaSelects(){
    document.querySelectorAll('.casa-select').forEach(function(sel){
      var cur=sel.value;
      sel.innerHTML=casaOptionsHtml();
      if(casas.indexOf(cur)!==-1) sel.value=cur;
    });
    var filterOpts='<option value="">Todas as casas</option>'+casas.map(function(c){return '<option>'+c+'</option>';}).join('');
    ['s-filter-casa','u-filter-casa'].forEach(function(id){
      var el=document.getElementById(id);
      if(!el) return;
      var cur=el.value;
      el.innerHTML=filterOpts;
      if(casas.indexOf(cur)!==-1) el.value=cur;
    });
  }
  function addCasaManual(){
    var el=document.getElementById('newcasa');
    var v=el.value.trim();
    if(!v) return;
    if(casas.indexOf(v)!==-1){ alert('Essa casa já está cadastrada.'); return; }
    casas.push(v); saveCasas();
    el.value='';
    renderCasas(); renderCasaSelects();
    U.showToast('Casa adicionada.',ICO.check);
  }
  function removeCasa(name){
    if(!confirm('Remover "'+name+'" da lista? Apostas já registradas continuam salvas normalmente.')) return;
    casas=casas.filter(function(c){return c!==name;});
    saveCasas();
    renderCasas(); renderCasaSelects();
  }
  function renderCasas(){
    var html = casas.length ? casas.map(function(c){
      return '<div class="casa-row"><span>'+c+'</span><button class="xbtn" onclick="SB.Casas.removeCasa(\''+c.replace(/'/g,"\\'")+'\')">×</button></div>';
    }).join('') : H.emptyState(ICO.list,'Nenhuma casa cadastrada ainda.');
    document.getElementById('casas-list').innerHTML=html;
  }

  return {
    casas: casas,
    saveCasas: saveCasas, addCasaIfNew: addCasaIfNew,
    casaOptionsHtml: casaOptionsHtml, renderCasaSelects: renderCasaSelects,
    addCasaManual: addCasaManual, removeCasa: removeCasa, renderCasas: renderCasas
  };
})();
