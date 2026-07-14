window.SB = window.SB || {};

/* ══════════ SB.Simples — Apostas simples: CRUD + stats + render ══════════ */
window.SB.Simples = (function() {
  var U = SB.Util, H = SB.Html, ST = SB.Store;
  var K = ST.KEYS.SIMPLES;
  var bets = (function(){ var s = ST.load(K); return s || []; })();
  var nid = bets.length ? Math.max.apply(null, bets.map(function(b){return b.id;}))+1 : 1;
  var editingBetId = null, curT = 'green', retornoManual = false;

  function saveBets(){ ST.save(K, bets); }
  function luc(b){ if(b.tipo==='green'||b.tipo==='cashout') return b.retorno-b.aposta; if(b.tipo==='red') return -b.aposta; return 0; }
  function sortLucroBet(b){ return b.tipo==='live' ? (b.retorno-b.aposta) : luc(b); }

  function statsSimples(){
    var cicloInicio = SB.Config.cfg.cicloInicioSimples;
    var inCycle = function(b){ return !cicloInicio || new Date(b.data)>=new Date(cicloInicio); };
    var allSettled = bets.filter(function(b){return b.tipo!=='live';});
    var settled = allSettled.filter(inCycle);
    var lives = bets.filter(function(b){return b.tipo==='live';});
    var greens = settled.filter(function(b){return luc(b)>=0;});
    var reds = settled.filter(function(b){return luc(b)<0;});
    var cashouts = settled.filter(function(b){return b.tipo==='cashout';});
    var invested = settled.reduce(function(s,b){return s+b.aposta;},0);
    var lucroTotal = settled.reduce(function(s,b){return s+luc(b);},0);
    var roi = invested?lucroTotal/invested*100:0;
    var winRate = settled.length?greens.length/settled.length*100:0;
    var banca = SB.Config.cfg.bancaSimples+lucroTotal;
    var pendGain = lives.reduce(function(s,b){return s+(b.retorno-b.aposta);},0);
    var pendStake = lives.reduce(function(s,b){return s+b.aposta;},0);
    var sortedSettled = settled.slice().sort(function(a,b){return new Date(a.data)-new Date(b.data);});
    var eq = H.computeEquity(sortedSettled, SB.Config.cfg.bancaSimples, luc);
    var map = {};
    settled.forEach(function(b){ map[b.casa]=(map[b.casa]||0)+luc(b); });
    var entries = Object.keys(map).map(function(k){return [k,map[k]];});
    entries.sort(function(a,b){return b[1]-a[1];});
    var monthProfit = lucroTotal;
    return {settled:settled, allSettled:allSettled, lives:lives, greens:greens, reds:reds, cashouts:cashouts,
      invested:invested, lucroTotal:lucroTotal, roi:roi, winRate:winRate,
      banca:banca, pendGain:pendGain, pendStake:pendStake, eq:eq, entries:entries, monthProfit:monthProfit};
  }

  function betCard(b){
    var pill = b.tipo==='green' ? '<span class="pill pg">Ganhos</span>' : b.tipo==='red' ? '<span class="pill pr">Perdas</span>' : b.tipo==='cashout' ? '<span class="pill pc">Cashout</span>' : '<span class="pill pl">Live</span>';
    var retornoLbl = b.tipo==='live' ? 'Projetado' : 'Retorno';
    var retornoVal = b.tipo==='red' ? 'R$0,00' : 'R$'+U.R2(b.retorno);
    var lucroDisplay = b.tipo==='live' ? (b.retorno-b.aposta) : luc(b);
    var lucroColor = lucroDisplay>=0 ? 'var(--emerald)' : 'var(--red)';
    var lucroLbl = b.tipo==='live' ? 'Lucro (projeção)' : 'Lucro';
    return '<div class="bet-card">'+
      '<div class="bc-top">'+pill+'<span class="bc-meta">'+b.casa+' • '+U.fmtDataShort(b.data)+' • <strong>@'+Number(b.odd).toFixed(2)+'</strong></span>'+
      '<button class="xbtn" onclick="SB.Simples.editBet('+b.id+')" title="Editar" style="margin-right:4px;">✎</button>'+
      '<button class="xbtn" onclick="SB.Simples.delBet('+b.id+')" title="Excluir">×</button></div>'+
      (b.desc?'<div class="bc-desc">'+b.desc+'</div>':'')+
      (b.descricao?'<div class="bc-desc2">'+b.descricao+'</div>':'')+
      '<div class="bc-bottom">'+
        '<div class="bc-nums"><span class="bc-lbl">Entrada</span><span class="bc-val">R$'+U.R2(b.aposta)+'</span></div>'+
        '<div class="bc-nums"><span class="bc-lbl">'+retornoLbl+'</span><span class="bc-val bc-blue">'+retornoVal+'</span></div>'+
        '<div class="bc-nums"><span class="bc-lbl">'+lucroLbl+'</span><span class="bc-val" style="color:'+lucroColor+';">'+(lucroDisplay>=0?'+':'−')+'R$'+U.R2(Math.abs(lucroDisplay))+'</span></div>'+
      '</div></div>';
  }

  function setT(t){
    curT=t;
    document.getElementById('topt-green').className='topt'+(t==='green'?' tg':'');
    document.getElementById('topt-red').className='topt'+(t==='red'?' tr':'');
    document.getElementById('topt-live').className='topt'+(t==='live'?' tp':'');
    document.getElementById('topt-cashout').className='topt'+(t==='cashout'?' ti':'');
    document.getElementById('fret-wrap').style.display = t==='red' ? 'none' : 'block';
    var hint=document.getElementById('fret-hint');
    if(hint) hint.textContent = t==='cashout' ? '— valor que a casa te pagou pra encerrar antes do fim' : '— sugerido automaticamente, edite se quiser';
  }
  function setTFromUI(t){
    var prev=curT;
    setT(t);
    if(t!==prev && t==='cashout'){ retornoManual=true; document.getElementById('fret').value=''; }
    else if(t!==prev && t!=='red'){ retornoManual=false; onOddApostaChange(); }
  }
  function onCasa(){
    document.getElementById('outra-f').style.display=document.getElementById('fcasa').value==='__x__'?'block':'none';
  }
  function updateOddProbHint(oddFieldId,hintId){
    var oddEl=document.getElementById(oddFieldId);
    var hintEl=document.getElementById(hintId);
    if(!oddEl||!hintEl) return;
    var odd=parseFloat(oddEl.value);
    hintEl.textContent = (odd>1) ? ('Probabilidade implícita: '+U.probImplicita(odd).toFixed(1)+'%') : 'Probabilidade implícita: —';
  }
  function onOddApostaChange(){
    updateOddProbHint('fodd','fodd-prob');
    if(retornoManual) return;
    var odd=parseFloat(document.getElementById('fodd').value);
    var ap=parseFloat(document.getElementById('fap').value);
    if(odd>1&&ap>0){ document.getElementById('fret').value=(ap*odd).toFixed(2); }
  }
  function onRetornoManualEdit(){ retornoManual=true; }

  function addBet(){
    var cs=document.getElementById('fcasa').value;
    var casa=cs==='__x__'?(document.getElementById('foutra').value.trim()||'Outra'):cs;
    var odd=parseFloat(document.getElementById('fodd').value);
    var ap=parseFloat(document.getElementById('fap').value);
    var titulo=document.getElementById('ftitulo').value.trim();
    var descricao=document.getElementById('fdescricao').value.trim();
    var dataAposta=U.combineDateTime(document.getElementById('fdata-date').value,document.getElementById('fdata-time').value,true);
    if(!odd||odd<=1){alert('Informe uma odd válida (maior que 1.00).');return;}
    if(!ap||ap<=0){alert('Informe o valor apostado.');return;}
    var retorno = curT==='red' ? 0 : parseFloat(document.getElementById('fret').value);
    if(curT!=='red' && (isNaN(retorno) || retorno<0)){ alert('Informe o retorno.'); return; }
    SB.Casas.addCasaIfNew(casa);
    if(editingBetId){
      var existing=bets.filter(function(b){return b.id===editingBetId;})[0];
      if(existing){ existing.casa=casa; existing.odd=odd; existing.aposta=ap; existing.retorno=retorno; existing.tipo=curT; existing.desc=titulo; existing.descricao=descricao; existing.data=dataAposta; }
      saveBets();
      U.showToast('Aposta atualizada.',ICO.check);
    } else {
      bets.push({id:nid++,casa:casa,odd:odd,aposta:ap,retorno:retorno,tipo:curT,desc:titulo,descricao:descricao,data:dataAposta});
      saveBets();
      U.showToast(curT==='green'?'Ganho registrado.':curT==='red'?'Perda registrada.':'Aposta ao vivo registrada.',ICO.check);
    }
    resetSimplesForm();
    SB.Nav.showTab('simples');
  }

  function editBet(id){
    var b=bets.filter(function(x){return x.id===id;})[0];
    if(!b) return;
    editingBetId=id;
    SB.Nav.setNovaTipo('simples');
    var casaSel=document.getElementById('fcasa');
    if(SB.Casas.casas.indexOf(b.casa)!==-1){ casaSel.value=b.casa; document.getElementById('outra-f').style.display='none'; }
    else { casaSel.value='__x__'; document.getElementById('outra-f').style.display='block'; document.getElementById('foutra').value=b.casa; }
    document.getElementById('fodd').value=b.odd;
    updateOddProbHint('fodd','fodd-prob');
    document.getElementById('fap').value=b.aposta;
    document.getElementById('fret').value=b.retorno;
    retornoManual=true;
    document.getElementById('ftitulo').value=b.desc||'';
    document.getElementById('fdescricao').value=b.descricao||'';
    var _fdt=U.splitToDateTime(b.data);
    document.getElementById('fdata-date').value=_fdt.date;
    document.getElementById('fdata-time').value=_fdt.time;
    setT(b.tipo);
    document.getElementById('nova-submit-simples').innerHTML=ICO.check+' Salvar alterações';
    document.getElementById('edit-banner').style.display='block';
    SB.Nav.showTab('nova');
  }

  function resetSimplesForm(){
    editingBetId=null;
    retornoManual=false;
    document.getElementById('fap').value='';
    document.getElementById('fodd').value='';
    document.getElementById('fodd-prob').textContent='Probabilidade implícita: —';
    document.getElementById('fret').value='';
    document.getElementById('ftitulo').value='';
    document.getElementById('fdescricao').value='';
    document.getElementById('foutra').value='';
    document.getElementById('fdata-date').value=U.splitToDateTime(new Date().toISOString()).date;
    document.getElementById('fdata-time').value=U.splitToDateTime(new Date().toISOString()).time;
    setT('green');
    document.getElementById('nova-submit-simples').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Registrar aposta';
    document.getElementById('edit-banner').style.display='none';
  }

  function delBet(id){
    if(!confirm('Remover esta aposta? Ela vai pra lixeira, você pode restaurar depois em Configurações.'))return;
    var item=bets.filter(function(b){return b.id===id;})[0];
    bets=bets.filter(function(b){return b.id!==id;});
    saveBets();
    if(item){ item._deletedAt=new Date().toISOString(); SB.Lixeira.trashBets.push(item); SB.Lixeira.saveTrashBets(); }
    renderSimples(); SB.Home.renderHome();
  }

  function renderSimples(){
    SB.Home.updateHeaderBanca();
    var st=statsSimples();
    document.getElementById('s-hero').innerHTML=
      '<div class="hero ind">'+
      '<div class="hero-top"><div>'+
      '<div class="hero-label">'+ICO.list+'Banca atual — apostas simples</div>'+
      '<div class="hero-value '+(st.banca>=0?'pos':'neg')+'" id="s-hero-value">R$ 0,00</div>'+
      '<div class="hero-meta">Lucro líquido <strong>'+U.fmtMoney(st.lucroTotal)+'</strong> · ROI <strong>'+(st.roi>=0?'+':'')+st.roi.toFixed(2)+'%</strong></div>'+
      '</div><div class="hero-icon">'+ICO.wallet+'</div></div></div>';
    U.animateCountUp(document.getElementById('s-hero-value'), st.banca, 'R$ ');
    document.getElementById('s-stats').innerHTML=
      '<div class="stat-row">'+
      H.statCard(ICO.trendUp,'Lucro',U.fmtMoney(st.lucroTotal),st.lucroTotal>=0?'vg':'vr',(SB.Config.cfg.bancaSimples? (st.lucroTotal/SB.Config.cfg.bancaSimples*100).toFixed(1)+'% da banca inicial' : ''))+
      H.statCard(ICO.activity,'ROI',(st.roi>=0?'+':'')+st.roi.toFixed(2)+'%',st.roi>=0?'vg':'vr','R$'+U.R2(st.invested)+' apostado')+
      H.statCard(ICO.target,'Taxa de acerto',st.winRate.toFixed(1)+'%','vb',st.greens.length+'G / '+st.reds.length+'R')+
      H.statCard(ICO.trendDown,'Drawdown máx.',U.fmtMoney(-st.eq.drawdown).replace('−R$','R$'),'va','maior queda registrada')+
      '</div>';
    document.getElementById('s-mini').innerHTML=
      '<div class="mini-row mini-row-5">'+
      H.miniStat(st.greens.length,'Ganhos','g',ICO.check)+
      H.miniStat(st.reds.length,'Perdas','r',ICO.xcirc)+
      H.miniStat(st.cashouts.length,'Cashout','b',ICO.wallet)+
      H.miniStat(st.lives.length,'Live','a',ICO.clock)+
      H.miniStat(st.settled.length+st.lives.length,'Total','b',ICO.layers)+
      '</div>';
    document.getElementById('s-meta').innerHTML=H.metaCard(st.monthProfit, SB.Config.cfg.metaSimples,'Meta deste ciclo');
    document.getElementById('s-rank').innerHTML=H.rankCard(st.entries[0],st.entries[st.entries.length-1]);
    var map={}; st.settled.forEach(function(b){ map[b.casa]=(map[b.casa]||0)+luc(b); });
    var keys=Object.keys(map);
    var maxV=Math.max.apply(null,keys.map(function(k){return Math.abs(map[k]);}).concat([1]));
    document.getElementById('s-breakdown').innerHTML = keys.length ? keys.map(function(k){
      var v=map[k];
      return H.bkR(k, v>=0?'var(--emerald)':'var(--red)', v>=0?'var(--emerald-b)':'var(--red-b)', U.pct(Math.abs(v),maxV), U.fmtMoney(v), v>=0?'var(--emerald)':'var(--red)');
    }).join('') : H.emptyState(ICO.list,'Nenhuma aposta registrada ainda.');
    var monthlyS = H.monthlyBuckets(st.allSettled, function(b){return b.data;}, luc, 6);
    document.getElementById('s-monthly').innerHTML = H.monthlyBarsHtml(monthlyS);
    document.getElementById('s-live').innerHTML = st.lives.length ? st.lives.slice().reverse().map(betCard).join('') : H.emptyState(ICO.clock,'Nenhuma aposta ao vivo agora.');
    var filterCasaS = document.getElementById('s-filter-casa') ? document.getElementById('s-filter-casa').value : '';
    var filterStatusS = document.getElementById('s-filter-status') ? document.getElementById('s-filter-status').value : '';
    var searchS = document.getElementById('s-filter-search') ? document.getElementById('s-filter-search').value.trim().toLowerCase() : '';
    var deS = document.getElementById('s-filter-de') ? document.getElementById('s-filter-de').value : '';
    var ateS = document.getElementById('s-filter-ate') ? document.getElementById('s-filter-ate').value : '';
    var sortS = document.getElementById('s-filter-sort') ? document.getElementById('s-filter-sort').value : 'recentes';
    var histList = bets.slice().filter(function(b){
      if(filterCasaS && b.casa!==filterCasaS) return false;
      if(filterStatusS && b.tipo!==filterStatusS) return false;
      if(searchS && (b.desc||'').toLowerCase().indexOf(searchS)===-1 && (b.descricao||'').toLowerCase().indexOf(searchS)===-1 && b.casa.toLowerCase().indexOf(searchS)===-1) return false;
      if(deS && new Date(b.data) < new Date(deS+'T00:00:00')) return false;
      if(ateS && new Date(b.data) > new Date(ateS+'T23:59:59')) return false;
      return true;
    }).sort(function(a,b){
      if(sortS==='lucro_desc') return sortLucroBet(b)-sortLucroBet(a);
      if(sortS==='lucro_asc') return sortLucroBet(a)-sortLucroBet(b);
      if(sortS==='odd_desc') return b.odd-a.odd;
      return new Date(b.data)-new Date(a.data);
    });
    document.getElementById('s-hist').innerHTML = histList.length ? histList.map(betCard).join('') : H.emptyState(ICO.list, bets.length?'Nenhuma aposta encontrada com esse filtro.':'Nenhuma aposta registrada ainda.');
  }

  function exportCSVSimples(){
    if(!bets.length){ alert('Ainda não há apostas simples registradas.'); return; }
    var rows=[['Data','Casa','Status','Odd','Valor Apostado','Retorno','Lucro','Título','Descrição']];
    bets.slice().sort(function(a,b){return new Date(a.data)-new Date(b.data);}).forEach(function(b){
      var status = b.tipo==='green'?'Ganho':b.tipo==='red'?'Perda':b.tipo==='cashout'?'Cashout':'Live';
      var lucroTxt = b.tipo==='live' ? (b.retorno-b.aposta).toFixed(2)+' (projeção)' : luc(b).toFixed(2);
      rows.push([U.fmtDataShort(b.data), b.casa, status, b.odd, b.aposta.toFixed(2), b.retorno.toFixed(2), lucroTxt, b.desc||'', b.descricao||'']);
    });
    SB.Relatorios.downloadCSV(rows,'apostas-simples');
  }

  function exportPDFSimples(){
    if(!bets.length){ alert('Ainda não há apostas simples registradas.'); return; }
    var st=statsSimples();
    var lucroColor = st.lucroTotal>=0 ? '#0a8a3f' : '#c62828';
    var roiColor = st.roi>=0 ? '#0a8a3f' : '#c62828';
    var summary=H.sumCard('Banca atual','R$ '+U.R2(st.banca))+H.sumCard('Lucro do ciclo',U.fmtMoney(st.lucroTotal),lucroColor)+H.sumCard('ROI',(st.roi>=0?'+':'')+st.roi.toFixed(2)+'%',roiColor)+H.sumCard('Taxa de acerto',st.winRate.toFixed(1)+'%');
    var headers=['Data','Casa','Título','Status','Odd','Apostado','Retorno','Lucro'];
    var rows=bets.slice().sort(function(a,b){return new Date(a.data)-new Date(b.data);}).map(function(b){
      var status=b.tipo==='green'?'Ganho':b.tipo==='red'?'Perda':b.tipo==='cashout'?'Cashout':'Live';
      var statusColor=b.tipo==='green'?'#0a8a3f':b.tipo==='red'?'#c62828':b.tipo==='cashout'?'#4338ca':'#b8860b';
      var lucroTxt=(b.tipo==='live'?(b.retorno-b.aposta):luc(b)).toFixed(2);
      return [U.fmtDataShort(b.data), b.casa, b.desc||'—', '<span style="color:'+statusColor+';font-weight:700;">'+status+'</span>', Number(b.odd).toFixed(2), b.aposta.toFixed(2), b.retorno.toFixed(2), lucroTxt];
    });
    SB.Relatorios.printReport('Relatório de Apostas Simples', summary, headers, rows);
  }

  return {
    bets: bets, nid: nid, editingBetId: editingBetId,
    saveBets: saveBets, luc: luc, sortLucroBet: sortLucroBet,
    statsSimples: statsSimples, renderSimples: renderSimples, betCard: betCard,
    setT: setT, setTFromUI: setTFromUI, onCasa: onCasa,
    updateOddProbHint: updateOddProbHint, onOddApostaChange: onOddApostaChange,
    onRetornoManualEdit: onRetornoManualEdit,
    addBet: addBet, editBet: editBet, resetSimplesForm: resetSimplesForm, delBet: delBet,
    exportCSVSimples: exportCSVSimples, exportPDFSimples: exportPDFSimples
  };
})();
