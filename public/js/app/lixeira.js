window.SB = window.SB || {};

/* ══════════ SB.Lixeira — Lixeira unificada ══════════ */
window.SB.Lixeira = (function() {
  var ST = SB.Store, H = SB.Html, U = SB.Util;
  var TK = ST.KEYS;
  var trashBets = (function(){ var s = ST.load(TK.TRASH_SIMPLES); return s || []; })();
  var trashSure = (function(){ var s = ST.load(TK.TRASH_SURE); return s || []; })();
  var trashDG  = (function(){ var s = ST.load(TK.TRASH_DG); return s || []; })();

  function saveTrashBets(){ ST.save(TK.TRASH_SIMPLES, trashBets); }
  function saveTrashSure(){ ST.save(TK.TRASH_SURE, trashSure); }
  function saveTrashDG(){ ST.save(TK.TRASH_DG, trashDG); }

  function restoreBet(id){
    var item=trashBets.filter(function(b){return b.id===id;})[0];
    if(!item) return;
    trashBets=trashBets.filter(function(b){return b.id!==id;});
    saveTrashBets();
    delete item._deletedAt;
    SB.Simples.bets.push(item);
    if(item.id>=SB.Simples.nid) SB.Simples.nid=item.id+1;
    SB.Simples.saveBets();
    renderTrash(); SB.Simples.renderSimples(); SB.Home.renderHome();
    U.showToast('Aposta restaurada.',ICO.check);
  }
  function permDelBet(id){
    if(!confirm('Excluir esta aposta definitivamente? Não pode ser desfeito.')) return;
    trashBets=trashBets.filter(function(b){return b.id!==id;});
    saveTrashBets();
    renderTrash();
  }
  function restoreSureOp(id){
    var item=trashSure.filter(function(s){return s.id===id;})[0];
    if(!item) return;
    trashSure=trashSure.filter(function(s){return s.id!==id;});
    saveTrashSure();
    delete item._deletedAt;
    SB.Surebets.sure.push(item);
    if(item.id>=SB.Surebets.snid) SB.Surebets.snid=item.id+1;
    SB.Surebets.saveSure();
    renderTrash(); SB.Surebets.renderSure(); SB.Home.renderHome();
    U.showToast('Surebet restaurada.',ICO.check);
  }
  function permDelSureOp(id){
    if(!confirm('Excluir esta surebet definitivamente? Não pode ser desfeito.')) return;
    trashSure=trashSure.filter(function(s){return s.id!==id;});
    saveTrashSure();
    renderTrash();
  }
  function restoreDG(id){
    var item=trashDG.filter(function(o){return o.id===id;})[0];
    if(!item) return;
    trashDG=trashDG.filter(function(o){return o.id!==id;});
    saveTrashDG();
    delete item._deletedAt;
    SB.DuploGreen.dg.push(item);
    if(item.id>=SB.DuploGreen.dgnid) SB.DuploGreen.dgnid=item.id+1;
    SB.DuploGreen.saveDG();
    renderTrash(); SB.DuploGreen.renderDG(); SB.Home.renderHome();
    U.showToast('Duplo Green restaurado.',ICO.check);
  }
  function permDelDG(id){
    if(!confirm('Excluir esta operação definitivamente? Não pode ser desfeito.')) return;
    trashDG=trashDG.filter(function(o){return o.id!==id;});
    saveTrashDG();
    renderTrash();
  }
  function esvaziarLixeira(){
    if(!trashBets.length && !trashSure.length && !trashDG.length){ U.showToast('A lixeira já está vazia.',ICO.check); return; }
    if(!confirm('Esvaziar a lixeira? Todas as apostas, surebets e duplo greens excluídos serão apagados definitivamente.')) return;
    trashBets=[]; trashSure=[]; trashDG=[];
    saveTrashBets(); saveTrashSure(); saveTrashDG();
    renderTrash();
    U.showToast('Lixeira esvaziada.',ICO.check);
  }
  function renderTrash(){
    var el=document.getElementById('trash-list');
    if(!el) return;
    var items=[];
    trashBets.forEach(function(b){ items.push({ts:b._deletedAt, html:
      '<div class="trash-row"><span class="attn-tag s">Simples</span>'+
      '<div class="attn-body"><div class="attn-title">'+(b.desc||b.casa)+'</div><div class="attn-sub">'+b.casa+' • @'+Number(b.odd).toFixed(2)+' • excluída em '+U.fmtDataShort(b._deletedAt)+'</div></div>'+
      '<button class="xbtn" onclick="SB.Lixeira.restoreBet('+b.id+')" title="Restaurar" style="margin-right:4px;">↺</button>'+
      '<button class="xbtn" onclick="SB.Lixeira.permDelBet('+b.id+')" title="Excluir definitivamente">×</button></div>'
    }); });
    trashSure.forEach(function(op){ items.push({ts:op._deletedAt, html:
      '<div class="trash-row"><span class="attn-tag b">Surebet</span>'+
      '<div class="attn-body"><div class="attn-title">'+(op.evento||('Surebet #'+op.id))+'</div><div class="attn-sub">'+op.pernas.length+' casas • excluída em '+U.fmtDataShort(op._deletedAt)+'</div></div>'+
      '<button class="xbtn" onclick="SB.Lixeira.restoreSureOp('+op.id+')" title="Restaurar" style="margin-right:4px;">↺</button>'+
      '<button class="xbtn" onclick="SB.Lixeira.permDelSureOp('+op.id+')" title="Excluir definitivamente">×</button></div>'
    }); });
    trashDG.forEach(function(op){ items.push({ts:op._deletedAt, html:
      '<div class="trash-row"><span class="attn-tag d">Duplo Green</span>'+
      '<div class="attn-body"><div class="attn-title">'+(op.evento||('Duplo Green #'+op.id))+'</div><div class="attn-sub">'+op.pernas.length+' casas • excluída em '+U.fmtDataShort(op._deletedAt)+'</div></div>'+
      '<button class="xbtn" onclick="SB.Lixeira.restoreDG('+op.id+')" title="Restaurar" style="margin-right:4px;">↺</button>'+
      '<button class="xbtn" onclick="SB.Lixeira.permDelDG('+op.id+')" title="Excluir definitivamente">×</button></div>'
    }); });
    items.sort(function(a,b){return new Date(b.ts)-new Date(a.ts);});
    el.innerHTML = items.length ? items.map(function(it){return it.html;}).join('') : H.emptyState(ICO.list,'A lixeira está vazia.');
  }

  return {
    trashBets: trashBets, trashSure: trashSure, trashDG: trashDG,
    saveTrashBets: saveTrashBets, saveTrashSure: saveTrashSure, saveTrashDG: saveTrashDG,
    restoreBet: restoreBet, permDelBet: permDelBet,
    restoreSureOp: restoreSureOp, permDelSureOp: permDelSureOp,
    restoreDG: restoreDG, permDelDG: permDelDG,
    esvaziarLixeira: esvaziarLixeira, renderTrash: renderTrash
  };
})();
