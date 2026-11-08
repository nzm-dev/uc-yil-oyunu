/* ============================================================
   ui.js — SAĞ PANEL VE EKRAN METİNLERİ
   Yönetim / Siyaset / İttifak / Savaş / Durum panellerinin ve
   giriş ekranının HTML üretim fonksiyonları (renderXxx).
   Ekranda yeni bir satır ya da buton göstermek buraya eklenir.
   ============================================================ */
function renderSel(s){
  if(!s.sel)return '';
  var st=s.sel.state,k=s.sel.k,own=ownerOf(s,st,k),mine=own===s.region;
  var nm=k>=0?esc(fortName(st,k))+' · '+esc(rn(st)):esc(capName(st))+' · '+esc(rn(st))+' başkenti';
  var h='<div class="nb" style="border:1px solid var(--line);border-radius:6px;padding:12px"><div class="nbh"><b>'+nm+'</b><span class="pill '+(mine?'good':'bad')+'">'+(mine?'Senin':REGIONS[own].n)+'</span></div>';
  if(mine)h+='<p class="k" style="font-size:.88rem">Bu yer senin. İçine girip bina yerleştirebilirsin.</p><button class="primary" data-act="enter">İçine gir</button>';
  else{
    var why=canSiege(s,st,k),gar=garrison(s,st,k);
    h+='<p class="k" style="font-size:.88rem">Tahmini garnizon '+fmt(gar)+' asker.'+(expCost(s,own)?' Uzak sefer masrafı '+expCost(s,own)+' altın.':'')+(isAlly(s,own)?' Müttefikine saldırırsan ittifak bozulur.':'')+((s.wars||0)>=1?' Bu dönemin '+((s.wars||0)+1)+'. savaşı: halk memnuniyeti −10.':'')+(why?' '+why:'')+'</p><button class="primary" data-act="siege" '+(why?'disabled':'')+'>Kuşat ve saldır</button>';
  }
  return h+'<button data-act="selclear" style="align-self:flex-start;font-size:.82rem;color:var(--muted)">Kapat</button></div>';
}
function renderInteriorPanel(){
  var s=S,key=s.view,sl=getSlots(s,key),used=sl.filter(function(x){return x;}).length;
  var h='<button data-act="leave" style="align-self:flex-start">← Haritaya dön</button><div><h2>'+esc(sName(key))+'</h2><p class="k" style="font-size:.9rem">'+used+'/'+sl.length+' alan dolu. Bir bina seç, sonra boş bir alana tıkla.</p></div><div class="devs">';
  BUILDS.forEach(function(b){
    if(b.k==='liman'&&!portOK(key))return;
    var rq=bRes(s,b);
    h+='<button data-act="pick" data-k="'+b.k+'" aria-pressed="'+(s.place===b.k)+'" '+(canBuy(s,b)?'':'disabled')+'><span class="dn"><svg width="26" height="26" viewBox="0 0 40 40" style="vertical-align:-6px;margin-right:6px;display:inline-block">'+bIcon(b.k)+'</svg>'+b.n+'</span><span class="dd">'+b.d+'</span><span class="dc">'+fmt(bCost(s,b))+' altın, '+rq.wood+' odun, '+rq.stone+' taş</span></button>';
  });
  h+='</div>';
  if(s.slot!=null&&sl[s.slot]){
    var bb=bOf(sl[s.slot]),pn=Math.round(bCost(s,bb,has(s,bb.k)-1)*0.25);
    h+='<div class="nb" style="border:1px solid var(--line);border-radius:6px;padding:12px"><div class="nbh"><b>'+bb.n+'</b></div><p class="k" style="font-size:.88rem">'+bb.d+'</p><button data-act="demo" '+(s.gold<pn?'disabled':'')+'>Yık · −'+fmt(pn)+' altın</button></div>';
  }
  return h+'<p class="k" style="font-size:.88rem">Bütçe: '+fmt(s.gold)+' altın · '+fmt(s.res.wood)+' odun · '+fmt(s.res.stone)+' taş. Her bina dönem başına 25 altın bakım ister.</p>';
}
function renderAllyPanel(){
  var s=S,gr=allyGroups(s),h='<div><h3>İttifak haritası</h3>'+(s.dnote?'<p class="note" style="color:var(--ink);margin-bottom:8px">'+esc(s.dnote)+'</p>':'')+'<p class="k" style="font-size:.88rem">Harf aynı olan devletler aynı ittifakta. ★ senin ittifakın. İttifakta en fazla 3 üye olur. Yeri olan bir ittifaka aşağıdan katılabilirsin; kabul şansı devletlerin karakterine ve ilişkine bağlı. Reddederse altın harcanmaz ama aynı ittifaka bu dönem bir daha deneyemezsin.</p>';
  var mine=[s.region].concat(s.allies);
  h+='<div class="nb"><div class="nbh"><b>★ Senin ittifakın</b><span class="pill good">'+mine.length+'/3</span></div><p class="k" style="font-size:.88rem">'+mine.map(function(m){return esc(m===s.region?cname(s):REGIONS[m].n)+' ('+fmt(m===s.region?s.soldiers:s.strengths[m])+')';}).join(', ')+' · toplam '+fmt(mine.reduce(function(a,m){return a+(m===s.region?s.soldiers:s.strengths[m]);},0))+' asker'+(mine.length<3?' · '+(3-mine.length)+' boş yer':' · dolu')+'</p></div>';
  var n=0;
  gr.forEach(function(m){
    var multi=m.length>1,l=multi?String.fromCharCode(65+n++):'—',tot=m.reduce(function(a,x){return a+s.strengths[x];},0),why=joinWhy(s,m),ch=Math.round(joinChance(s,m)*100),cost=m.length>1?80:60;
    h+='<div class="nb"><div class="nbh"><b>'+(multi?l+' ittifakı':'İttifaksız: '+esc(REGIONS[m[0]].n))+'</b><span class="pill">'+(multi?m.length+'/3':'tek')+'</span></div>'+
      '<p class="k" style="font-size:.88rem">'+m.map(function(x){return esc(REGIONS[x].n)+' ('+fmt(s.strengths[x])+')';}).join(', ')+' · toplam '+fmt(tot)+' asker</p>'+
      '<div class="seg"><button data-act="amjoin" data-g="'+m.join(',')+'" '+(why?'disabled':'')+'>'+(multi?'İttifaka katıl':'İttifak kur')+' · '+cost+' · %'+ch+'</button></div>'+(why?'<p class="k" style="font-size:.82rem">'+esc(why)+'</p>':'')+'</div>';
  });
  if(!gr.length)h+='<p class="k">Başka devlet kalmadı.</p>';
  return h+'</div>';
}
function renderStatus(){
  var el=document.getElementById('status');
  var mb=(S.battle||S.adv)?'':'<button data-act="menu" class="menu">☰ Menü</button>';
  if(S.phase==='setup'){el.innerHTML=mb;return;}
  el.innerHTML='<span><b>'+esc(cname(S))+'</b></span><span>Yıl <b>'+S.year+'</b> · Dönem <b>'+(S.turn+1)+'</b></span>'+mb;
}

