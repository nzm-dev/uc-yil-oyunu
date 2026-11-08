/* ============================================================
   pc.js — MASAÜSTÜ GİRDİ KATMANI
   Klavye kısayolları, sağ tık = geri, fare bilgi balonu,
   çift tık = kendi kalenine gir ve tam ekran.
   Bu dosya oyunun kurallarını DEĞİŞTİRMEZ: ya act(...) düğmesini
   tetikler ya da zaten var olan durum alanlarını (S.sel, S.view,
   mapOnly, amap, statsOpen) çevirir. Bu yüzden silinirse oyun
   fareyle yine çalışır, sadece kısayollar kaybolur.
   YENİ KISAYOL EKLEMEK: aşağıdaki keydown dinleyicisine
   "if(c==='KeyX'){ ... }" satırı ekle; haritalar e.code ile
   okunur, yani Türkçe/F klavye fark etmez.
   ============================================================ */
var tipKey='';

/* --- bilgi balonu: haritanın üstünde imleci takip eden kutu --- */
function tipHide(){var e=document.getElementById('tip');if(e)e.hidden=true;tipKey='';}
function fortCount(i){var n=0,q;if(!S.forts)return 0;for(q=0;q<S.forts.length;q++)if(S.forts[q]===i)n++;return n;}
function tipFor(t){
  var a=t.getAttribute('data-act'),i=t.getAttribute('data-i'),k,own,p,co,gone;
  if(a==='region'){
    i=+i;
    if(S.phase==='setup')return '<b>'+esc(REGIONS[i].n)+'</b><i>'+(S.pick===i?'seçili · başlamak için sol tık':'seçmek için sol tık · '+(i+1)+' tuşuna da basabilirsin')+'</i>';
    own=(i===S.region)||annexed(S,i);
    co=ctl(S,i);gone=!own&&co!==i;
    p=[];
    if(own)p=['toprak senin',fortCount(i)+' kale','içine girmek için sol tık'];
    else if(gone)p=['yıkıldı','toprakları '+REGIONS[co].n+' aldı'];
    else{
      p=['güç '+fmt(S.strengths[i]),fortCount(i)+' kale'];
      if(isAlly(S,i))p.push('müttefik');
      if(S.warWith&&S.warWith[i])p.push('SAVAŞ HALİNDE');
      p.push('kalelerine tıkla');
    }
    return '<b>'+esc(i===S.region?cname(S):REGIONS[i].n)+'</b><i>'+esc(p.join(' · '))+'</i>';
  }
  if(a==='fort'){
    i=+t.getAttribute('data-s');k=+t.getAttribute('data-k');own=ownerOf(S,i,k);
    if(own===S.region)p='senin'+(k>=0?' kalen':' başkentin')+' · '+(k>=0?'girmek için çift tık':'girmek için tıkla');
    else p=REGIONS[own].n+' · ~'+fmt(garrison(S,i,k))+' asker · bilgi için sol tık';
    return '<b>'+esc(k>=0?fortName(i,k):'★ '+capName(i))+'</b><i>'+esc(p)+'</i>';
  }
  if(a==='enter')return '<b>'+esc(S.sel&&S.sel.k>=0?fortName(S.sel.state,S.sel.k):capName(S.sel?S.sel.state:S.region))+'</b><i>içini açmak için tıkla</i>';
  return '';
}
document.addEventListener('mousemove',function(e){
  if(intro||S.adv||S.battle||e.buttons){if(tipKey)tipHide();return;}
  var t=(e.target.closest&&e.target.closest('#map [data-act]'))||null,html=t?tipFor(t):'';
  if(!html){if(tipKey)tipHide();return;}
  var el=document.getElementById('tip');
  if(html!==tipKey){el.innerHTML=html;tipKey=html;}
  el.hidden=false;
  var r=el.getBoundingClientRect(),x=e.clientX+18,y=e.clientY+16;
  if(x+r.width>innerWidth-10)x=e.clientX-18-r.width;
  if(y+r.height>innerHeight-10)y=innerHeight-10-r.height;
  el.style.left=Math.max(8,x)+'px';el.style.top=Math.max(8,y)+'px';
});
window.addEventListener('blur',tipHide);

/* --- geri basamağı: seçim -> iç mekan -> ittifak haritası -> sadece harita --- */
function pcBack(){
  if(S.sel){S.sel=null;render();return true;}
  if(S.view){S.view=null;S.place=null;S.slot=null;save();render();return true;}
  if(amap){amap=false;render();return true;}
  if(mapOnly){mapOnly=false;render();return true;}
  return false;
}
document.addEventListener('contextmenu',function(e){
  if(intro)return;
  e.preventDefault();
  if(S.battle){if(S.battle.phase==='place'&&S.battle.mode==='off'){S.battle=null;render();}return;}
  pcBack();
});

