/* ============================================================
   rules.js — OYUN KURALLARI (ekran çizmez, sayfaya dokunmaz)
   state üretimi, kayıt ve yükleme, ekonomi, memnuniyet, yapay
   zekâ diplomasisi, sıra sonu (endTurn) ve savaş simülasyonu.
   Kural değiştirmek isteyen bir tek buraya bakar.
   ============================================================ */
function fresh(){return {phase:'setup',diff:'normal',region:null,pick:null};}
var S=fresh();
function gIds(){try{var a=JSON.parse(localStorage.getItem(IDX)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function gRead(id){try{var s=JSON.parse(localStorage.getItem(GK+id));if(s&&s.phase==='play')s.choices=(s.choices||[]).filter(function(k){return DEVN[k];});return s&&s.phase==='play'?s:null;}catch(e){return null;}}
function gList(){return gIds().map(function(id){var s=gRead(id);return s?{id:id,s:s}:null;}).filter(Boolean);}
function gDel(id){try{localStorage.removeItem(GK+id);localStorage.setItem(IDX,JSON.stringify(gIds().filter(function(x){return x!==id;})));}catch(e){}}
function migrate(){try{var j=localStorage.getItem(KEY);if(!j)return;var s=JSON.parse(j);localStorage.removeItem(KEY);if(s&&s.phase==='play'){s.id=s.id||('m'+Date.now().toString(36));localStorage.setItem(GK+s.id,JSON.stringify(s));var ids=gIds();if(ids.indexOf(s.id)<0)ids.push(s.id);localStorage.setItem(IDX,JSON.stringify(ids));}}catch(e){}}
migrate();
function save(){try{if(!S.id)return;if(S.phase==='play'){var c=Object.assign({},S);delete c.battle;delete c.adv;localStorage.setItem(GK+S.id,JSON.stringify(c));var ids=gIds();if(ids.indexOf(S.id)<0){ids.push(S.id);localStorage.setItem(IDX,JSON.stringify(ids));}}else gDel(S.id);}catch(e){}}
function fmt(n){return Math.round(n).toLocaleString('tr-TR');}
function esc(x){return String(x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function cname(s){return s.name||REGIONS[s.region].n;}
function rn(i){return S&&S.phase!=='setup'&&S.region===i?cname(S):REGIONS[i].n;}
function nfs(nm){return nm.length>14?11:(nm.length>10?13:15);}
function sg(n){return (n>=0?'+':'−')+fmt(Math.abs(n));}
function rnd(a,b){return a+Math.random()*(b-a);}
function shuffled(a){var out=a.slice();for(var i=out.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=out[i];out[i]=out[j];out[j]=t;}return out;}
function has(s,k){return s.build&&s.build[k]?s.build[k]:0;}
function neighbors(i){if(i===4)return [0,1,2,3,5,6,7,8];var r=Math.floor(i/3),c=i%3,n=[];if(r>0)n.push(i-3);if(r<2)n.push(i+3);if(c>0)n.push(i-1);if(c<2)n.push(i+1);if(n.indexOf(4)<0)n.push(4);return n;}
function level(s){return 1+Math.floor(s.turn/4);}
function annexed(s,i){return i!==s.region&&s.capOwner&&s.capOwner[i]===s.region;}
function realmNeighbors(s){
  var set={},out=[];
  for(var i=0;i<9;i++){
    if(i===s.region||annexed(s,i)){neighbors(i).forEach(function(n){if(n!==s.region&&!annexed(s,n)&&!set[n]){set[n]=1;out.push(n);}});}
  }
  return out;
}
function ownedForts(s){var c=0;for(var q=0;q<s.forts.length;q++)if(s.forts[q]===s.region)c++;return c;}
function annexCount(s){var c=0;for(var i=0;i<9;i++)if(annexed(s,i))c++;return c;}
function ctl(s,i){var o=s.capOwner[i];return o===undefined?i:o;}
function diploList(s){var seen={},out=[];realmNeighbors(s).forEach(function(v){var c=ctl(s,v);if(c!==s.region&&!seen[c]){seen[c]=1;out.push(c);}});return out;}
function wOf(i,k){var w=AIPERS[i].w[k];return w==null?0.2:w;}
function pickW(arr,wf){var tot=0,i;for(i=0;i<arr.length;i++)tot+=wf(arr[i]);var r=Math.random()*tot;for(i=0;i<arr.length;i++){r-=wf(arr[i]);if(r<=0)return arr[i];}return arr[arr.length-1];}
function aiAllyOf(s,x){var o=[];(s.aiAlly||[]).forEach(function(p){if(p[0]===x)o.push(p[1]);else if(p[1]===x)o.push(p[0]);});return o;}
function aiAllied(s,a,b){return aiSameGroup(s,a,b);}
function aiSameGroup(s,a,b){return aiGroup(s,a).indexOf(b)>=0;}
function aiAlive(s,x){return x!==s.region&&!annexed(s,x)&&s.capOwner[x]===x;}
function aiResolve(s,a,b,rep){
  s.hot=[a,b];
  function sup(x,foe){var v=s.strengths[x]+(s.sent[x]||0);aiGroup(s,x).forEach(function(c){if(c!==x&&c!==foe&&aiAlive(s,c))v+=0.5*s.strengths[c];});return v;}
  var ha=aiGroup(s,a).filter(function(c){return c!==a&&c!==b&&aiAlive(s,c);}),hb=aiGroup(s,b).filter(function(c){return c!==a&&c!==b&&aiAlive(s,c);});
  if(ha.length||hb.length)rep.push('İttifak savaşı: '+REGIONS[a].n+(ha.length?' ve müttefikleri ('+ha.map(function(c){return REGIONS[c].n;}).join(', ')+')':'')+', '+REGIONS[b].n+(hb.length?' ve müttefikleri ('+hb.map(function(c){return REGIONS[c].n;}).join(', ')+')':'')+' karşısında.');
  var sa=sup(a,b),sb=sup(b,a)*AIPERS[b].def,sent=(s.sent[a]||0)+(s.sent[b]||0);s.sent[a]=0;s.sent[b]=0;
  if(sent)rep.push('Gönderdiğin askerler müttefikinin savaşında çarpıştı.');
  if(sa*rnd(0.7,1.3)>sb*rnd(0.7,1.3)){
    var own=[],k,got=0;
    for(k=0;k<NF;k++){if(s.forts[b*NF+k]===b)own.push(k);}
    if(own.length){var kk=own[Math.floor(Math.random()*own.length)];s.forts[b*NF+kk]=a;rep.push(REGIONS[a].n+', '+REGIONS[b].n+' devletinin '+fortName(b,kk)+' kalesini aldı.');}
    for(k=0;k<NF;k++)if(s.forts[b*NF+k]===a)got++;
    s.strengths[a]=Math.round(s.strengths[a]*1.04);s.strengths[b]=Math.round(s.strengths[b]*0.93);
    if(got>=CAPREQ_P&&s.capOwner[b]===b){
      s.capOwner[b]=a;s.strengths[a]+=Math.round(s.strengths[b]*0.5);s.strengths[b]=0;
      var remaining=aiGroup(s,b).filter(function(c){return c!==b&&aiAlive(s,c);});
      s.aiAlly=(s.aiAlly||[]).filter(function(p){return p[0]!==b&&p[1]!==b;});
      if(remaining.length>1)for(var ri=1;ri<remaining.length;ri++)if(!aiSameGroup(s,remaining[0],remaining[ri]))s.aiAlly.push([remaining[0],remaining[ri]]);
      var lp=0;
      for(k=0;k<NF;k++){if(s.forts[b*NF+k]===s.region)lp++;s.forts[b*NF+k]=a;}
      if(lp){recomputeBuild(s);rep.push(REGIONS[a].n+' orduları '+REGIONS[b].n+' topraklarını ele geçirdi, senin '+lp+' kalen de onlara geçti.');}
      if(isAlly(s,b)){s.allies=s.allies.filter(function(x){return x!==b;});rep.push('Müttefikin '+REGIONS[b].n+' yıkıldı, ittifak kendiliğinden sona erdi.');}
      s.warWith[b]=false;s.tradeWith=(s.tradeWith||[]).filter(function(x){return x!==b;});if(s.pacts)delete s.pacts[b];
      rep.push(REGIONS[b].n+' devleti yıkıldı ve '+REGIONS[a].n+' devletine katıldı.');
    }
  }else{
    s.strengths[a]=Math.round(s.strengths[a]*0.92);
    rep.push(REGIONS[b].n+', '+REGIONS[a].n+' saldırısını püskürttü.');
  }
}
function aiPacted(s,a,b){return (s.aiPact||[]).some(function(p){return p.e>s.turn&&((p.a===a&&p.b===b)||(p.a===b&&p.b===a));});}
function aiGroup(s,n){var seen=[n],q=[n];while(q.length){var x=q.shift();aiAllyOf(s,x).forEach(function(y){if(seen.indexOf(y)<0&&aiAlive(s,y)){seen.push(y);q.push(y);}});}return seen;}
function aiWars(s,rep){
  var oldAlly=s.aiAlly||[],oldGroups=[],oldSeen={},oldAdj={};
  oldAlly.forEach(function(p){if(!p||p.length<2||p[0]===p[1]||p[0]<0||p[0]>=9||p[1]<0||p[1]>=9)return;(oldAdj[p[0]]=oldAdj[p[0]]||[]).push(p[1]);(oldAdj[p[1]]=oldAdj[p[1]]||[]).push(p[0]);});
  for(var oi=0;oi<9;oi++)if(oldAdj[oi]&&!oldSeen[oi]){var oq=[oi],og=[];oldSeen[oi]=1;while(oq.length){var ox=oq.shift();og.push(ox);(oldAdj[ox]||[]).forEach(function(oy){if(!oldSeen[oy]){oldSeen[oy]=1;oq.push(oy);}});}oldGroups.push(og);}
  s.aiAlly=[];oldGroups.forEach(function(g){var live=g.filter(function(x){return aiAlive(s,x);});for(var st=0;st<live.length;st+=3){var chunk=live.slice(st,st+3);for(var cj=1;cj<chunk.length;cj++)s.aiAlly.push([chunk[0],chunk[cj]]);}});
  s.aiDev=s.aiDev||{};s.sent=s.sent||{};s.aiPact=(s.aiPact||[]).filter(function(p){return p.e>s.turn;});
  var i,a,b,alive=[];s.hot=[];
  for(i=0;i<9;i++)if(aiAlive(s,i))alive.push(i);
  // gelişim: her devlet kendi karakterine göre yatırım yapar
  alive.forEach(function(x){var c=pickW(AIDEV,function(q){return wOf(x,q.k);}),pe=AIPERS[x],g=(c.g+(pe.mineArmy&&c.k==='maden'?0.015:0))*pe.sc;s.aiDev[x]=s.aiDev[x]||{};s.aiDev[x][c.k]=(s.aiDev[x][c.k]||0)+1;s.strengths[x]=Math.round(s.strengths[x]*(1+g));});
  if(alive.length&&Math.random()<0.6){var dx=alive[Math.floor(Math.random()*alive.length)],top=AIDEV.slice().sort(function(p,q){return (s.aiDev[dx][q.k]||0)-(s.aiDev[dx][p.k]||0);})[0];rep.push(REGIONS[dx].n+' '+top.n.toLowerCase()+' alanında gelişim yaptı.');}
  // Kuzey Krallığı hep en güçlünün yanında
  if(aiAlive(s,0)){var topS=-1;alive.forEach(function(x){if(x!==0&&(topS<0||s.strengths[x]>s.strengths[topS]))topS=x;});
    if(topS>=0&&aiGroup(s,0).length===1&&!aiSameGroup(s,0,topS)&&aiGroup(s,topS).length<3&&Math.random()<0.7){s.aiAlly.push([0,topS]);rep.push(REGIONS[0].n+', en güçlü devlet '+REGIONS[topS].n+' ile ittifak kurdu.');}}
  // diğerleri: ittifak isteği karakterine göre
  alive.forEach(function(x){
    if(x===0||Math.random()>Math.min(0.5,0.1*AIPERS[x].ally))return;
    if(aiGroup(s,x).length>=3)return;
    var cs=neighbors(x).filter(function(y){return y!==0&&aiAlive(s,y)&&!aiSameGroup(s,x,y)&&aiGroup(s,x).length+aiGroup(s,y).length<=3;});
    if(!cs.length)return;
    var y=pickW(cs,function(q){return AIPERS[q].ally;});
    if(aiGroup(s,x).length+aiGroup(s,y).length<=3&&Math.random()<Math.min(1,AIPERS[y].ally)){s.aiAlly.push([x,y]);rep.push(REGIONS[x].n+' ve '+REGIONS[y].n+' ittifak kurdu.');}
  });
  // ticaret anlaşmaları: ticareti sevenler daha çok yapar
  var tn=0;
  alive.forEach(function(x){
    if(tn>=2||Math.random()>Math.min(0.4,0.1*AIPERS[x].tr))return;
    var cs=neighbors(x).filter(function(y){return aiAlive(s,y);});if(!cs.length)return;
    var y=pickW(cs,function(q){return AIPERS[q].tr;});tn++;
    s.strengths[x]=Math.round(s.strengths[x]*1.01);s.strengths[y]=Math.round(s.strengths[y]*1.01);rep.push(REGIONS[x].n+' ve '+REGIONS[y].n+' ticaret anlaşması imzaladı.');
  });
  // saldırmazlık anlaşmaları ve asker yardımı: karaktere göre
  alive.forEach(function(x){
    if(Math.random()>Math.min(0.4,0.12*AIPERS[x].pact))return;
    var cs=neighbors(x).filter(function(y){return aiAlive(s,y)&&!aiPacted(s,x,y)&&!aiAllied(s,x,y);});if(!cs.length)return;
    var y=pickW(cs,function(q){return AIPERS[q].pact;});
    if(Math.random()<AIPERS[y].pact){s.aiPact.push({a:x,b:y,e:s.turn+4});rep.push(REGIONS[x].n+' ve '+REGIONS[y].n+' saldırmazlık anlaşması imzaladı.');}
  });
  if(s.aiAlly.length&&Math.random()<0.25){var ap=s.aiAlly[Math.floor(Math.random()*s.aiAlly.length)],fr=Math.random()<0.5?ap[0]:ap[1],to=fr===ap[0]?ap[1]:ap[0];
    if(aiAlive(s,fr)&&aiAlive(s,to)&&s.strengths[fr]>s.strengths[to]*1.2){var amt=Math.max(1,Math.round(s.strengths[fr]*0.04));s.strengths[fr]-=amt;s.strengths[to]+=amt;rep.push(REGIONS[fr].n+', müttefiki '+REGIONS[to].n+' devletine asker gönderdi.');}}
  // bekleyen savaş
  var pw=s.pendWar;s.pendWar=null;
  if(pw&&aiAlive(s,pw.a)&&aiAlive(s,pw.b)&&!aiSameGroup(s,pw.a,pw.b))aiResolve(s,pw.a,pw.b,rep);
  // savaşlar: savaşçı devletler çok, barışçıllar neredeyse hiç savaş açar
  var wars=0,order=shuffled(alive);
  order.forEach(function(x){
    if(wars>=3||!aiAlive(s,x)||Math.random()>Math.min(0.5,0.12*AIPERS[x].aggr))return;
    var es=neighbors(x).filter(function(y){return aiAlive(s,y)&&!aiSameGroup(s,x,y)&&!aiPacted(s,x,y);});if(!es.length)return;
    var y=pickW(es,function(q){return Math.max(0.4,Math.min(2.5,s.strengths[x]/Math.max(1,s.strengths[q])));});
    wars++;
    if(!s.pendWar&&(isAlly(s,x)||isAlly(s,y))){s.pendWar={a:x,b:y};s.hot=[x,y];rep.push(REGIONS[x].n+', '+REGIONS[y].n+' devletine savaş açtı! Müttefiklerinden biri savaşıyor: Siyaset sekmesinden ona asker gönderebilirsin.');return;}
    aiResolve(s,x,y,rep);
  });
}
function fortName(st,k){var n=st*NF+k;return FA[n%FA.length]+' '+FB[Math.floor(n/FA.length)%FB.length];}
function capName(st){return CAPN[st];}
function fname(tg){return tg.type==='cap'?esc(capName(tg.state))+' (başkent · '+esc(rn(tg.state))+')':esc(fortName(tg.state,tg.k))+' ('+esc(rn(tg.state))+')';}
function pickTarget(s,n,via){
  var c=[],p=s.region;
  for(var st=0;st<9;st++){
    if(!(st===p||annexed(s,st)))continue;
    if(neighbors(via===undefined?n:via).indexOf(st)<0)continue;
    var lost=0;
    for(var k=0;k<NF;k++){if(s.forts[st*NF+k]===p)c.push({type:'fort',state:st,k:k});else lost++;}
    if(lost>=CAPREQ&&s.capOwner[st]===p)c.push({type:'cap',state:st,k:0});
  }
  return c.length?c[Math.floor(Math.random()*c.length)]:null;
}
function distTo(s,st){var best=9,i;for(i=0;i<9;i++){if(i===s.region||annexed(s,i)){var d=(i===4||st===4)?1:Math.abs(Math.floor(i/3)-Math.floor(st/3))+Math.abs(i%3-st%3);if(i===st)d=0;if(d<best)best=d;}}return best;}
function expCost(s,own){var d=distTo(s,own);return d>1?20*(d-1):0;}
function canSiege(s,st,k){
  var own=k>=0?s.forts[st*NF+k]:s.capOwner[st];
  if(own===s.region)return 'Bu yer zaten senin.';
  if(s.soldiers<10)return 'En az 10 askerin olmalı.';
  if(k<0){var h=0;for(var q=0;q<NF;q++)if(s.forts[st*NF+q]===s.region)h++;if(h<CAPREQ_P)return 'Başkent için önce bu devletin en az '+CAPREQ_P+' kalesini almalısın.';}
  var ec=expCost(s,own);if(s.gold<ec)return 'Uzak sefer için '+ec+' altın gerekiyor.';
  return null;
}
function ownerOf(s,st,k){return k>=0?s.forts[st*NF+k]:s.capOwner[st];}
function garrison(s,st,k){return Math.round(s.strengths[ownerOf(s,st)]*(k>=0?0.4:0.8));}
function seqCost(s,chs){var d={},t0=0;chs.forEach(function(k){t0+=60+40*((s.dev[k]||0)+(d[k]||0));d[k]=(d[k]||0)+1;});return t0;}
function cntC(chs,k){var n=0;chs.forEach(function(x){if(x===k)n++;});return n;}
function devCost(s,k){return 60+40*(s.dev[k]||0);}
function newDev(){var d={};CATS.forEach(function(c){c.subs.forEach(function(u){d[u.k]=0;});});return d;}
function eff(s,dv){
  var d=dv||s.dev,e={inc:0,cinc:0,food:0,pow:0,def:0,grow:0,sat:0,gold:0,atk:0,admin:0,dip:0};
  CATS.forEach(function(c){c.subs.forEach(function(u){var l=d[u.k]||0;if(!l)return;for(var k in u.e)e[k]+=u.e[k]*l;});});
  return e;
}
function bCost(s,b,c){return Math.round(b.cost*(1+0.4*(c===undefined?has(s,b.k):c)));}
function isAlly(s,i){return s.allies.indexOf(i)>=0;}
function allyHelpChance(s,enemy){
  var helpers=(s.allies||[]).filter(function(i){return i!==enemy;});
  return helpers.length>=2?1:(DIFF[s.diff]&&DIFF[s.diff].help!=null?DIFF[s.diff].help:0.5);
}
function relLabel(s,i){var r=s.rel[i];if(isAlly(s,i))return 'Müttefik';if(r<=-30)return 'Düşman';if(r<=0)return 'Soğuk';if(r<30)return 'Tarafsız';return 'Dostane';}

function tradeP(s){return Math.round(calc(s).income/5);}
function snap(s){var r=s.res;return {pop:s.pop+s.soldiers,soldiers:s.soldiers,boats:r.boats,ships:r.ships,cattle:r.cattle,sheep:r.sheep,trade:tradeP(s),gold:s.gold,food:s.food,wood:r.wood,stone:r.stone,iron:r.iron,cloth:r.cloth};}
function bRes(s,b,c){var m=1+0.4*(c===undefined?has(s,b.k):c);return {wood:Math.round(b.cost/20*m),stone:Math.round(b.cost/25*m)};}
function startGame(region,diff,nm){
  var D=DIFF[diff],R=REGIONS[region];
  var sol=D.sol,pop=Math.round(D.pop*R.fert)-sol;
  var st=[],rel=[],fo=[],co=[];
  for(var i=0;i<9;i++){co.push(i);for(var q=0;q<NF;q++)fo.push(i);st.push(i===region?0:Math.round(D.str*REGIONS[i].str*rnd(0.85,1.15)));rel.push(Math.round(rnd(-15,20)));}
  S={phase:'play',id:'g'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),name:nm||REGIONS[region].n,diff:diff,region:region,turn:0,year:1,pop:pop,soldiers:sol,gold:D.gold,
     food:Math.round((pop+sol)*D.food),sat:D.sat,dev:newDev(),cat:'tarim',
     build:{},allies:[],rel:rel,tab:'yonet',wars:0,warWith:{},tradeWith:[],truce:{},dnote:'',pendingDef:null,
     tax:'normal',choices:[],res:{cattle:Math.round(pop*0.10),sheep:Math.round(pop*0.14),boats:region===4?0:3,ships:0,wood:30,stone:20,iron:12,cloth:8},prev:null,strengths:st,report:null,log:[],dead:null,forts:fo,capOwner:co,sel:null,sett:{},view:null,place:null,slot:null};
  S.prev=snap(S);
  save();render();
}

function calc(s,dev){
  var R=REGIONS[s.region],e=eff(s,dev),tm=TAX[s.tax].m,coast=R.coast,inland=s.region===4?0:1,nb=0,ex=(s.forts?ownedForts(s):NF)-NF;
  for(var k in s.build)nb+=s.build[k]||0;
  return {
    income:Math.round((1+0.015*ex)*s.pop*0.5*tm*(1+e.inc+coast*e.cinc+0.15*has(s,'pazar')+0.2*has(s,'liman')*inland+0.06*(s.tradeWith?s.tradeWith.length:0))*R.trade)+(s.res?Math.round(coast*(s.res.boats*3+s.res.ships*10)):0),
    salary:Math.round(s.soldiers*1.5),
    upkeep:25*nb+10*Math.max(0,ex),
    admin:Math.round((s.pop*0.05+25*level(s))*(1-Math.min(0.5,e.admin))),
    flat:Math.round(e.gold),
    prod:Math.round(s.pop*1.1*R.fert*(1+e.food+0.1*has(s,'ambar'))+(s.res?s.res.cattle*0.3+s.res.sheep*0.15:0)),
    cons:s.pop+s.soldiers
  };
}
function power(s){return s.soldiers*REGIONS[s.region].pow*(1+eff(s).pow)*(0.7+0.6*s.sat/100)*(1+0.15*has(s,'kisla'));}
function defPower(s){return power(s)*REGIONS[s.region].def*(1+eff(s).def+0.2*has(s,'sur'));}
function addLog(lines){
  if(!S.report)return;
  lines.forEach(function(t){S.report.lines.push(t);S.log.unshift('Yıl '+(S.year-3)+': '+t);});
  S.log=S.log.slice(0,40);
}
function recMax(s){var rc=has(s,'kisla')?15:20;return Math.max(0,Math.min(Math.floor(s.gold*10/rc),s.pop-100,Math.floor(s.res.iron*5),Math.floor(s.res.cloth*10)));}
function recCost(s){var rp=Math.min(s.recPlan||0,recMax(s));return rp>0?Math.ceil(rp*(has(s,'kisla')?15:20)/10):0;}
function projCost(s){return seqCost(s,s.choices||[])+recCost(s);}
function endTurn(){
  var s=S,rep=[],before={pop:s.pop+s.soldiers,gold:s.gold,food:s.food,sat:s.sat};s.prev=snap(s);
  var rp=Math.min(s.recPlan||0,recMax(s));s.recPlan=0;
  if(rp>0){var rc0=has(s,'kisla')?15:20;s.gold-=Math.ceil(rp*rc0/10);s.res.iron-=Math.ceil(rp/5);s.res.cloth-=Math.ceil(rp/10);s.soldiers+=rp;s.pop-=rp;rep.push(rp+' yeni asker orduya katıldı (nüfustan alındı).');}
  var cost=0;
  if(s.choices&&s.choices.length){s.choices.forEach(function(k){cost+=devCost(s,k);s.dev[k]++;rep.push(DEVN[k]+' çalışmaları tamamlandı.');});}
  else rep.push('Bu dönem gelişim yapılmadı.');
  var ev={food:1,gold:0,pop:1,sat:0};
  if(Math.random()<0.4){var e=EVENTS[Math.floor(Math.random()*EVENTS.length)];rep.push(e.t);ev.food=e.food||1;ev.gold=e.gold||0;ev.pop=e.pop||1;ev.sat=e.sat||0;}
  var c=calc(s),prod=Math.round(c.prod*ev.food),foodNet=prod-c.cons;
  s.food=Math.min(s.food+foodNet,Math.round(c.cons*2*(1+0.25*has(s,'ambar'))));
  var rs=s.res,dl=s.dev,pp=s.pop,gr=0.05+0.04*(dl.hayvan||0)+(foodNet>=0?0:-0.2);
  rs.cattle=Math.max(0,Math.round(Math.min(rs.cattle*(1+gr),pp*0.25)));
  rs.sheep=Math.max(0,Math.round(Math.min(rs.sheep*(1+gr+0.02),pp*0.30)));
  var RG=REGIONS[s.region],pw=Math.round(pp*0.02*RG.wood*(1+0.4*(dl.orman||0))),ps=Math.round(pp*0.012*RG.mine*(1+0.5*(dl.tas||0))),pi=Math.round(pp*0.006*RG.mine*(1+0.6*(dl.demir||0))),pc=Math.round(rs.sheep*0.05*(1+0.3*(dl.atolye||0)));
  rs.wood+=pw;rs.stone+=ps;rs.iron+=pi;rs.cloth+=pc;
  if(has(s,'liman')>0){rs.boats+=(dl.gemi||0);rs.ships+=Math.floor(((dl.tersane||0)+(dl.donanma||0))/2);}
  rep.push('Üretim: odun +'+fmt(pw)+', taş +'+fmt(ps)+', demir +'+fmt(pi)+', kumaş +'+fmt(pc)+'.');
  s.gold+=c.income-c.salary-c.upkeep-c.admin+c.flat-cost+ev.gold;
  var E=eff(s);var sat=s.sat+REGIONS[s.region].sat+TAX[s.tax].s+E.sat+3*has(s,'cami')+ev.sat-1+Math.round(rnd(-1,1));
  sat+=foodNet>=0?1:-6;
  if(s.pop>0&&s.soldiers/s.pop>0.15)sat-=2;
  s.sat=Math.max(0,Math.min(100,Math.round(sat)));
  var growth=0;
  if(foodNet>=0&&before.sat>=40)growth=0.04+E.grow+REGIONS[s.region].grow;else if(before.sat<25)growth=-0.03;
  s.pop=Math.round(s.pop*(1+growth)*ev.pop);
  // ilişkiler
  var myP=Math.max(power(s),8);
  diploList(s).forEach(function(n){
    var d=Math.round(rnd(-5,2)+E.dip);if(s.strengths[n]>myP*1.3)d-=3;
    s.rel[n]=Math.max(-100,Math.min(100,s.rel[n]+d));
  });
  s.tradeWith=(s.tradeWith||[]).filter(function(n){var ok=s.capOwner[n]===n&&!s.warWith[n]&&s.rel[n]>=0;if(!ok)rep.push(REGIONS[n].n+' ile ticaret anlaşması bozuldu.');return ok;});
  var nw=[];aiWars(s,nw);s.news=nw;nw.forEach(function(x){rep.push(x);});
  // dış tehdit
  var pend=null;
  if(s.turn>=2){
    var ns=shuffled(realmNeighbors(s).filter(function(v){var c=ctl(s,v);return !isAlly(s,c)&&(s.truce[c]||0)<=s.turn&&((s.pacts&&s.pacts[c])||0)<=s.turn;}));
    for(var i=0;i<ns.length;i++){
      var via=ns[i],n=ctl(s,via),r=s.rel[n],mult=s.warWith[n]?2.2:(r<=-30?1.8:(r>=30?0.4:1));
      var ch=Math.min(0.5,DIFF[s.diff].atk*REGIONS[n].aggr*(s.strengths[n]/myP)*mult*(1-Math.min(0.5,E.atk)));
      if(Math.random()<ch){var tg=pickTarget(s,n,via);if(tg){pend={n:n,type:tg.type,state:tg.state,k:tg.k};rep.push(REGIONS[n].n+' ordusu '+fname(tg)+' önüne dayandı.');break;}}
    }
  }
  var cause=null;
  if(s.sat<=0)cause='isyan';
  else if(s.sat<=2&&Math.random()<0.08)cause='kivilcim';
  else if(s.food<0)cause='kitlik';
  else if(s.gold<0)cause='iflas';
  s.turn++;s.year+=3;s.choices=[];s.wars=0;s.gifted=false;s.dnote='';
  for(var j=0;j<9;j++)if(j!==s.region)s.strengths[j]=Math.round(s.strengths[j]*(1.05+Math.random()*0.04));
  var delta={pop:s.pop+s.soldiers-before.pop,gold:s.gold-before.gold,food:s.food-before.food,sat:s.sat-before.sat};
  s.report={y1:s.year-3,y2:s.year-1,lines:[],delta:delta};
  addLog(rep);
  s.pendingDef=cause?null:pend;
  if(cause){s.phase='dead';s.dead=cause;}
  save();
  if(!cause&&pend!==null)startBattle('def',pend.n,pend);else render();
}
function deathText(d){return d.indexOf('isgal:')===0?d.slice(6)+' orduları başkente girdi. Devlet ele geçirildi.':DEATH[d];}

/* ---------- Savaş ---------- */
function startBattle(mode,enemy,target){
  if(timer){clearInterval(timer);timer=null;}
  var s=S,b={mode:mode,enemy:enemy,target:target,phase:'place',pool:0,uid:0,units:[],tick:0,sel:null,result:null,note:''};
  var sd=1+eff(s).pow;
  b.mult=sd*REGIONS[s.region].pow*(0.7+0.6*s.sat/100)*(1+0.15*has(s,'kisla'))*(mode==='def'?REGIONS[s.region].def*(1+eff(s).def+0.2*has(s,'sur')):1);
  var e=rnd(-8,8),ec={S:Math.round(25+e),P:50,O:Math.round(25-e)};
  b.ecomp=ec;
  S.battle=b;
  if(mode==='def')s.warWith[enemy]=true;
  buildUnits(b);
  var anyP=b.units.some(function(u){return u.side==='p'&&u.n>0;});
  if(!anyP){b.phase='done';b.result='lose';}
  render();
}
function allocate(total,weights){
  var sum=weights.S+weights.P+weights.O,w=weights;
  if(sum<=0){w={S:1,P:1,O:1};sum=3;}
  var out={},fractions=[],used=0;
  ['S','P','O'].forEach(function(t){var raw=total*w[t]/sum;out[t]=Math.floor(raw);used+=out[t];fractions.push({t:t,f:raw-out[t]});});
  fractions.sort(function(a,b){return b.f-a.f;});
  for(var q=0;q<total-used;q++)out[fractions[q%fractions.length].t]++;
  return out;
}
function ownUnits(b){return b.units.filter(function(u){return u.side==='p'&&!u.ally&&!u.merc;});}
function deployed(b){return ownUnits(b).reduce(function(a,u){return a+u.n;},0);}
function freeCell(b,x,y,lim,list){
  var occ={},r,dx,dy,nx,ny;
  (list||b.units).forEach(function(u){if(u.n>0)occ[u.x+','+u.y]=1;});
  for(r=0;r<=BW;r++)for(dy=-r;dy<=r;dy++)for(dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    nx=x+dx;ny=y+dy;
    if(nx<0||ny<0||nx>lim||ny>=BH||occ[nx+','+ny])continue;
    return [nx,ny];
  }
  return null;
}
function addUnit(b,t){
  if(ownUnits(b).length>=MAXU)return 'En fazla '+MAXU+' birliğin olabilir.';
  var give=Math.min(10,Math.floor(b.pool||0));
  if(give)b.pool-=give;
  else{
    var big=ownUnits(b).filter(function(u){return u.t===t&&u.n>10;}).sort(function(p,q){return q.n-p.n;})[0];
    if(big){big.n-=10;big.max=Math.max(10,big.n);give=10;}
  }
  if(!give)return 'Yeni birliğe asker yok: önce yedeğe asker ayır ya da en az 11 askeri olan bir '+TY[t].n.toLowerCase()+' birliğini böl.';
  var cell=freeCell(b,SLOT[t][0],SLOT[t][1],PZ-1);
  if(!cell){b.pool=(b.pool||0)+give;return 'Mavi bölgede boş kare kalmadı.';}
  b.uid=(b.uid||0)+1;
  b.units.push({id:'p'+b.uid,side:'p',t:t,n:give,max:give,x:cell[0],y:cell[1],tx:null,ty:null,o:'hold'});
  return null;
}
function delUnit(b,id){
  var u=b.units.filter(function(x){return x.id===id;})[0];
  if(!u||u.side!=='p'||u.ally||u.merc)return;
  b.pool=(b.pool||0)+u.n;
  b.units=b.units.filter(function(x){return x!==u;});
  if(b.sel===id)b.sel=null;
}
function setUnitN(b,id,n){
  var u=b.units.filter(function(x){return x.id===id;})[0];
  if(!u||u.side!=='p'||u.ally||u.merc)return u?u.n:0;
  var pool=Math.floor(b.pool||0);
  n=Math.max(1,Math.min(Math.floor(n)||1,u.n+pool));
  b.pool=pool+(u.n-n);
  u.n=n;u.max=Math.max(u.max,n);
  return n;
}
function bumpUnit(b,id,d){
  var u=b.units.filter(function(x){return x.id===id;})[0];
  if(!u||u.side!=='p'||u.ally||u.merc)return;
  if(d>0){var take=Math.min(d,Math.floor(b.pool||0));if(!take)return;u.n+=take;b.pool-=take;}
  else{var give=Math.min(-d,u.n-1);if(give<=0)return;u.n-=give;b.pool=(b.pool||0)+give;}
  u.max=Math.max(u.max,u.n);
}
function distPool(b){
  var pool=Math.floor(b.pool||0),us=ownUnits(b);
  if(pool<=0||!us.length){b.pool=0;return;}
  var tot=us.reduce(function(a,u){return a+u.n;},0),left=pool;
  us.forEach(function(u,i){
    var give=i===us.length-1?left:Math.round(pool*(tot?u.n/tot:1/us.length));
    give=Math.max(0,Math.min(give,left));
    u.n+=give;u.max=Math.max(u.max,u.n);left-=give;
  });
  b.pool=left;
}
function makeAllyUnit(b,al,list){
  var arr=list||b.units;
  if(arr.some(function(u){return u.ally&&u.al===al;}))return null;
  var n=Math.round(S.strengths[al]*0.25);if(n<=0)return null;
  var cell=freeCell(b,2,3,PZ-1,arr)||[2,3];
  return {id:'a'+al,side:'p',t:'P',n:n,max:n,x:cell[0],y:cell[1],tx:null,ty:null,ally:1,al:al,o:'adv'};
}
function buildUnits(b){
  var s=S,us=[],id=0;
  var pos={P:[[4,2],[4,5]],S:[[3,0],[3,7]],O:[[1,2],[1,5]]};
  var allocated=allocate(s.soldiers,DCOMP);
  ['S','P','O'].forEach(function(t){
    var n=allocated[t];if(n<=0)return;
    us.push({id:'p'+(++id),side:'p',t:t,n:n,max:n,x:SLOT[t][0],y:SLOT[t][1],tx:null,ty:null,o:'hold'});
  });
  b.uid=id;b.pool=0;
  if(s.merc&&s.merc.n>0){var mpos={S:[0,1],P:[0,3],O:[0,6]},mercAllocated=allocate(s.merc.n,DCOMP);
    ['S','P','O'].forEach(function(t){var n=mercAllocated[t];if(n>0)us.push({id:'m'+t,side:'p',t:t,n:n,max:n,x:mpos[t][0],y:mpos[t][1],tx:null,ty:null,merc:1,o:'adv'});});}
  s.allies.forEach(function(al){
    if(b.mode!=='def'&&(b.helpers||[]).indexOf(al)<0)return;
    var au=makeAllyUnit(b,al,us);if(au)us.push(au);
  });
  var cp=b.target&&b.target.type==='cap',tot=Math.round(s.strengths[b.enemy]*(cp?(b.mode==='def'?0.9:0.8):(b.mode==='def'?0.6:0.4))*rnd(0.9,1.1));
  b.eAllies=aiGroup(s,b.enemy).filter(function(c){return c!==b.enemy&&aiAlive(s,c)&&!isAlly(s,c);});
  b.eAllies.forEach(function(c){tot+=Math.round(s.strengths[c]*0.15);});
  var enemyAllocated=allocate(tot,b.ecomp);
  ['S','P','O'].forEach(function(t){
    var n=enemyAllocated[t],a=Math.ceil(n/2),c=n-a;
    [a,c].forEach(function(v,i){if(v>0)us.push({id:'e'+(++id),side:'e',t:t,n:v,max:v,x:BW-1-pos[t][i][0],y:pos[t][i][1],tx:null,ty:null,o:'adv'});});
  });
  b.units=us;b.sel=null;
}
function sumN(b,side){return b.units.reduce(function(a,u){return u.side===side&&u.n>0?a+u.n:a;},0);}
function battleSummary(b){var own=0,ally=0,merc=0;b.units.forEach(function(u){if(u.side!=='p'||u.n<=0)return;if(u.ally)ally+=u.n;else if(u.merc)merc+=u.n;else own+=u.n;});own=Math.round(own);ally=Math.round(ally);merc=Math.round(merc);var res=Math.max(0,Math.floor(b.pool||0));return 'Senin askerlerin '+fmt(own)+(res?' · Yedek '+fmt(res):'')+' · Müttefik '+fmt(ally)+' · Paralı asker '+fmt(merc)+' · Dost toplamı '+fmt(own+ally+merc);}
function match(a,d){if(a==='S'&&d==='O')return 1.5;if(a==='P'&&d==='S')return 1.5;if(a==='O'&&d==='P')return 1.3;return 1;}
function cheb(a,b){return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));}
function stepTo(u,tx,ty,occ){
  var dx=Math.sign(tx-u.x),dy=Math.sign(ty-u.y),c=[[dx,dy],[dx,0],[0,dy]];
  for(var i=0;i<c.length;i++){
    var nx=u.x+c[i][0],ny=u.y+c[i][1];
    if((c[i][0]===0&&c[i][1]===0)||nx<0||ny<0||nx>=BW||ny>=BH||occ[nx+','+ny])continue;
    delete occ[u.x+','+u.y];u.x=nx;u.y=ny;occ[nx+','+ny]=1;return true;
  }
  return false;
}
function centroid(list){var x=0,y=0;list.forEach(function(u){x+=u.x;y+=u.y;});return list.length?{x:x/list.length,y:y/list.length}:null;}
function tick(){
  var b=S.battle;if(!b||b.phase!=='run'){if(timer){clearInterval(timer);timer=null;}return;}
  b.tick++;
  var live=b.units.filter(function(u){return u.n>0;});
  var occ={};live.forEach(function(u){occ[u.x+','+u.y]=1;});
  var cen={p:centroid(live.filter(function(u){return u.side==='p';})),e:centroid(live.filter(function(u){return u.side==='e';}))};
  var order=shuffled(live);
  order.forEach(function(u){
    if(u.n<=0)return;
    var foes=b.units.filter(function(f){return f.n>0&&f.side!==u.side;});
    if(!foes.length)return;
    var tgt=foes[0];foes.forEach(function(f){if(cheb(u,f)<cheb(u,tgt))tgt=f;});
    var ordered=u.tx!==null&&(u.x!==u.tx||u.y!==u.ty);
    if(u.tx!==null&&!ordered){u.tx=null;u.ty=null;}
    if(!ordered&&cheb(u,tgt)<=TY[u.t].rng){
      var m=(u.side==='p'?b.mult:1)*TY[u.t].atk*match(u.t,tgt.t)*rnd(0.85,1.15);
      tgt.n-=u.n*0.09*m;if(tgt.n<0.5)tgt.n=0;
      return;
    }
    if(ordered){
      for(var i=0;i<TY[u.t].spd&&(u.x!==u.tx||u.y!==u.ty);i++)if(!stepTo(u,u.tx,u.ty,occ))break;
      return;
    }
    if(u.o==='hold'){
      var th=null;foes.forEach(function(f){if(cheb(u,f)<=TY[f.t].rng&&(!th||cheb(u,f)<cheb(u,th)))th=f;});
      if(!th)return;
      for(var h=0;h<TY[u.t].spd&&cheb(u,th)>TY[u.t].rng;h++)if(!stepTo(u,th.x,th.y,occ))break;
      return;
    }
    // "İlerle": dizilişi koru, grubunun merkezinden SPREAD kareden fazla kopan birlik düşmanı kovalamaz, geri toplanır. "Hücum": serbest koşu.
    var c=cen[u.side],gx=tgt.x,gy=tgt.y,stop=TY[u.t].rng;
    if(u.o!=='chg'&&c&&cheb(u,{x:Math.round(c.x),y:Math.round(c.y)})>SPREAD){gx=Math.round(c.x);gy=Math.round(c.y);stop=1;}
    for(var k=0;k<TY[u.t].spd&&cheb(u,{x:gx,y:gy})>stop;k++)if(!stepTo(u,gx,gy,occ))break;
  });
  var p=sumN(b,'p'),e=sumN(b,'e'),res=null;
  if(e<=0)res='win';else if(p<=0)res='lose';else if(b.tick>=140)res=p>=e?'win':'lose';
  if(res){b.phase='done';b.result=res;clearInterval(timer);timer=null;render();}
  else{renderBattleMap();var el=document.getElementById('bstat');if(el)el.textContent=battleSummary(b)+' · Düşman '+fmt(e)+' · tur '+b.tick;}
}
function finishBattle(){
  var s=S,b=s.battle,n=b.enemy,name=REGIONS[n].n,lines=[],tg=b.target||{type:'fort',state:n,k:0},fn=fname(tg),win=b.result==='win',k,q;
  if(timer){clearInterval(timer);timer=null;}
  var rem=Math.round(b.units.filter(function(u){return u.side==='p'&&!u.ally&&!u.merc&&u.n>0;}).reduce(function(a,u){return a+u.n;},0));
  var reserve=Math.max(0,Math.floor(b.pool||0));
  var lost=(s.soldiers-reserve)-rem;
  s.soldiers=rem+reserve;
  if(s.merc){var mrem=Math.round(b.units.filter(function(u){return u.merc&&u.n>0;}).reduce(function(a,u){return a+u.n;},0));
    s.merc.b--;s.merc.n=mrem;
    if(s.merc.n<=0){lines.push('Paralı askerlerin hepsi savaşta öldü.');s.merc=null;}
    else if(s.merc.b<=0){lines.push('Paralı askerlerin sözleşmesi bitti, '+fmt(s.merc.n)+' paralı asker ayrıldı.');s.merc=null;}
    else lines.push('Paralı askerlerden '+fmt(s.merc.n)+' kaldı, '+s.merc.b+' savaş hakkı kaldı.');}
  if(b.mode==='def'){
    s.pendingDef=null;
    if(win){
      s.strengths[n]=Math.round(s.strengths[n]*0.85);
      lines.push(name+' saldırısı '+fn+' önünde püskürtüldü. '+fmt(lost)+' asker kaybedildi.');
    }else if(tg.type==='fort'){
      s.forts[tg.state*NF+tg.k]=n;s.pop=Math.round(s.pop*0.96);
      lines.push(fn+' '+name+' eline geçti. '+fmt(lost)+' asker kaybedildi.');
    }else if(tg.state===s.region){
      s.phase='dead';s.dead='isgal:'+name;lines.push(name+' başkenti aldı.');
    }else{
      s.capOwner[tg.state]=n;
      var lf=0;for(k=0;k<NF;k++){if(s.forts[tg.state*NF+k]===s.region){s.forts[tg.state*NF+k]=n;lf++;}}
      lines.push(fn+' '+name+' eline geçti.'+(lf?' O topraklardaki '+lf+' kalen de elinden çıktı.':''));
    }
  }else{
    s.rel[n]=Math.max(-100,s.rel[n]-25);
    if(s.pacts&&s.pacts[n]>s.turn){delete s.pacts[n];s.rel[n]=Math.max(-100,s.rel[n]-30);lines.push(REGIONS[n].n+' ile saldırmazlık anlaşmasını bozdun, ilişkiniz çok kötüleşti.');}
    aiAllyOf(s,n).forEach(function(c){s.rel[c]=Math.max(-100,s.rel[c]-10);if(isAlly(s,c)){s.allies=s.allies.filter(function(x){return x!==c;});lines.push(REGIONS[c].n+', müttefikine saldırdığın için ittifakı bozdu.');}});
    if(!win)lines.push(fn+' seferi başarısız oldu. '+fmt(lost)+' asker kaybedildi.');
    else{
      var got=[],draws=2,pr=tg.type==='cap'?0.8:0.5,lk=tg.type==='fort'?sKey('fort',tg.state,tg.k):sKey('cap',tg.state,0),ls=getSlots(s,lk);
      for(q=0;q<draws;q++){if(Math.random()<pr){var bb=BUILDS[Math.floor(Math.random()*BUILDS.length)],fi=ls.indexOf(null);if(fi>=0&&!(bb.k==='liman'&&!portOK(lk))){ls[fi]=bb.k;got.push(bb.n);}}}
      var gtxt=got.length?' İçindeki binalar sana geçti: '+got.join(', ')+'.':'';
      if(tg.type==='fort'){
        s.forts[tg.state*NF+tg.k]=s.region;s.pop+=15;
        var loot=Math.round(s.strengths[n]*0.9);s.gold+=loot;s.strengths[n]=Math.round(s.strengths[n]*0.9);
        lines.push(fn+' alındı. '+fmt(loot)+' altın ganimet.'+gtxt+' '+fmt(lost)+' asker kaybedildi.');
      }else{
        for(k=0;k<NF;k++)s.forts[tg.state*NF+k]=s.region;
        s.capOwner[tg.state]=s.region;
        var loot2=Math.round(s.strengths[n]*3)+120;s.gold+=loot2;s.pop+=150;
        s.strengths[n]=tg.state===n?0:Math.round(s.strengths[n]*0.7);
        lines.push(fn+' düştü. '+REGIONS[tg.state].n+' artık sana bağlı! '+fmt(loot2)+' altın ganimet.'+gtxt+' '+fmt(lost)+' asker kaybedildi.');
      }
    }
  }
  if(b.helpers&&b.helpers.length){lines.push('Müttefik yardımı: '+b.helpers.map(function(a){return REGIONS[a].n;}).join(', ')+'.');if(win)b.helpers.forEach(function(a){s.rel[a]=Math.min(100,s.rel[a]+5);});}
  if(reserve>0)lines.push(fmt(reserve)+' asker yedekte bekledi, savaşa girmedi.');
  if(b.penalized)lines.push('Ardışık savaş halkı yordu: memnuniyet −10.');
  if(!s.report)s.report={y1:s.year-3,y2:s.year-1,lines:[],delta:{pop:0,gold:0,food:0,sat:0}};
  addLog(lines);
  recomputeBuild(s);
  if(s.view&&!sOwned(s,s.view))s.view=null;
  s.battle=null;
  save();render();
}
/* ---------- Yerleşim içi ---------- */
function sKey(type,state,k){return type==='cap'?'c'+state:'f'+(state*NF+k);}
function sOwned(s,key){var n=+key.slice(1);return key.charAt(0)==='c'?s.capOwner[n]===s.region:s.forts[n]===s.region;}
function sCount(key){return 16;}
function getSlots(s,key){if(!s.sett[key])s.sett[key]=[];var a=s.sett[key];while(a.length<sCount(key))a.push(null);return a;}
function bIcon(k){return '<g class="bic">'+(ICON[k]||'')+'</g>';}
function coastal(st,k){var r=Math.floor(st/3),c=st%3,e=Math.floor(k/3);return (e===0&&r===0)||(e===1&&c===2)||(e===2&&r===2)||(e===3&&c===0);}
function portOK(key){if(!key||key.charAt(0)!=='f')return false;var n=+key.slice(1);return coastal(Math.floor(n/NF),n%NF);}
function recomputeBuild(s){var b={};for(var key in s.sett){if(!sOwned(s,key))continue;var ok=portOK(key);s.sett[key].forEach(function(x,ix){if(x==='liman'&&!ok){s.sett[key][ix]=null;s.gold+=250;x=null;}if(x)b[x]=(b[x]||0)+1;});}s.build=b;}
function sName(key){var n=+key.slice(1);if(key.charAt(0)==='c')return capName(n)+' · '+rn(n)+' başkenti';return fortName(Math.floor(n/NF),n%NF)+' · '+rn(Math.floor(n/NF));}
function bOf(k){return BUILDS.filter(function(q){return q.k===k;})[0];}
function canBuy(s,b){var rq=bRes(s,b);return !(b.k==='liman'&&!portOK(s.view))&&s.gold>=bCost(s,b)&&s.res.wood>=rq.wood&&s.res.stone>=rq.stone;}