function renderSetup(){
  var h='<h2>Bölgeni seç</h2><p class="k">Haritada bir bölgeye tıkla. Diğer sekiz bölge komşu devletlerdir.</p>';
  h+='<div><h3>Zorluk</h3><div class="seg">';
  Object.keys(DIFF).forEach(function(k){h+='<button data-act="diff" data-k="'+k+'" aria-pressed="'+(setupDiff===k)+'">'+DIFF[k].n+'</button>';});
  h+='</div><p class="k" style="margin-top:6px;font-size:.88rem">'+DIFF[setupDiff].t+'</p></div>';
  if(S.pick!==null){
    var R=REGIONS[S.pick],D=DIFF[setupDiff];
    h+='<div><h3>Seçilen bölge</h3><h2>'+R.n+'</h2><p style="margin:4px 0 10px">'+R.t+'</p>'+
      '<div class="traits"><span>Verimlilik</span><span>×'+R.fert.toFixed(2).replace('.',',')+'</span><span>Ticaret</span><span>×'+R.trade.toFixed(2).replace('.',',')+'</span><span>Savunma</span><span>×'+R.def.toFixed(2).replace('.',',')+'</span>'+
      '<span>Artı</span><span>'+R.pro+'</span><span>Eksi</span><span>'+R.con+'</span><span>Başlangıç</span><span>'+fmt(D.pop*R.fert)+' kişi · '+fmt(D.sol)+' asker · '+fmt(D.gold)+' altın</span></div></div>'+
      '<div><h3><label for="cname">Devletinin adı</label></h3><input class="txt" type="text" id="cname" maxlength="24" value="'+esc(S.cname||'')+'" placeholder="'+esc(R.n)+'" autocomplete="off"><p class="k" style="font-size:.82rem;margin-top:4px">Boş bırakırsan bölgenin adı kullanılır.</p></div>'+
      '<button class="primary" data-act="start">Oyuna başla</button>';
  }
  return h;
}