/* --- çift tık: kendi kaleninin içine gir --- */
document.addEventListener('dblclick',function(e){
  if(intro||S.battle||S.adv||S.phase!=='play')return;
  var t=e.target.closest&&e.target.closest('[data-act="fort"]');
  if(!t)return;
  var i=+t.getAttribute('data-s'),k=+t.getAttribute('data-k');
  if(ownerOf(S,i,k)!==S.region)return;
  S.sel={state:i,k:k};render();
  var b=document.querySelector('[data-act="enter"]');
  if(b)act(b);
});

/* --- tam ekran --- */
function pcFull(){try{if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();}catch(err){}}

/* --- kısayollar --- */
function mapOK(){return S.phase==='play'&&!S.battle&&!S.view&&!S.adv;}
document.addEventListener('keydown',function(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  var tg=e.target,typing=tg&&((tg.tagName==='INPUT'||tg.tagName==='TEXTAREA')||tg.isContentEditable);
  var c=e.code||'',k=e.key;
  if(k==='Escape'){
    if(typing){tg.blur();return;}
    e.preventDefault();
    if(intro){if(S.phase==='play'){intro=false;render();}return;}
    if(endAskHide())return;
    if(S.adv){S.adv.t0=Date.now()-ADV_MS;advRate=1;return;}
    if(S.battle){if(S.battle.phase==='place'&&S.battle.mode==='off'){S.battle=null;render();}return;}
    if(pcBack())return;
    if(S.phase==='play'||S.phase==='dead'){intro=true;delAsk=null;render();}
    return;
  }
  if(typing||e.defaultPrevented)return;
  if(k===' '){
    e.preventDefault();
    if(intro)return;
    if(S.adv){advRate=4;return;}
    if(S.battle){if(S.battle.phase==='place'){var bs=document.querySelector('[data-act="bstart"]');if(bs)act(bs);}return;}
    if(tg.closest&&tg.closest('#map [data-act]'))return;
    if(endAsk){endAskHide();startAdvance();}
    else if(S.phase==='play'&&!S.view)endAskShow();
    return;
  }
  if(k==='Enter'){
    if(intro||S.battle||S.adv)return;
    if(S.phase==='setup'&&S.pick!==null){var st=document.querySelector('[data-act="start"]');if(st){e.preventDefault();act(st);}}
    return;
  }
  if(intro)return;
  if(c==='KeyM'){if(mapOK()){mapOnly=!mapOnly;render();}return;}
  if(c==='KeyA'){if(mapOK()){amap=!amap;S.dnote='';render();}return;}
  if(c==='KeyS'){if(mapOK()){statsOpen=!statsOpen;render();}return;}
  if(c==='KeyT'){if(mapOK()){S.tab=S.tab==='siyaset'?'yonet':'siyaset';S.dnote='';save();render();}return;}
  if(c==='KeyC'){if(S.sel){S.sel=null;render();}return;}
  if(c==='KeyE'){
    if(!mapOK())return;
    if(S.sel){var en=document.querySelector('[data-act="enter"]');if(en){act(en);return;}}
    var ec=document.querySelector('[data-act="enterCap"]');if(ec)act(ec);
    return;
  }
  if(c==='KeyH'){if(S.adv||S.battle)return;intro=true;delAsk=null;render();return;}
  if(c==='KeyF'){pcFull();return;}
  if(/^Digit[1-9]$/.test(c)){
    var i=+c.charAt(5)-1;
    if(S.phase==='setup'){S.pick=i;render();return;}
    if(S.phase==='play'&&!S.battle&&!S.adv&&(i===S.region||annexed(S,i))){S.view='c'+i;S.place=null;S.slot=null;S.sel=null;render();}
  }
});

/* --- dönem sonu onayı: Boşluk dönemi hemen bitirmez, bir onay ister --- */
var endAsk=false,endAskT=null;
function endAskHide(){
  if(!endAsk)return false;
  endAsk=false;
  if(endAskT){clearTimeout(endAskT);endAskT=null;}
  var e=document.getElementById('endask');if(e)e.parentNode.removeChild(e);
  return true;
}
function endAskShow(){
  if(endAsk||S.phase!=='play')return;
  endAsk=true;
  var d=document.createElement('div');
  d.id='endask';d.setAttribute('role','dialog');d.setAttribute('aria-label','Dönemi bitirme onayı');
  d.innerHTML='<span>Dönem bitirilsin mi?</span><button data-act="endok" class="primary">Onayla · Boşluk</button><button data-act="endno">Vazgeç · Esc</button>';
  document.body.appendChild(d);
  endAskT=setTimeout(endAskHide,6000);
}
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('#endask [data-act]');
  if(!t)return;
  if(t.getAttribute('data-act')==='endok'){endAskHide();startAdvance();}
  else endAskHide();
});
var pcRender=render;
render=function(){endAskHide();pcRender();};
