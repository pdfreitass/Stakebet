window.SB = window.SB || {};

/* ══════════ SB.Surebets — Surebets: CRUD + calculadora + stats + render ══════════ */
window.SB.Surebets = (function() {
  var U = SB.Util, H = SB.Html, ST = SB.Store;
  var K = ST.KEYS.SURE;
  var sure = (function(){ var s = ST.load(K); return s || []; })();
  var snid = sure.length ? Math.max.apply(null, sure.map(function(s){return s.id;}))+1 : 1;
  var editingSureId = null;
  var legCounts = {};
  var legOverride = {};

  function saveSure(){ ST.save(K, sure); }
  function sureBadgeStatus(op){
    if(op.tipo==='red') return 'red';
    if(op.tipo==='green') return 'green';
    if(op.dataFim && new Date(op.dataFim)<=new Date()) return 'green';
    return 'live';
  }
  function setSureStatus(id,status){
    sure.forEach(function(op){if(op.id===id) op.tipo=status;});
    saveSure(); renderSure(); SB.Home.renderHome();
  }
  function delSure(id){
    if(!confirm('Remover esta surebet? Ela vai pra lixeira, você pode restaurar depois em Configurações.'))return;
    var item=sure.filter(function(op){return op.id===id;})[0];
    sure=sure.filter(function(op){return op.id!==id;});
    saveSure();
    if(item){ item._deletedAt=new Date().toISOString(); SB.Lixeira.trashSure.push(item); SB.Lixeira.saveTrashSure(); }
    renderSure(); SB.Home.renderHome();
  }

  function statsSure(){
    var cicloInicio = SB.Config.cfg.cicloInicioSure;
    var inCycle = function(op){ return !cicloInicio || new Date(U.sureEventDate(op))>=new Date(cicloInicio); };
    var groups = {live:[],green:[],red:[]};
    sure.forEach(function(op){ groups[sureBadgeStatus(op)].push(op); });
    var live=groups.live, greenAll=groups.green, redAll=groups.red;
    var green=greenAll.filter(inCycle), red=redAll.filter(inCycle);
    var lucroGar=live.concat(green).reduce(function(s,op){return s+op.lucroMin;},0);
    var investAtivo=live.concat(green).reduce(function(s,op){return s+op.investimento;},0);
    var preso=live.reduce(function(s,op){return s+op.investimento;},0);
    var liberadoVal=green.reduce(function(s,op){return s+op.investimento+op.lucroMin;},0);
    var perdaProblema=red.reduce(function(s,op){return s+op.investimento;},0);
    var settled=green.concat(red);
    var allSettled=greenAll.concat(redAll);
    var lucroRealizado=green.reduce(function(s,op){return s+op.lucroMin;},0)-red.reduce(function(s,op){return s+op.investimento;},0);
    var investedSettled=settled.reduce(function(s,op){return s+op.investimento;},0);
    var roi=investedSettled?lucroRealizado/investedSettled*100:0;
    var winRate=settled.length?green.length/settled.length*100:0;
    var banca=SB.Config.cfg.bancaSure+lucroRealizado;
    var sortedSettled=settled.slice().sort(function(a,b){return new Date(U.sureEventDate(a))-new Date(U.sureEventDate(b));});
    var eq=H.computeEquity(sortedSettled, SB.Config.cfg.bancaSure, function(op){ return op.tipo==='red' ? -op.investimento : op.lucroMin; });
    var monthProfit=lucroRealizado;
    var lucroCompleto=lucroRealizado+live.reduce(function(s,op){return s+op.lucroMin;},0);
    return {live:live,green:green,red:red,settled:settled,allSettled:allSettled,lucroGar:lucroGar,investAtivo:investAtivo,preso:preso,liberadoVal:liberadoVal,
      perdaProblema:perdaProblema,banca:banca,roi:roi,winRate:winRate,eq:eq,monthProfit:monthProfit,settledCount:settled.length,lucroCompleto:lucroCompleto};
  }

  function sureCard(op){
    var st=sureBadgeStatus(op);
    var pill = st==='green' ? '<span class="pill pg">Ganhos</span>' : st==='red' ? '<span class="pill pr">Perdas</span>' : '<span class="pill pl">Preso</span>';
    var legsHtml = op.pernas.map(function(p){
      return '<div class="leg-row"><span class="leg-casa">'+p.casa+'</span><span class="leg-odd">@'+Number(p.odd).toFixed(2)+'</span><span class="leg-val">R$'+U.R2(p.valor)+'</span></div>';
    }).join('');
    var dataTxt = op.dataFim ? U.fmtDataHora(op.dataFim) : 'sem data definida';
    return '<div class="sure-card">'+
      '<div class="bc-top">'+pill+'<span class="bc-meta">'+(op.evento||('Surebet #'+op.id))+'</span>'+
      '<button class="xbtn" onclick="SB.Surebets.editSure('+op.id+')" title="Editar" style="margin-right:4px;">✎</button>'+
      '<button class="xbtn" onclick="SB.Surebets.delSure('+op.id+')" title="Excluir">×</button></div>'+
      (op.descricao?'<div class="bc-desc2">'+op.descricao+'</div>':'')+
      '<div class="sc-legs">'+legsHtml+'</div>'+
      '<div class="bc-bottom">'+
        '<div class="bc-nums"><span class="bc-lbl">Investido</span><span class="bc-val">R$'+U.R2(op.investimento)+'</span></div>'+
        '<div class="bc-nums"><span class="bc-lbl">Retorno garantido</span><span class="bc-val bc-blue">R$'+U.R2(op.investimento+op.lucroMin)+'</span></div>'+
        '<div class="bc-nums"><span class="bc-lbl">Lucro</span><span class="bc-val" style="color:'+(op.lucroMin>=0?'var(--emerald)':'var(--red)')+';">'+(op.lucroMin>=0?'+':'−')+'R$'+U.R2(Math.abs(op.lucroMin))+'</span></div>'+
      '</div>'+
      (op.nota?'<div class="sc-nota">"'+op.nota+'"</div>':'')+
      '<div class="sc-actions">'+
        (st!=='green'?'<button class="mbtn mg" onclick="SB.Surebets.setSureStatus('+op.id+',\'green\')">Ganhos</button>':'')+
        (st!=='red'?'<button class="mbtn mr" onclick="SB.Surebets.setSureStatus('+op.id+',\'red\')">Perdas</button>':'')+
        (st!=='live'?'<button class="mbtn mu" onclick="SB.Surebets.setSureStatus('+op.id+',\'live\')">↺</button>':'')+
      '</div>'+
      '<div class="sc-stamp">'+dataTxt+' · registrada em '+U.fmtDataHora(op.criada)+'</div>'+
    '</div>';
  }

  function renderSure(){
    SB.Home.updateHeaderBanca();
    var st=statsSure();
    document.getElementById('u-hero').innerHTML=
      '<div class="hero em">'+
      '<div class="hero-top"><div>'+
      '<div class="hero-label">'+ICO.scale+'Banca atual — surebets</div>'+
      '<div class="hero-value '+(st.banca>=0?'pos':'neg')+'" id="u-hero-value">R$ 0,00</div>'+
      '<div class="hero-meta">Lucro garantido (inclui preso) <strong>'+U.fmtMoney(st.lucroGar)+'</strong> · Preso <strong>R$ '+U.R2(st.preso)+'</strong></div>'+
      '</div><div class="hero-icon">'+ICO.lock+'</div></div></div>';
    U.animateCountUp(document.getElementById('u-hero-value'), st.banca, 'R$ ');
    document.getElementById('u-stats').innerHTML=
      '<div class="stat-row">'+
      H.statCard(ICO.trendUp,'Lucro garantido',U.fmtMoney(st.lucroGar),st.lucroGar>=0?'vg':'vr','inclui operações ainda presas')+
      H.statCard(ICO.activity,'ROI (resolvidas)',(st.roi>=0?'+':'')+st.roi.toFixed(2)+'%',st.roi>=0?'vg':'vr',st.settledCount+' operação(ões) resolvida(s)')+
      H.statCard(ICO.lock,'Dinheiro preso',U.fmtMoney(st.preso).replace('−R$','R$'),'va',st.live.length+' ao vivo')+
      H.statCard(ICO.xcirc,'Perdas',U.fmtMoney(st.perdaProblema).replace('−R$','R$'),'vr',st.red.length+' operação(ões)')+
      '</div>';
    document.getElementById('u-mini').innerHTML=
      '<div class="mini-row">'+
      H.miniStat(st.green.length,'Ganhos','g',ICO.check)+
      H.miniStat(st.red.length,'Perdas','r',ICO.xcirc)+
      H.miniStat(st.live.length,'Ao vivo','a',ICO.clock)+
      H.miniStat(st.green.length+st.red.length+st.live.length,'Total','b',ICO.layers)+
      '</div>';
    document.getElementById('u-meta').innerHTML=H.metaCard(st.monthProfit, SB.Config.cfg.metaSure,'Meta deste ciclo');
    var presoPorCasa={}, ordemCasa=[];
    st.live.forEach(function(op){ op.pernas.forEach(function(p){
      if(ordemCasa.indexOf(p.casa)===-1){ordemCasa.push(p.casa);presoPorCasa[p.casa]=0;}
      presoPorCasa[p.casa]+=p.valor;
    }); });
    var maxCasa=Math.max.apply(null, ordemCasa.map(function(c){return presoPorCasa[c];}).concat([1]));
    document.getElementById('u-breakdown').innerHTML = ordemCasa.length ? ordemCasa.map(function(c){
      return H.bkR(c,'var(--indigo2)','var(--indigo-b)', U.pct(presoPorCasa[c],maxCasa), 'R$'+U.R2(presoPorCasa[c]), 'var(--indigo2)');
    }).join('') : H.emptyState(ICO.lock,'Nenhum valor preso agora.');
    var monthlyU = H.monthlyBuckets(st.allSettled, function(op){return U.sureEventDate(op);}, function(op){return op.tipo==='red'?-op.investimento:op.lucroMin;}, 6);
    document.getElementById('u-monthly').innerHTML = H.monthlyBarsHtml(monthlyU);
    document.getElementById('u-live').innerHTML = st.live.length ? st.live.map(sureCard).join('') : H.emptyState(ICO.clock,'Nenhuma surebet ao vivo agora.');
    var filterCasaU = document.getElementById('u-filter-casa') ? document.getElementById('u-filter-casa').value : '';
    var filterStatusU = document.getElementById('u-filter-status') ? document.getElementById('u-filter-status').value : '';
    var searchU = document.getElementById('u-filter-search') ? document.getElementById('u-filter-search').value.trim().toLowerCase() : '';
    var deU = document.getElementById('u-filter-de') ? document.getElementById('u-filter-de').value : '';
    var ateU = document.getElementById('u-filter-ate') ? document.getElementById('u-filter-ate').value : '';
    var sortU = document.getElementById('u-filter-sort') ? document.getElementById('u-filter-sort').value : 'recentes';
    var histSure = sure.slice().filter(function(op){
      if(filterCasaU && !op.pernas.some(function(p){return p.casa===filterCasaU;})) return false;
      if(filterStatusU && sureBadgeStatus(op)!==filterStatusU) return false;
      if(searchU && (op.evento||'').toLowerCase().indexOf(searchU)===-1 && (op.nota||'').toLowerCase().indexOf(searchU)===-1 && (op.descricao||'').toLowerCase().indexOf(searchU)===-1) return false;
      if(deU && new Date(U.sureEventDate(op)) < new Date(deU+'T00:00:00')) return false;
      if(ateU && new Date(U.sureEventDate(op)) > new Date(ateU+'T23:59:59')) return false;
      return true;
    }).sort(function(a,b){
      if(sortU==='lucro_desc') return b.lucroMin-a.lucroMin;
      if(sortU==='lucro_asc') return a.lucroMin-b.lucroMin;
      if(sortU==='odd_desc') return (b.pernas[0]?b.pernas[0].odd:0)-(a.pernas[0]?a.pernas[0].odd:0);
      return new Date(U.sureEventDate(b))-new Date(U.sureEventDate(a));
    });
    document.getElementById('u-hist').innerHTML = histSure.length ? histSure.map(sureCard).join('') : H.emptyState(ICO.scale, sure.length?'Nenhuma surebet encontrada com esse filtro.':'Nenhuma surebet registrada ainda.');
  }

  /* ── Calculadora de legs (genérica) ── */
  function setLegCount(prefix,n){
    legCounts[prefix]=Math.max(2,Math.min(6,n));
    renderLegsContainer(prefix);
  }
  function legCardHtml(prefix,i,removable){
    var valorField = i===0
      ? '<div class="field"><label>Stake (R$) <span>— defina aqui</span></label><input type="number" step="0.01" min="0" id="'+prefix+'valor'+i+'" placeholder="100" inputmode="decimal" oninput="SB.Surebets.calcSure(\''+prefix+'\')"></div>'
      : '<div class="field"><label>Stake (R$) <span id="'+prefix+'ovwrap'+i+'" style="display:none;color:var(--amber);text-transform:none;">— editado, <a href="#" onclick="SB.Surebets.resetLegOverride(\''+prefix+'\','+i+'); return false;" style="color:var(--indigo2);">recalcular automático ↺</a></span></label><input type="number" step="0.01" min="0" id="'+prefix+'valor'+i+'" placeholder="0.00" inputmode="decimal" oninput="SB.Surebets.onLegStakeManualEdit(\''+prefix+'\','+i+')"></div>';
    var removeBtn = removable ? '<button class="xbtn" onclick="SB.Surebets.removeLeg(\''+prefix+'\','+i+')" style="position:absolute;top:12px;right:12px;" title="Remover casa">×</button>' : '';
    var recField = prefix==='dg' ? '<div class="frow"><div class="field"><label>Recebido (R$) <span>— quando pagar</span></label><input type="number" step="0.01" min="0" id="'+prefix+'rec'+i+'" placeholder="0.00" inputmode="decimal"></div><div class="field"><label>Comissão % <span>— opcional</span></label><input type="number" step="0.01" min="0" max="100" id="'+prefix+'com'+i+'" placeholder="0" inputmode="decimal"></div></div>' : '';
    return '<div class="fcard" style="margin-bottom:10px;padding:14px;position:relative;">'+
      removeBtn+
      '<div class="field"><label>Casa '+(i+1)+'</label><div class="selwrap"><select id="'+prefix+'casa'+i+'" class="casa-select" onchange="SB.Surebets.onLegCasa(\''+prefix+'\','+i+')"></select></div></div>'+
      '<div class="field" id="'+prefix+'outrawrap'+i+'" style="display:none;"><label>Nome da casa</label><input type="text" id="'+prefix+'outra'+i+'" placeholder="Ex: Sportingbet" oninput="SB.Surebets.calcSure(\''+prefix+'\')"></div>'+
      '<div class="field"><label>Odd</label><input type="number" step="0.01" min="1.01" id="'+prefix+'odd'+i+'" placeholder="2.10" inputmode="decimal" oninput="SB.Surebets.calcSure(\''+prefix+'\')"></div>'+
      '<div class="odd-prob" id="'+prefix+'oddprob'+i+'">Probabilidade implícita: —</div>'+
      '<div class="ret-hint" id="'+prefix+'rethint'+i+'">Retorno: R$0,00</div>'+
      valorField+
      recField+
      '<div id="'+prefix+'result'+i+'"></div>'+
    '</div>';
  }
  function onLegStakeManualEdit(prefix,i){
    if(!legOverride[prefix]) legOverride[prefix]=[];
    legOverride[prefix][i]=true;
    var ov=document.getElementById(prefix+'ovwrap'+i);
    if(ov) ov.style.display='inline';
    calcSure(prefix);
  }
  function resetLegOverride(prefix,i){
    if(legOverride[prefix]) legOverride[prefix][i]=false;
    var ov=document.getElementById(prefix+'ovwrap'+i);
    if(ov) ov.style.display='none';
    calcSure(prefix);
  }
  function renderLegsContainer(prefix){
    var n=legCounts[prefix];
    legOverride[prefix]=new Array(n).fill(false);
    var html='';
    for(var i=0;i<n;i++){ html+=legCardHtml(prefix,i,i>=2); }
    document.getElementById(prefix+'-legs').innerHTML=html;
    SB.Casas.renderCasaSelects();
    calcSure(prefix);
  }
  function captureLegValues(prefix){
    var n=legCounts[prefix];
    var out=[];
    var ov=legOverride[prefix]||[];
    for(var i=0;i<n;i++){
      var casaEl=document.getElementById(prefix+'casa'+i);
      var outraEl=document.getElementById(prefix+'outra'+i);
      var oddEl=document.getElementById(prefix+'odd'+i);
      var valorEl=document.getElementById(prefix+'valor'+i);
      var recEl=document.getElementById(prefix+'rec'+i);
      var comEl=document.getElementById(prefix+'com'+i);
      out.push({
        casa: casaEl?casaEl.value:'',
        outra: outraEl?outraEl.value:'',
        odd: oddEl?oddEl.value:'',
        valor: valorEl?valorEl.value:'',
        rec: recEl?recEl.value:'',
        com: comEl?comEl.value:'',
        override: !!ov[i]
      });
    }
    return out;
  }
  function restoreLegValues(prefix,vals){
    legOverride[prefix]=vals.map(function(v){return !!v.override;});
    vals.forEach(function(v,i){
      var cs=document.getElementById(prefix+'casa'+i);
      if(cs && v.casa){ cs.value=v.casa; }
      SB.Surebets.onLegCasa(prefix,i);
      var ot=document.getElementById(prefix+'outra'+i);
      if(ot) ot.value=v.outra;
      var od=document.getElementById(prefix+'odd'+i);
      if(od) od.value=v.odd;
      if(i===0 || v.override){ var vf=document.getElementById(prefix+'valor'+i); if(vf) vf.value=v.valor; }
      if(i>0 && v.override){ var ov2=document.getElementById(prefix+'ovwrap'+i); if(ov2) ov2.style.display='inline'; }
      var rc=document.getElementById(prefix+'rec'+i);
      if(rc) rc.value=v.rec;
      var cm=document.getElementById(prefix+'com'+i);
      if(cm) cm.value=v.com;
    });
  }
  function addLeg(prefix){
    if(legCounts[prefix]>=6){ alert('Máximo de 6 casas por operação.'); return; }
    var vals=captureLegValues(prefix);
    legCounts[prefix]++;
    renderLegsContainer(prefix);
    restoreLegValues(prefix,vals);
    calcSure(prefix);
  }
  function removeLeg(prefix,i){
    if(legCounts[prefix]<=2) return;
    var vals=captureLegValues(prefix).filter(function(v,idx){return idx!==i;});
    legCounts[prefix]=legCounts[prefix]-1;
    renderLegsContainer(prefix);
    restoreLegValues(prefix,vals);
    calcSure(prefix);
  }
  function onLegCasa(prefix,i){
    document.getElementById(prefix+'outrawrap'+i).style.display = document.getElementById(prefix+'casa'+i).value==='__x__' ? 'block':'none';
    calcSure(prefix);
  }

  function calcSure(prefix){
    var n=legCounts[prefix];
    var legs=[], oddsOk=true;
    var ov=legOverride[prefix]||[];
    for(var i=0;i<n;i++){
      var selEl=document.getElementById(prefix+'casa'+i);
      if(!selEl){oddsOk=false;continue;}
      var cs=selEl.value;
      var outraEl=document.getElementById(prefix+'outra'+i);
      var casa = cs==='__x__' ? ((outraEl&&outraEl.value.trim())||'Outra') : cs;
      var odd=parseFloat(document.getElementById(prefix+'odd'+i).value);
      if(!odd||odd<=1) oddsOk=false;
      legs.push({casa:casa,odd:odd});
      SB.Simples.updateOddProbHint(prefix+'odd'+i, prefix+'oddprob'+i);
    }
    var stakeAncora=parseFloat(document.getElementById(prefix+'valor0').value);
    if(!oddsOk || !stakeAncora || stakeAncora<=0){
      for(var j=0;j<n;j++){
        var rh=document.getElementById(prefix+'rethint'+j); if(rh) rh.textContent='Retorno: R$0,00';
        var rb=document.getElementById(prefix+'result'+j); if(rb) rb.innerHTML='';
        if(j>0 && !ov[j]){ var f=document.getElementById(prefix+'valor'+j); if(f) f.value=''; }
      }
      return null;
    }
    var retornoBalanceado = stakeAncora*legs[0].odd;
    legs[0].valor = stakeAncora;
    var investimento = stakeAncora;
    for(var i2=1;i2<n;i2++){
      if(ov[i2]){
        var manualVal=parseFloat(document.getElementById(prefix+'valor'+i2).value);
        legs[i2].valor = isNaN(manualVal)?0:manualVal;
      } else {
        var stakeI = retornoBalanceado/legs[i2].odd;
        legs[i2].valor = stakeI;
        var fld=document.getElementById(prefix+'valor'+i2);
        if(fld) fld.value = stakeI.toFixed(2);
      }
      investimento += legs[i2].valor;
    }
    var cenarios = legs.map(function(l){ return { casa:l.casa, lucro:(l.valor*l.odd)-investimento }; });
    var lucros = cenarios.map(function(c){return c.lucro;});
    var minLucro = Math.min.apply(null,lucros);
    var maxLucro = Math.max.apply(null,lucros);
    var balanced = (maxLucro-minLucro) < 0.02;
    var lucro = minLucro;
    var roi = investimento? lucro/investimento*100 : 0;
    var arb = minLucro>0.004;
    for(var k=0;k<n;k++){
      var rhEl=document.getElementById(prefix+'rethint'+k);
      if(rhEl) rhEl.textContent='Retorno se vencer: R$'+(legs[k].valor*legs[k].odd).toFixed(2);
      var roiLeg = legs[k].valor? cenarios[k].lucro/legs[k].valor*100 : 0;
      var rbEl=document.getElementById(prefix+'result'+k);
      if(rbEl) rbEl.innerHTML=H.legResultBox(cenarios[k].lucro,roiLeg, balanced?null:('Se '+legs[k].casa+' vencer'));
    }
    return {legs:legs, investimento:investimento, retorno:investimento+lucro, lucro:lucro, roi:roi, arb:arb, cenarios:cenarios, balanced:balanced, minLucro:minLucro, maxLucro:maxLucro};
  }

  function registerSure(){
    var calc=calcSure('leg');
    if(!calc){ alert('Preencha as odds de todas as casas e o valor da Casa 1.'); return; }
    if(!calc.arb){
      if(!confirm('Essas odds não garantem lucro (resultado: '+(calc.lucro>=0?'+':'−')+'R$'+Math.abs(calc.lucro).toFixed(2)+'). Registrar mesmo assim?')) return;
    }
    calc.legs.forEach(function(l){ SB.Casas.addCasaIfNew(l.casa); });
    var evento=document.getElementById('sevento').value.trim();
    var descricao=document.getElementById('sdescricao').value.trim();
    var dataFim=U.combineDateTime(document.getElementById('sdata-date').value,document.getElementById('sdata-time').value,false);
    var nota=document.getElementById('snota').value.trim();
    var cenarios=calc.legs.map(function(l){return {casa:l.casa,lucro:calc.lucro};});
    if(editingSureId){
      var op=sure.filter(function(x){return x.id===editingSureId;})[0];
      if(op){
        op.evento=evento; op.descricao=descricao; op.dataFim=dataFim; op.nota=nota;
        op.pernas=calc.legs; op.investimento=calc.investimento;
        op.lucroMin=calc.lucro; op.lucroMax=calc.lucro; op.roiMin=calc.roi;
        op.cenarios=cenarios;
      }
      saveSure();
      U.showToast('Surebet atualizada.',ICO.check);
    } else {
      sure.push({
        id:snid++, evento:evento, descricao:descricao, dataFim:dataFim, criada:new Date().toISOString(), nota:nota,
        pernas:calc.legs, investimento:calc.investimento,
        lucroMin:calc.lucro, lucroMax:calc.lucro, roiMin:calc.roi,
        cenarios:cenarios, tipo:'live'
      });
      saveSure();
      U.showToast(calc.arb?'Surebet registrada.':'Registrada com risco assumido.',calc.arb?ICO.check:ICO.xcirc);
    }
    resetSureForm();
    SB.Nav.showTab('sure');
  }

  function editSure(id){
    var op=sure.filter(function(x){return x.id===id;})[0];
    if(!op) return;
    editingSureId=id;
    SB.Nav.setNovaTipo('sure');
    var n=op.pernas.length;
    setLegCount('leg',n);
    op.pernas.forEach(function(p,i){
      var casaSel=document.getElementById('legcasa'+i);
      if(SB.Casas.casas.indexOf(p.casa)!==-1){ casaSel.value=p.casa; document.getElementById('legoutrawrap'+i).style.display='none'; }
      else { casaSel.value='__x__'; document.getElementById('legoutrawrap'+i).style.display='block'; document.getElementById('legoutra'+i).value=p.casa; }
      document.getElementById('legodd'+i).value=p.odd;
    });
    document.getElementById('legvalor0').value=op.pernas[0].valor.toFixed(2);
    calcSure('leg');
    document.getElementById('sevento').value=op.evento||'';
    document.getElementById('sdescricao').value=op.descricao||'';
    var _sdt=U.splitToDateTime(op.dataFim);
    document.getElementById('sdata-date').value=_sdt.date;
    document.getElementById('sdata-time').value=_sdt.time;
    document.getElementById('snota').value=op.nota||'';
    document.getElementById('nova-submit-sure').innerHTML=ICO.check+' Salvar alterações';
    document.getElementById('edit-banner').style.display='block';
    SB.Nav.showTab('nova');
  }

  function resetSureForm(){
    editingSureId=null;
    document.getElementById('sevento').value='';
    document.getElementById('sdescricao').value='';
    document.getElementById('sdata-date').value='';
    document.getElementById('sdata-time').value='';
    document.getElementById('snota').value='';
    setLegCount('leg',2);
    document.getElementById('nova-submit-sure').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"></line><line x1="4" y1="7" x2="20" y2="7"></line><circle cx="4" cy="16" r="4"></circle><circle cx="20" cy="16" r="4"></circle></svg> Registrar surebet';
    document.getElementById('edit-banner').style.display='none';
  }

  function exportCSVSure(){
    if(!sure.length){ alert('Ainda não há surebets registradas.'); return; }
    var rows=[['Registrada em','Evento','Descrição','Termina em','Casas (odd)','Investido','Retorno garantido','Lucro','Status','Nota']];
    sure.slice().sort(function(a,b){return new Date(a.criada)-new Date(b.criada);}).forEach(function(op){
      var st=sureBadgeStatus(op);
      var status = st==='green'?'Ganho':st==='red'?'Perda':'Preso';
      var casasStr = op.pernas.map(function(p){return p.casa+' @'+Number(p.odd).toFixed(2);}).join(' | ');
      rows.push([U.fmtDataHora(op.criada), op.evento||'', op.descricao||'', op.dataFim?U.fmtDataHora(op.dataFim):'', casasStr, op.investimento.toFixed(2), (op.investimento+op.lucroMin).toFixed(2), op.lucroMin.toFixed(2), status, op.nota||'']);
    });
    SB.Relatorios.downloadCSV(rows,'surebets');
  }

  function exportPDFSure(){
    if(!sure.length){ alert('Ainda não há surebets registradas.'); return; }
    var st=statsSure();
    var lucroColor = st.lucroGar>=0 ? '#0a8a3f' : '#c62828';
    var roiColor = st.roi>=0 ? '#0a8a3f' : '#c62828';
    var summary=H.sumCard('Banca atual','R$ '+U.R2(st.banca))+H.sumCard('Lucro garantido',U.fmtMoney(st.lucroGar),lucroColor)+H.sumCard('Dinheiro preso','R$ '+U.R2(st.preso))+H.sumCard('ROI (resolvidas)',(st.roi>=0?'+':'')+st.roi.toFixed(2)+'%',roiColor);
    var headers=['Registrada em','Evento','Casas (odd)','Investido','Retorno garantido','Lucro','Status'];
    var rows=sure.slice().sort(function(a,b){return new Date(a.criada)-new Date(b.criada);}).map(function(op){
      var stt=sureBadgeStatus(op);
      var status=stt==='green'?'Ganho':stt==='red'?'Perda':'Preso';
      var statusColor=stt==='green'?'#0a8a3f':stt==='red'?'#c62828':'#b8860b';
      var casasStr=op.pernas.map(function(p){return p.casa+' @'+Number(p.odd).toFixed(2);}).join(', ');
      return [U.fmtDataHora(op.criada), op.evento||'—', casasStr, op.investimento.toFixed(2), (op.investimento+op.lucroMin).toFixed(2), op.lucroMin.toFixed(2), '<span style="color:'+statusColor+';font-weight:700;">'+status+'</span>'];
    });
    SB.Relatorios.printReport('Relatório de Surebets', summary, headers, rows);
  }

  return {
    sure: sure, snid: snid, editingSureId: editingSureId,
    legCounts: legCounts, legOverride: legOverride,
    saveSure: saveSure,
    sureBadgeStatus: sureBadgeStatus, setSureStatus: setSureStatus, delSure: delSure,
    statsSure: statsSure, renderSure: renderSure, sureCard: sureCard,
    setLegCount: setLegCount, legCardHtml: legCardHtml,
    onLegStakeManualEdit: onLegStakeManualEdit, resetLegOverride: resetLegOverride,
    renderLegsContainer: renderLegsContainer,
    captureLegValues: captureLegValues, restoreLegValues: restoreLegValues,
    addLeg: addLeg, removeLeg: removeLeg, onLegCasa: onLegCasa,
    calcSure: calcSure,
    registerSure: registerSure, editSure: editSure, resetSureForm: resetSureForm,
    exportCSVSure: exportCSVSure, exportPDFSure: exportPDFSure
  };
})();