function renderManage(){
  var s=S,chs=s.choices||[];
  var satColor=s.sat>=50?'var(--good)':(s.sat>=25?'#f0b24a':'#ff3b4e');
  var h='';
  h+='<div class="rows"><div class="row"><span class="k">Memnuniyet</span><span class="v" style="color:'+satColor+'">'+s.sat+' / 100'+(s.sat<25?' ⚠':'')+'</span><div class="meter"><i style="width:'+s.sat+'%;background:'+satColor+'"></i></div></div></div>';
  var cur=CATS.filter(function(q){return q.k===s.cat;})[0]||CATS[0];
  var tot=seqCost(s,chs);
  h+='<div><h3>Bu dönemin gelişim yönü · '+chs.length+'/3 seçildi'+(tot?' · '+fmt(tot)+' altın':'')+'</h3><div class="seg" style="margin-bottom:10px">'+CATS.map(function(q){var tt=0;q.subs.forEach(function(u){tt+=s.dev[u.k]||0;});return '<button data-act="cat" data-k="'+q.k+'" aria-pressed="'+(cur.k===q.k)+'">'+q.n+'</button>';}).join('')+'</div><div class="devs">';
  cur.subs.forEach(function(u){
    var cn=cntC(chs,u.k),on=cn>0,dc=devCost(s,u.k)+40*cn;
    var dd=u.d+((u.e&&u.e.cinc&&!REGIONS[s.region].coast)?' <b>(bu bölgenin kıyısı yok: etkisiz)</b>':'');
    h+='<button data-act="choice" data-k="'+u.k+'" aria-pressed="'+on+'" '+((chs.length>=3||tot+dc>s.gold)?'disabled':'')+'><span class="dn">'+u.n+(cn?' <span class="dc">×'+cn+'</span>':'')+'</span><span class="dd">'+dd+'</span><span class="dc">'+fmt(dc)+' altın</span></button>';
  });
  h+='</div>'+(chs.length?'<div class="seg" style="margin-top:8px">'+chs.map(function(k,ix){return '<button data-act="unchoice" data-i="'+ix+'" style="font-size:.82rem">✕ '+esc(DEVN[k])+'</button>';}).join('')+'</div><p class="k" style="font-size:.8rem;margin-top:4px">Aynı gelişimi üç kereye kadar seçebilirsin; her tekrar bir öncekinden pahalıdır.</p>':'<p class="k" style="font-size:.8rem;margin-top:6px">Aynı seçeneği birden fazla kez seçip daha çok geliştirebilirsin.</p>')+'</div>';
  var gc=Math.round(40+0.25*s.pop);
  h+='<div><h3>Halk</h3><button data-act="popgift" '+((s.gifted||s.gold<gc||s.sat>=100)?'disabled':'')+'>🎁 Halka hediye ver · '+fmt(gc)+' altın · memnuniyet +15</button><p class="k" style="font-size:.82rem;margin-top:4px">'+(s.gifted?'Bu dönem hediye verildi.':'Dönem başına bir kez verilebilir. Bedel nüfusa göre artar.')+'</p></div>';
  h+='<div><h3>Vergi</h3><div class="seg">';
  Object.keys(TAX).forEach(function(k){h+='<button data-act="tax" data-k="'+k+'" aria-pressed="'+(s.tax===k)+'">'+TAX[k].n+'</button>';});
  h+='</div></div>';
  var rc=has(s,'kisla')?15:20;
  var rpl=Math.min(s.recPlan||0,recMax(s));
  h+='<div><h3>Ordu · şimdi '+fmt(s.soldiers)+' asker</h3><label class="k" for="solin" style="font-size:.88rem">Bu dönem eklenecek asker sayısı</label>'+
    '<div class="stepper" style="margin-top:6px"><input class="txt" type="number" id="solin" min="0" step="1" value="'+rpl+'" style="width:120px"><span class="k">asker · en fazla '+fmt(recMax(s))+'</span></div>'+
    '<p class="k" style="font-size:.82rem;margin-top:4px">'+(rpl?'Dönem sonunda ordun '+fmt(s.soldiers)+' → '+fmt(s.soldiers+rpl)+' olacak ('+Math.ceil(rpl*rc/10)+' altın, '+Math.ceil(rpl/5)+' demir, '+Math.ceil(rpl/10)+' kumaş).':'Yazdığın sayı dönem sonunda orduna eklenir.')+' Her 10 asker: '+rc+' altın, 2 demir, 1 kumaş. Askerler nüfusun parçasıdır: alınca nüfus artmaz, kayıp verince azalır.</p>'+
    '<div class="seg" style="margin-top:8px;align-items:center"><button data-act="disband" '+(s.soldiers<10?'disabled':'')+'>Terhis et · −10 asker</button>'+(s.merc?'<span class="pill good">⚔️ Paralı asker: '+fmt(s.merc.n)+' · '+s.merc.b+' savaş kaldı</span>':'')+'</div>'+
    (function(){var mn=Math.max(0,Math.min(500,Math.floor(s.mercN||0))),mb=Math.max(1,Math.min(5,Math.floor(s.mercB||1))),mc=Math.ceil(mn/10)*20*mb;
      return '<div style="margin-top:12px"><button data-act="mercToggle" aria-expanded="'+mercOpen+'">⚔️ Paralı asker kirala '+(mercOpen?'▲':'▼')+'</button>'+(!mercOpen?'':'<div style="margin-top:10px"><div class="stepper"><label class="k" for="mercn">Asker</label><input class="txt" type="number" id="mercn" min="0" max="500" step="1" value="'+mn+'" style="width:90px"><label class="k" for="mercb">Savaş (1-5)</label><input class="txt" type="number" id="mercb" min="1" max="5" step="1" value="'+mb+'" style="width:70px"></div>'+
      '<button data-act="hiremerc" style="margin-top:8px" '+((mn<1||s.gold<mc)?'disabled':'')+'>Kirala · '+fmt(mc)+' altın</button><p class="k" style="font-size:.82rem;margin-top:4px">Her 10 asker, bir savaş için 20 altın. Sadece yazdığın savaş sayısı kadar savaşırlar (savunma da sayılır), maaş istemezler ve nüfustan düşmezler. Savaşta ölenler geri gelmez.</p></div>')+'</div>';})()+'</div>';
  h+='<button data-act="enterCap">🏛️ Başkentine gir ve bina yap</button>';
  h+='<button class="primary" data-act="end">3 yılı ilerlet'+(chs.length?'':' (gelişim seçilmedi)')+'</button>';
  if(s.log.length)h+='<details><summary>Geçmiş</summary><ul>'+s.log.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul></details>';
  h+='<button data-act="saveExit">Kaydet ve çık</button>';
  h+='<button data-act="reset" style="align-self:flex-start;font-size:.82rem;color:var(--muted)">Oyunu bırak · kaydı sil</button>';
  return h;
}

