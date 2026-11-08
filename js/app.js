/* ============================================================
   app.js — OLAY DÜĞÜMÜ VE AÇILIŞ
   Tıklama, klavye ve input dinleyicileri, hepsinin ortak
   dağıtıcısı act(), otomatik dönem oynatma ve ilk çizim.
   Yeni düğme davranışı buraya bir koşul olarak eklenir;
   düğmenin kendisi ui.js, sonucu rules.js içinde durur.
   ============================================================ */
var advTimer=null,ADV_MS=30000,advRate=1;
function advMessages(s){
  var y=s.year,nb=0,m=[],ch=s.choices||[];
  for(var k in s.build)nb+=s.build[k]||0;
  m.push('Yıl '+y+' başladı. Divan toplandı.');
  m.push(ch.length?ch.map(function(k){return DEVN[k];}).join(', ')+' çalışmaları başladı.':'Bu dönem yeni bir gelişim başlatılmadı.');
  m.push('Çiftçiler tarlalara çıktı, ekinler ekildi.');
  m.push('Yıl '+(y+1)+' başladı. '+(s.tax==='yuksek'?'Vergi toplayıcıları halkı sıkıştırdı.':(s.tax==='dusuk'?'Hafif vergi halkı rahatlattı.':'Vergi toplayıcıları köyleri dolaştı.')));
  m.push('Askerlere maaş dağıtıldı ('+fmt(s.soldiers)+' asker).');
  m.push(nb>0?'Binaların bakımı yapıldı.':'Şehirde yeni yapı yok, ustalar bekledi.');
  m.push('Tüccarlar pazarlarda alışveriş yaptı.');
  m.push('Yıl '+(y+2)+' başladı. Hasat zamanı, ambarlar dolduruluyor.');
  m.push('Sınırlarda gözcüler nöbet tuttu.');
  m.push('Dönem sonu hesapları görülüyor...');
  return m;
}
function startAdvance(){
  if(S.adv||S.phase!=='play')return;
  advRate=1;
  S.adv={t0:Date.now(),msgs:advMessages(S),shown:0,tips:tipsFor(S)};
  render();
  advTimer=setInterval(updateAdv,250);
}
function updateAdv(){
  var a=S.adv;if(!a)return;
  var el=(Date.now()-a.t0)*advRate,frac=Math.min(1,el/ADV_MS);
  var bar=document.getElementById('adv-bar'),feed=document.getElementById('adv-feed'),yr=document.getElementById('adv-year');
  if(bar)bar.style.width=(frac*100)+'%';
  var want=Math.min(a.msgs.length,Math.floor(el/(ADV_MS/a.msgs.length))+1);
  while(a.shown<want&&feed){var li=document.createElement('li');li.textContent=a.msgs[a.shown];feed.appendChild(li);a.shown++;}
  if(yr)yr.textContent='Yıl '+(S.year+Math.min(2,Math.floor(frac*3)));
  if(frac>=1){clearInterval(advTimer);advTimer=null;advRate=1;S.adv=null;endTurn();}
}
function renderAdvance(){
  var a=S.adv,items=a.msgs.slice(0,a.shown).map(function(x){return '<li>'+x+'</li>';}).join('');
  return '<h2 id="adv-year">Yıl '+S.year+'</h2><p class="k">Üç yıl geçiyor. Bu sürede olanlar aşağıda yazıyor.</p><p class="note">Boşluk: hızlandır · Esc: atla</p><div class="bar" style="height:10px"><i id="adv-bar" style="width:0%"></i></div><ul class="feed" id="adv-feed">'+items+'</ul><div class="tip"><h3>💡 İpucu</h3>'+(S.adv.tips||[]).map(function(x){return '<p>'+esc(x)+'</p>';}).join('')+'</div>';
}
function act(t){
  var a=t.getAttribute('data-act'),k=t.getAttribute('data-k'),i=+t.getAttribute('data-i');
  var b=S.battle;
  if(S.adv&&!b)return;
  if(b){
    if(a==='bunit'){var id=t.getAttribute('data-id'),u=b.units.filter(function(x){return x.id===id;})[0];if(u&&u.side==='p'&&b.phase!=='done'){b.sel=b.sel===id?null:id;renderBattleMap();}return;}
    if(a==='bcell'){
      var x=+t.getAttribute('data-x'),y=+t.getAttribute('data-y'),su=b.units.filter(function(q){return q.id===b.sel;})[0];
      if(!su||su.n<=0)return;
      var taken=b.units.some(function(q){return q.n>0&&q.x===x&&q.y===y&&q!==su;});
      if(b.phase==='place'){if(x<PZ&&!taken){su.x=x;su.y=y;b.sel=null;renderBattleMap();}}
      else if(b.phase==='run'){su.tx=x;su.ty=y;b.sel=null;renderBattleMap();}
      return;
    }
    if(a==='badd'){if(b.phase==='place'&&TY[k]){b.note=addUnit(b,k)||'';render();}return;}
    if(a==='bdel'){if(b.phase==='place'){delUnit(b,t.getAttribute('data-id'));b.note='';render();}return;}
    if(a==='bplus'||a==='bminus'){if(b.phase==='place'){bumpUnit(b,t.getAttribute('data-id'),a==='bplus'?10:-10);b.note=(a==='bplus'&&!(b.pool>0))?'Yedekte asker kalmadı: başka bir birliği −10 ile azalt ya da birliği dağıt.':'';render();}return;}
    if(a==='bfill'){if(b.phase==='place'){distPool(b);b.note='';render();}return;}
    if(a==='bord'){
      if(b.phase!=='run'||!ORD.some(function(o){return o.k===k;}))return;
      var su2=b.units.filter(function(q){return q.id===b.sel;})[0];
      var list=(su2&&su2.side==='p'&&!su2.ally&&!su2.merc)?[su2]:ownUnits(b);
      list.forEach(function(q){q.o=k;q.tx=null;q.ty=null;});
      render();return;
    }
    if(a==='askally'){if(b.phase==='place'&&b.mode==='off'&&S.allies.indexOf(i)>=0&&i!==b.enemy){b.asked=b.asked||[];if(!b.asked.some(function(x){return x.al===i;})){var accepted=Math.random()<allyHelpChance(S,b.enemy);b.asked.push({al:i,ok:accepted});if(accepted){b.helpers=b.helpers||[];b.helpers.push(i);var au=makeAllyUnit(b,i);if(au)b.units.push(au);}render();}}return;}
    if(a==='bstart'){if(b.phase!=='place')return;if(b.mode==='off'){S.warWith[b.enemy]=true;S.tradeWith=(S.tradeWith||[]).filter(function(x){return x!==b.enemy;});if((S.wars||0)>=1){S.sat=Math.max(0,S.sat-10);b.penalized=true;}S.wars=(S.wars||0)+1;if(b.exp){S.gold=Math.max(0,S.gold-b.exp);b.exp=0;}if(b.breakAlly!=null){S.allies=S.allies.filter(function(x){return x!==b.breakAlly;});S.rel[b.breakAlly]=Math.max(-100,S.rel[b.breakAlly]-50);b.breakAlly=null;}}b.phase='run';b.sel=null;timer=setInterval(tick,450);render();return;}
    if(a==='bflee'){S.battle=null;render();return;}
    if(a==='bdone'){finishBattle();return;}
    return;
  }
  if(a==='fort'){S.sel={state:+t.getAttribute('data-s'),k:+k};render();return;}
  if(a==='selclear'){S.sel=null;render();return;}
  if(a==='siege'){var sl=S.sel;if(sl&&!canSiege(S,sl.state,sl.k)){var ow=ownerOf(S,sl.state,sl.k);startBattle('off',ow,{type:sl.k>=0?'fort':'cap',state:sl.state,k:Math.max(0,sl.k)});S.battle.exp=expCost(S,ow);S.battle.breakAlly=isAlly(S,ow)?ow:null;}return;}
  if(a==='region'){if(S.phase==='setup'){S.pick=i;render();}else if(S.phase==='play'&&(i===S.region||annexed(S,i))){S.view='c'+i;S.place=null;S.slot=null;S.sel=null;render();}return;}
  if(a==='diff'){setupDiff=k;render();return;}
  if(a==='start'){var nm0=(S.cname||'').trim().slice(0,24);startGame(S.pick,setupDiff,nm0);return;}
  if(a==='tab'){S.tab=k;S.dnote='';save();render();return;}
  if(a==='choice'){if(S.choices.length<3&&seqCost(S,S.choices.concat([k]))<=S.gold)S.choices.push(k);save();render();return;}
  if(a==='unchoice'){S.choices.splice(+t.getAttribute('data-i'),1);save();render();return;}
  if(a==='tax'){S.tax=k;save();render();return;}
  if(a==='mapOnly'){mapOnly=!mapOnly;render();return;}
  if(a==='allyMap'){amap=!amap;S.dnote='';render();return;}
  if(a==='amjoin'){
    if(!amap)return;
    var ms=(t.getAttribute('data-g')||'').split(',').map(Number).filter(function(m){return aiAlive(S,m);});
    if(!ms.length||joinWhy(S,ms))return;
    var cost=ms.length>1?80:60,key=ms.join('-'),add=ms.filter(function(m){return !isAlly(S,m);});
    S.joinTry=S.joinTry||{};S.joinTry[key]=S.turn;
    if(Math.random()<joinChance(S,ms)){S.gold-=cost;add.forEach(function(m){S.allies.push(m);S.rel[m]=Math.min(100,S.rel[m]+5);});S.dnote=add.map(function(m){return REGIONS[m].n;}).join(', ')+' ile ittifak kuruldu.';}
    else S.dnote=ms.map(function(m){return REGIONS[m].n;}).join(', ')+' teklifini reddetti. Altın harcanmadı.';
    save();render();return;}
  if(a==='popgift'){var gc2=Math.round(40+0.25*S.pop);if(!S.gifted&&S.gold>=gc2&&S.sat<100){S.gold-=gc2;S.sat=Math.min(100,S.sat+15);S.gifted=true;save();render();}return;}
  if(a==='sendtroops'){if(S.soldiers>=20&&S.pendWar&&isAlly(S,i)){S.soldiers-=10;S.sent=S.sent||{};S.sent[i]=(S.sent[i]||0)+10;S.rel[i]=Math.min(100,S.rel[i]+3);S.dnote=REGIONS[i].n+' için 10 asker gönderildi.';save();render();}return;}
  if(a==='mercToggle'){mercOpen=!mercOpen;render();return;}
  if(a==='hiremerc'){var mn2=Math.max(0,Math.min(500,Math.floor(S.mercN||0))),mb2=Math.max(1,Math.min(5,Math.floor(S.mercB||1))),mc2=Math.ceil(mn2/10)*20*mb2;
    if(mn2>0&&S.gold>=mc2){S.gold-=mc2;S.merc=S.merc?{n:S.merc.n+mn2,b:Math.max(S.merc.b,mb2)}:{n:mn2,b:mb2};S.mercN=0;S.mercB=1;mercOpen=false;save();render();}return;}
  if(a==='statsToggle'){statsOpen=!statsOpen;render();return;}
  if(a==='disband'){if(S.soldiers>=10){S.soldiers-=10;S.pop+=10;save();render();}return;}
  if(a==='introNew'){intro=false;delAsk=null;if(S.phase!=='setup')S=fresh();render();return;}
  if(a==='introCont'){var gid=t.getAttribute('data-id'),gs=gRead(gid);if(gs){S=gs;S.view=null;S.sel=null;intro=false;delAsk=null;if(S.pendingDef!=null&&S.pendingDef!==undefined)startBattle('def',S.pendingDef.n,S.pendingDef);else render();}return;}
  if(a==='introDel'){var did=t.getAttribute('data-id');if(delAsk===did){gDel(did);if(S.id===did)S=fresh();delAsk=null;}else delAsk=did;render();return;}
  if(a==='menu'){if(S.phase==='play')save();intro=true;delAsk=null;render();return;}
  if(a==='enter'){if(S.sel&&sOwned(S,sKey(S.sel.k>=0?'fort':'cap',S.sel.state,Math.max(0,S.sel.k)))){S.view=sKey(S.sel.k>=0?'fort':'cap',S.sel.state,Math.max(0,S.sel.k));S.place=null;S.slot=null;S.sel=null;render();}return;}
  if(a==='enterCap'){S.view='c'+S.region;S.place=null;S.slot=null;render();return;}
  if(a==='leave'){S.view=null;S.place=null;S.slot=null;save();render();return;}
  if(a==='pick'){S.place=(S.place===k)?null:k;S.slot=null;render();return;}
  if(a==='slot'){
    if(!S.view)return;
    var sl=getSlots(S,S.view);
    if(sl[i]){S.slot=(S.slot===i)?null:i;render();return;}
    var bd=S.place?bOf(S.place):null;
    if(bd&&canBuy(S,bd)){var rq=bRes(S,bd);S.gold-=bCost(S,bd);S.res.wood-=rq.wood;S.res.stone-=rq.stone;sl[i]=bd.k;recomputeBuild(S);S.slot=null;if(!canBuy(S,bd))S.place=null;save();}
    else S.slot=null;
    render();return;
  }
  if(a==='demo'){
    var sl2=S.view?getSlots(S,S.view):null,bx=sl2&&S.slot!=null?sl2[S.slot]:null;
    if(bx){var bd3=bOf(bx),pn=Math.round(bCost(S,bd3,has(S,bx)-1)*0.25);if(S.gold>=pn){S.gold-=pn;sl2[S.slot]=null;S.slot=null;recomputeBuild(S);save();render();}}
    return;
  }
  if(a==='cat'){S.cat=k;save();render();return;}
  if(a==='pact'){var pk=AIPERS[i].pact,pcr=S.rel[i];S.pacts=S.pacts||{};S.pactTry=S.pactTry||{};
    if(S.gold>=70&&pcr>=0&&!S.warWith[i]&&S.pactTry[i]!==S.turn&&!(S.pacts[i]>S.turn)){S.pactTry[i]=S.turn;
      if(Math.random()<Math.min(0.95,pk*(0.5+pcr/100))){S.gold-=70;S.pacts[i]=S.turn+4;S.dnote=REGIONS[i].n+' ile 4 dönemlik saldırmazlık anlaşması imzalandı.';}
      else S.dnote=REGIONS[i].n+' saldırmazlık teklifini reddetti. (Altın harcanmadı.)';}
    save();render();return;}
  if(a==='aid'){if(S.soldiers>=20){S.soldiers-=10;S.strengths[i]+=10;var gain=Math.round(8*AIPERS[i].mil);S.rel[i]=Math.min(100,S.rel[i]+gain);S.dnote=REGIONS[i].n+' için 10 asker gönderildi, ilişki +'+gain+'.';save();render();}return;}
  if(a==='gift'){if(S.gold>=40){S.gold-=40;S.rel[i]=Math.min(100,S.rel[i]+15);S.dnote=REGIONS[i].n+' hediyeyi kabul etti.';save();render();}return;}
  if(a==='peace'){if(S.gold>=50&&S.warWith[i]){S.gold-=50;if(Math.random()<0.7){S.warWith[i]=false;S.rel[i]=Math.max(S.rel[i],-10);S.truce[i]=S.turn+2;S.dnote=REGIONS[i].n+' barışı kabul etti.';}else S.dnote=REGIONS[i].n+' barış teklifini reddetti. 50 altın boşa gitti.';save();render();}return;}
  if(a==='trade'){if(S.gold>=80&&S.rel[i]>=10&&!S.warWith[i]&&S.tradeWith.indexOf(i)<0){S.gold-=80;S.tradeWith.push(i);S.dnote=REGIONS[i].n+' ile ticaret anlaşması imzalandı.';save();render();}return;}
  if(a==='end'){startAdvance();return;}
  if(a==='saveExit'){save();intro=true;delAsk=null;render();return;}
  if(a==='reset'){if(S.id)gDel(S.id);S=fresh();render();return;}
}
document.addEventListener('click',function(e){var t=e.target.closest('[data-act]');if(t)act(t);});
document.addEventListener('keydown',function(e){
  if(e.key!=='Enter'&&e.key!==' ')return;
  var t=e.target.closest&&e.target.closest('g[data-act]');
  if(t){e.preventDefault();act(t);}
});
document.addEventListener('change',function(e){
  if((e.target.id==='mercn'||e.target.id==='mercb')&&S.phase==='play'&&!S.battle){
    if(e.target.id==='mercn')S.mercN=Math.max(0,Math.min(500,Math.floor(+e.target.value||0)));else S.mercB=Math.max(1,Math.min(5,Math.floor(+e.target.value||1)));
    save();render();return;
  }
  if(e.target.id!=='solin'||S.phase!=='play'||S.battle)return;
  var n=Math.max(0,Math.floor(+e.target.value||0));
  S.recPlan=Math.min(recMax(S),n);
  save();render();
});
document.addEventListener('input',function(e){
  var id=e.target.id;
  if(id==='cname'){S.cname=e.target.value;return;}
  if(!S.battle||S.battle.phase!=='place'||!id||id.indexOf('un-')!==0)return;
  var b=S.battle,u=b.units.filter(function(x){return x.id===id.slice(3);})[0];
  if(!u)return;
  var raw=e.target.value;
  if(raw===''||isNaN(+raw))return;
  var want=Math.max(1,Math.floor(+raw)),n=setUnitN(b,u.id,want);
  if(want!==n)e.target.value=n;
  var bp=document.getElementById('bpool');
  if(bp)bp.textContent=poolText(b);
  renderBattleMap();
});
if(S.phase==='play'&&S.pendingDef!=null&&S.pendingDef!==undefined){startBattle('def',S.pendingDef.n,S.pendingDef);}else render();