function renderBuild(){
  var s=S,h='<div><h3>Binalar</h3><p class="k" style="font-size:.88rem;margin-bottom:10px">Binalar kalelerin ve başkentlerin içine yapılır. Haritada kendi bölgene ya da kalene tıklayıp içine gir, boş bir alana bina yerleştir. Yıkmak binanın fiyatının dörtte birine mal olur.</p><div class="rows">';
  BUILDS.forEach(function(b){h+='<div class="row"><span class="k">'+b.n+'</span><span class="v">'+has(s,b.k)+' adet</span><span class="f">'+b.d+'</span></div>';});
  h+='</div></div><button class="primary" data-act="enterCap">Başkentine gir</button>';
  return h+'<p class="k" style="font-size:.88rem">Bütçe: '+fmt(s.gold)+' altın · '+fmt(s.res.wood)+' odun · '+fmt(s.res.stone)+' taş</p>';
}

function renderDiplo(){
  var s=S,h='<div><h3>Komşular</h3><button class="seg-btn" data-act="allyMap" style="margin-bottom:8px">🤝 İttifak haritasını aç</button>'+(s.dnote?'<p class="note" style="color:var(--ink);margin-bottom:8px">'+esc(s.dnote)+'</p>':''),list=diploList(s);
  list.forEach(function(n){
    var ally=isAlly(s,n),r=s.rel[n],lab=relLabel(s,n),war=!!s.warWith[n],tr=(s.tradeWith||[]).indexOf(n)>=0,cls=ally||r>=30?'good':(r<=-30||war?'bad':'');
    h+='<div class="nb"><div class="nbh"><b>'+REGIONS[n].n+'</b><span class="pill '+cls+'">'+(war?'Savaşta':lab)+' · '+r+'</span></div>'+
      '<p class="k" style="font-size:.88rem">Tahmini güç '+fmt(s.strengths[n])+' · senin gücün '+fmt(power(s))+(tr?' · ticaret anlaşması var':'')+'</p>'+
      (function(){var dv=s.aiDev&&s.aiDev[n]?AIDEV.filter(function(q){return s.aiDev[n][q.k];}).sort(function(p,q){return s.aiDev[n][q.k]-s.aiDev[n][p.k];}).slice(0,3).map(function(q){return q.n+' ×'+s.aiDev[n][q.k];}).join(', '):'',al=aiAllyOf(s,n).map(function(x){return REGIONS[x].n;}).join(', '),pwr=s.pendWar&&ally&&(s.pendWar.a===n||s.pendWar.b===n);
        return '<p class="k" style="font-size:.82rem">Tavrı: '+esc(AIPERS[n].t)+'</p>'+(dv?'<p class="k" style="font-size:.82rem">Gelişim: '+dv+'</p>':'')+(al?'<p class="k" style="font-size:.82rem">İttifakları: '+esc(al)+'</p>':'')+(pwr?'<p class="note" style="color:var(--ink)">⚔️ Müttefikin savaşta! Gönderilen: '+fmt((s.sent&&s.sent[n])||0)+' asker.</p><div class="seg"><button data-act="sendtroops" data-i="'+n+'" '+(s.soldiers<20?'disabled':'')+'>Asker gönder · −10 asker</button></div>':'');})()+
      '<div class="seg"><button data-act="gift" data-i="'+n+'" '+(s.gold<40?'disabled':'')+'>Hediye · 40</button>'+
      (function(){var pl=((s.pacts&&s.pacts[n])||0)-s.turn,tried=s.pactTry&&s.pactTry[n]===s.turn;return '<button data-act="pact" data-i="'+n+'" '+((pl>0||tried||war||r<0||s.gold<70)?'disabled':'')+'>'+(pl>0?'Saldırmazlık · '+pl+' dönem':(tried?'Bu dönem denendi':'Saldırmazlık · 70'))+'</button><button data-act="aid" data-i="'+n+'" '+(s.soldiers<20?'disabled':'')+'>Asker gönder · −10</button>';})()+
      (war?'<button data-act="peace" data-i="'+n+'" '+(s.gold<50?'disabled':'')+'>Barış yap · 50</button>':'<button data-act="trade" data-i="'+n+'" '+((tr||r<10||s.gold<80)?'disabled':'')+'>'+(tr?'Anlaşma var':'Ticaret anlaşması · 80')+'</button>')+
      '</div><p class="k" style="font-size:.82rem">Savaşmak için haritada bu devletin bir kalesine tıkla.</p></div>';
  });
  if(!list.length)h+='<p class="k">Sınırında başka devlet kalmadı.</p>';
  return h+'</div><p class="k" style="font-size:.88rem">İttifak kurma ve bir ittifak grubuna katılma yalnızca ittifak haritasından yapılır. Müttefik saldırmaz, savunmada sana asker gönderir. Saldırırken hedef olmayan müttefiklerinden yardım isteyebilirsin: yardım edebilecek müttefiklerle birlikte sen dahil üç kişiysen kabul garantidir; ikili grupta kabul ihtimali zorluğa göre değişir. Ticaret anlaşması için ilişki 10 ve üstü olmalı, geliri %6 artırır ve savaş çıkarsa bozulur. Barış teklifi %70 kabul edilir, kabul edilirse iki dönem saldırı olmaz. İstediğin zaman savaş açabilirsin: bir dönemdeki ilk savaşın bedelsiz, sonraki her savaş halk memnuniyetini 10 düşürür. Uzaktaki devletlere de sefer açabilirsin, mesafe başına 20 altın masraf çıkar. Müttefike saldırırsan ittifak bozulur.</p>';
}

function warnings(s){
  var w=[],c=calc(s),net=c.income-c.salary-c.upkeep-c.admin+c.flat,D=DIFF[s.diff],P0=s.prev,pc=projCost(s);
  if(s.sat<=15)w.push('🚨 Halk isyanın eşiğinde! Memnuniyet '+s.sat+'. Hemen halka hediye ver ya da vergiyi düşür.');
  else if(s.sat<30)w.push('⚠️ Memnuniyet çok düştü ('+s.sat+'), dikkat et!');
  if(s.gold+net-pc<0)w.push('🚨 Hazine dönem sonunda '+(pc?'(seçtiğin gelişim ve asker alımı dahil) ':'')+'eksiye düşüyor: '+fmt(s.gold+net-pc)+'. Hazine biterse isyan çıkar ve oyun biter. Gelişim seçimini ya da asker alımını azalt.');
  else if(s.gold<150)w.push('⚠️ Hazine çok azaldı ('+fmt(s.gold)+' altın), harcamalara dikkat et.');
  if(s.soldiers<0.5*D.sol)w.push('⚠️ Asker sayısı çok düştü ('+fmt(s.soldiers)+'). Komşular zayıflığını fark edebilir.');
  if(P0&&s.pop+s.soldiers<P0.pop*0.92)w.push('⚠️ Nüfus hızla düşüyor ('+fmt(P0.pop)+' → '+fmt(s.pop+s.soldiers)+').');
  else if(s.pop<150)w.push('⚠️ Nüfus çok azaldı ('+fmt(s.pop)+' sivil).');
  return w;
}
function tipsFor(s){
  var c=calc(s),net=c.income-c.salary-c.upkeep-c.admin+c.flat,ctx=[],gen=[],out=[];
  if(s.sat<40)ctx.push('Halk huzursuz. Halka hediye vermek, vergiyi düşürmek ya da cami yapmak memnuniyeti artırır.');
  if(net<0)ctx.push('Giderin gelirinden fazla. Vergiyi artır, pazar kur ya da orduyu küçült; yoksa hazine erir.');
  if(c.prod<c.cons)ctx.push('Yiyecek üretimin tüketimin altında. Tarım ve gıda gelişimi seç, ambar yap.');
  var mx=0;for(var i=0;i<9;i++)if(i!==s.region&&!annexed(s,i))mx=Math.max(mx,s.strengths[i]);
  if(power(s)<mx*0.6)ctx.push('En güçlü komşun senden epey güçlü. Asker al, sur yap ve bir komşuyla ittifak kur.');
  if(!s.allies.length)ctx.push('İttifakın yok. Dostane bir komşuyla ittifak kurarsan saldırı gelince sana asker gönderir.');
  if(s.gold>600)ctx.push('Hazinen dolu. Birikmiş parayı gelişime, binaya ya da orduya yatırmak daha iyi olabilir.');
  gen=['Aynı gelişimi üç kez seçersen o alanı hızla geliştirirsin, ama her tekrar daha pahalıdır.','Bir dönemdeki ilk savaşın bedelsiz; sonraki her savaş memnuniyeti 10 düşürür.','Başkentine saldırıdan önce komşunun kalelerini almak gerekir. Seninkine de saldırmak için 5 kalen alınmalı.','Binaları kaleye ve başkente yap; kale düşerse içindeki binalar düşmana geçer.','Komşular birbiriyle de savaşır. Zayıflayan bir komşuyu fırsat bilip kalelerini alabilirsin.','Askerler nüfusun parçasıdır. Çok asker almak sivil sayını ve geliri düşürür.','Her dönem sonunda yiyecek üretimin tüketimini karşılamıyorsa kıtlık başlayabilir.'];
  if(ctx.length)out.push(ctx[Math.floor(Math.random()*ctx.length)]);
  out.push(gen[Math.floor(Math.random()*gen.length)]);
  return out;
}
function renderPlay(){
  var s=S,tabs=[['yonet','Yönetim'],['siyaset','Siyaset']];
  var h='<div class="seg tabs">'+tabs.map(function(t){return '<button data-act="tab" data-k="'+t[0]+'" aria-pressed="'+(s.tab===t[0])+'">'+t[1]+'</button>';}).join('')+'</div>';
  var nws=(s.news||[]).filter(function(x){return /savaş|kale|püskürttü|yıkıldı|ittifak|gelişim|anlaşma|asker gönder/.test(x);});
  var ws=warnings(s);if(ws.length)h+='<div class="warn" role="alert">'+ws.map(function(x){return '<p>'+esc(x)+'</p>';}).join('')+'</div>';
  if(nws.length)h+='<div class="tip"><h3>📰 Komşu haberleri</h3>'+nws.map(function(x){return '<p>'+esc(x)+'</p>';}).join('')+'</div>';
  h+=renderSel(s);
  h+=s.tab==='siyaset'?renderDiplo():renderManage();
  return h;
}

function renderDead(){
  var s=S;
  return '<div class="dead"><p class="big">YOU DEAD</p><p class="k">'+esc(cname(s))+'</p><p>'+deathText(s.dead)+'</p>'+
    '<p class="k">'+s.turn+' dönem ('+(s.turn*3)+' yıl) ayakta kaldın.</p>'+
    (s.report&&s.report.lines.length?'<div class="report"><h3>Son dönem</h3><ul>'+s.report.lines.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul></div>':'')+
    '<button class="primary" data-act="reset">Yeniden başla</button></div>';
}

function poolText(b){
  var ou=ownUnits(b),dep=0;ou.forEach(function(u){dep+=u.n;});
  var pool=Math.max(0,Math.floor(b.pool||0));
  return 'Cephede '+fmt(dep)+' · Yedek '+fmt(pool)+' · Ordu '+fmt(dep+pool);
}
function renderBattlePanel(){
  var b=S.battle,en=REGIONS[b.enemy].n,h='<h2>'+(b.mode==='def'?en+' saldırıyor':en+' seferi')+'</h2><p class="k">'+(b.target?fname(b.target):'')+'</p>';
  if(b.phase==='place'){
    if(b.mode==='def'&&S.allies.length)h+='<p class="note" style="color:var(--ink)">🤝 Müttefik yardımı: '+S.allies.map(function(al){return REGIONS[al].n+' ('+fmt(Math.round(S.strengths[al]*0.25))+' asker)';}).join(', ')+' birliklerini gönderdi.</p>';
    h+='<p>Ordunu sen kur: birlik ekle, her birliğe kaç asker koyacağını yaz. Birliğe tıklayıp mavi bölgeden (haritanın sol yarısı) bir kare seçerek yerleştirir, sonra savaşı başlatırsın. Yedekte kalan asker savaşmaz ama ölmez. Birlikler savaşa Dur emriyle başlar: yerlerini korur, menziline gireni vururlar; savaş sırasında İlerle ya da Hücum emri verirsin.</p>';
    h+='<div><h3>Birliklerin</h3><p class="note" id="bpool">'+poolText(b)+'</p>';
    var ou=ownUnits(b);
    if(!deployed(b))h+='<p class="note" style="color:var(--bad)">Cephede askerin yok: bu haliyle savaşı başlatırsan yenilirsin.</p>';
    ou.forEach(function(u){
      h+='<div class="urow"><span>'+TY[u.t].n+'</span>'+
        '<button data-act="bminus" data-id="'+u.id+'" title="10 askeri yedeğe al">−10</button>'+
        '<input class="txt" type="number" min="1" step="1" id="un-'+u.id+'" value="'+u.n+'" aria-label="'+TY[u.t].n+' birliğindeki asker sayısı">'+
        '<button data-act="bplus" data-id="'+u.id+'" title="Yedekten 10 asker ver">+10</button>'+
        '<button data-act="bdel" data-id="'+u.id+'" title="Birliği dağıt, askerler yedeğe döner">✕</button></div>';
    });
    h+='<div class="seg" style="margin-top:8px">';
    ['S','P','O'].forEach(function(t){h+='<button data-act="badd" data-k="'+t+'" '+(ou.length>=MAXU?'disabled':'')+'>+ '+TY[t].n+'</button>';});
    if((b.pool||0)>0)h+='<button data-act="bfill">Yedeği dağıt</button>';
    h+='</div>';
    var help=b.units.filter(function(u){return u.side==='p'&&(u.ally||u.merc)&&u.n>0;});
    if(help.length)h+='<p class="k" style="font-size:.82rem;margin-top:8px">Yanımda çarpışanlar: '+help.map(function(u){return (u.merc?'Paralı ':'Müttefik ')+TY[u.t].n+' ('+fmt(u.n)+')';}).join(', ')+' — asker sayılarını değiştiremezsin, haritada taşıyabilirsin.</p>';
    if(ou.length>=MAXU)h+='<p class="k" style="font-size:.82rem">En fazla '+MAXU+' birliğin olabilir.</p>';
    h+='</div>';
    if(b.note)h+='<p class="note" style="color:var(--bad)">'+esc(b.note)+'</p>';
    h+='<p class="k" style="font-size:.88rem">Süvari okçuyu, piyade süvariyi, okçu piyadeyi yener. Okçu 3 kare uzaktan vurur. Birlikler grubun merkezinden kopmaz, birlikte ilerler. Düşman: '+fmt(sumN(b,'e'))+' asker.'+(b.eAllies&&b.eAllies.length?' Düşmanın müttefikleri de savaşa katıldı: '+b.eAllies.map(function(c){return REGIONS[c].n;}).join(', ')+'.':'')+'</p>';
    if(b.mode==='off'&&S.allies.length){
      h+='<div><h3>Müttefik yardımı</h3>';
      S.allies.forEach(function(al){
        if(al===b.enemy)return;
        var ask=(b.asked||[]).filter(function(x){return x.al===al;})[0];
        var chance=allyHelpChance(S,b.enemy);
        h+='<div class="nbh" style="margin-bottom:6px"><span>'+REGIONS[al].n+'</span>'+(ask?'<span class="pill '+(ask.ok?'good':'bad')+'">'+(ask.ok?'Birlik gönderdi':'Reddetti')+'</span>':'<button data-act="askally" data-i="'+al+'">Yardım iste · '+(chance>=1?'kesin':'%'+Math.round(chance*100))+'</button>')+'</div>';
      });
      h+='<p class="k" style="font-size:.82rem">Saldırdığın müttefik yardım edemez. Hedef dışındaki müttefiklerle birlikte sen üç kişilik gruptaysan yardım kesin gelir; ikili grupta kabul ihtimali zorluğa bağlıdır. Yardım geldiğinde müttefik birliği haritaya eklenir, kurduğun diziliş bozulmaz.</p></div>';
    }
    h+='<button class="primary" data-act="bstart">Savaşı başlat</button>';
    if(b.mode==='off')h+='<button data-act="bflee">Vazgeç</button>';
  }else if(b.phase==='run'){
    h+='<p>Savaş sürüyor. Birliğe tıkla: haritada bir kareye tıklarsan oraya yürür, aşağıdan emir verirsin.</p><p id="bstat" style="font-family:var(--f-mono);font-size:.85rem"></p>';
    var su=b.units.filter(function(u){return u.id===b.sel;})[0];
    var scope=su&&su.side==='p'&&!su.ally&&!su.merc?su:null;
    h+='<div><h3>Emirler · '+(scope?'seçili '+TY[scope.t].n.toLowerCase()+' birliği ('+fmt(scope.n)+')':'tüm birliklerin')+'</h3><div class="seg">';
    ORD.forEach(function(o){
      h+='<button data-act="bord" data-k="'+o.k+'" title="'+esc(o.d)+'"'+(scope&&scope.o===o.k?' aria-pressed="true"':'')+'>'+o.n+'</button>';
    });
    h+='</div><p class="k" style="font-size:.82rem">'+(scope?'Emir sadece seçili birliğe uygulanır.':'Birlik seçmediysen emir tüm birliklerine uygulanır. Paralı ve müttefik birlikler kendi başına ilerler.')+'</p>'+
      '<p class="k" style="font-size:.82rem">▪ Dur: yerini korur, menziline gireni vurur; uzaktan vuruluyorsa karşılığa gider · ▶ İlerle: dizilişi bozmadan yaklaşır · ⚔ Hücum: serbest saldırı.</p></div>';
  }else{
    var win=b.result==='win';
    h+='<p class="big" style="font-family:var(--f-display);font-weight:800;font-size:2.2rem;color:var('+(win?'--good':'--bad')+')">'+(win?'Zafer':'Yenilgi')+'</p>';
    h+='<p class="note">'+battleSummary(b)+'</p>';
    h+='<p>'+(b.mode==='def'?(win?'Saldırı püskürtüldü.':(b.target&&b.target.type==='cap'&&b.target.state===S.region?'Başkent düşüyor ve devlet ele geçirilecek.':'Savunma çöktü, kale düşüyor.')):(win?'Sefer kazanıldı, ganimet alınacak.':'Sefer başarısız oldu.'))+'</p>';
    h+='<button class="primary" data-act="bdone">Devam</button>';
  }
  return h;
}

function renderStats(){
  var el=document.getElementById('stats');
  if(!el)return;
  var ch=document.getElementById('chips'),mt=document.getElementById('mtog');
  if(S.phase!=='play'||S.battle||S.view||S.adv){mapOnly=false;amap=false;}
  var at=document.getElementById('atog');if(at){at.hidden=!(S.phase==='play'&&!S.battle&&!S.view&&!S.adv)||mapOnly;at.textContent=amap?'↩ Haritaya dön':'🤝 İttifak haritası';}
  document.body.classList.toggle('maponly',mapOnly);
  if(mt){mt.hidden=!(S.phase==='play'&&!S.battle&&!S.view&&!S.adv)||amap;mt.textContent=mapOnly?'↩ Geri dön':'🗺️ Sadece harita';}
  if(S.phase!=='play'||S.battle){el.hidden=true;el.innerHTML='';if(ch)ch.hidden=true;return;}
  if(ch){ch.hidden=!!S.view;ch.setAttribute('aria-expanded',statsOpen);ch.innerHTML='<span class="ch">👥 <b>'+fmt(S.pop+S.soldiers)+'</b></span><span class="ch">⚔️ <b>'+fmt(S.soldiers)+'</b></span><span class="ch">💰 <b>'+fmt(S.gold)+'</b></span><span class="cm">'+(statsOpen?'▲ gizle':'▼ tümü')+'</span>';}
  if(!statsOpen){el.hidden=true;el.innerHTML='';return;}
  var s=S,chs=s.choices||[],dv=Object.assign({},s.dev),cost=0;
  cost=seqCost(s,chs);chs.forEach(function(k){dv[k]++;});
  var c=calc(s,dv),rc2=recCost(s),end=s.gold+c.income-c.salary-c.upkeep-c.admin+c.flat-cost-rc2;
  var P0=s.prev||snap(s),N0=snap(s);
  var DEF=[['👥','Toplam nüfus','pop'],['⚔️','Asker (nüfus içinde)','soldiers'],['⛵','Tekne/gemi','boat'],['🐄','Büyükbaş','cattle'],['🐑','Küçükbaş','sheep'],['📈','Ticaret gücü','trade'],['💰','Hazine','gold'],['🌾','Yiyecek','food'],['🪵','Odun','wood'],['🪨','Taş','stone'],['⛏️','Demir','iron'],['🧵','Kumaş','cloth']];
  function rv(o,k){return k==='boat'?(o.boats+' tekne'+(o.ships?' + '+o.ships+' gemi':'')):fmt(o[k]);}
  function nm(o,k){return k==='boat'?o.boats+o.ships*4:o[k];}
  el.hidden=false;
  function resBlock(rows){return '<div class="res"><span></span><span></span><span class="rh">önceki</span><span></span><span class="rh">şimdi</span>'+
    rows.map(function(r){var a=nm(P0,r[2]),b=nm(N0,r[2]),cl=b>a?'up':(b<a?'down':'');
      return '<span>'+r[0]+'</span><span class="k">'+r[1]+'</span><span class="rp">'+rv(P0,r[2])+'</span><span class="ra">→</span><span class="rn '+cl+'">'+rv(N0,r[2])+'</span>';}).join('')+'</div>';}
  el.innerHTML='<div class="res2">'+resBlock(DEF.slice(0,6))+resBlock(DEF.slice(6))+'</div>'+
    '<p class="note">Savunma gücü '+fmt(defPower(s))+' · '+ownedForts(s)+' kale · '+(1+annexCount(s))+' devletin toprağı sende</p>'+
    '<p class="note">Bu dönem tahmini: gelir '+sg(c.income)+' · maaş '+sg(-c.salary)+' · idare '+sg(-c.admin)+(c.upkeep?' · bakım '+sg(-c.upkeep):'')+(c.flat?' · maden '+sg(c.flat):'')+(cost?' · gelişim '+sg(-cost):'')+(rc2?' · asker alımı '+sg(-rc2):'')+' → hazine '+fmt(end)+'</p>'+
    '<p class="note">Yiyecek: üretim '+fmt(c.prod)+' · tüketim '+fmt(c.cons)+' → '+sg(c.prod-c.cons)+'</p>';
}
function renderIntro(){
  var el=document.getElementById('intro');if(!el)return;
  if(!intro||S.battle){el.style.display='none';el.innerHTML='';return;}
  el.style.display='flex';
  var gl=gList();
  el.innerHTML='<div class="ib"><p class="ik">Hayali bir harita · dokuz devlet</p><h1>Üç Yıl</h1><p class="id">Bir devleti yönet. Her dönem üç yıl sürer: karar ver, ilerlet, sonucuna katlan. Kalelerini koru, komşularını fethet ya da onlarla anlaş.</p>'+
    '<p class="ik" style="text-transform:none;letter-spacing:.02em;line-height:1.7">Klavye: <b>Boşluk</b> dönemi ilerlet · <b>Esc</b> geri · <b>1-9</b> bölge · <b>M</b> sadece harita · <b>A</b> ittifak · <b>S</b> durum · <b>T</b> sekme · <b>E</b> başkente gir · <b>F</b> tam ekran<br>Fare: sol tık seç · sağ tık geri · kendi kalenine çift tık ile gir</p>'+
    (gl.length?'<div class="games"><h2>Kayıtlı oyunların</h2>'+gl.map(function(g){return '<div class="game"><button class="primary" data-act="introCont" data-id="'+g.id+'"><b>'+esc(cname(g.s))+'</b><span>'+DIFF[g.s.diff].n+' · Yıl '+g.s.year+' · Dönem '+(g.s.turn+1)+'</span></button><button data-act="introDel" data-id="'+g.id+'" class="'+(delAsk===g.id?'danger':'')+'" aria-label="Sil">'+(delAsk===g.id?'Emin misin? Sil':'🗑️ Sil')+'</button></div>';}).join('')+'</div>':'')+
    '<button '+(gl.length?'':'class="primary" ')+'data-act="introNew">'+(gl.length?'➕ Yeni oyun':'Oyuna başla')+'</button>'+
    '<p class="ik" style="margin-top:14px">Kaybetmek kolay, kazanmak zor.</p>'+
    '<details class="help"><summary class="hsum">❓ Nasıl oynanır?</summary><p class="k" style="margin-top:8px">Merak ettiğin başlığa tıkla.</p>'+HELP.map(function(x,ix){return '<details'+(ix===0?' open':'')+'><summary>'+x[0]+'</summary><p>'+esc(x[1])+'</p></details>';}).join('')+'</details></div>';
}
function render(){
  renderIntro();
  var p=document.getElementById('panel');
  renderStatus();
  renderStats();
  if(S.adv&&S.phase==='play'&&!S.battle){renderMap();document.getElementById('map').classList.add('busy');p.innerHTML=renderAdvance();updateAdv();return;}
  if(S.battle){renderBattleMap();p.innerHTML=renderBattlePanel();var el=document.getElementById('bstat');if(el)el.textContent=battleSummary(S.battle)+' · Düşman '+fmt(sumN(S.battle,'e'));return;}
  if(S.view&&S.phase==='play'&&sOwned(S,S.view)){renderInterior();p.innerHTML=renderInteriorPanel();return;}
  S.view=null;
  if(amap&&S.phase==='play'){renderAllyMap();p.innerHTML=renderAllyPanel();return;}
  renderMap();
  p.innerHTML=S.phase==='setup'?renderSetup():(S.phase==='dead'?renderDead():renderPlay());
}
