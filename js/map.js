/* ============================================================
   map.js — ORTAÇAĞ HARİTA MOTORU VE HARİTA GÖRÜNÜMLERİ
   Komşu paylaşımlı sınır ızgarası, kıyı ve dalga türetme, ada,
   nehir, göl, dağ orman saçılımı, pusula, kale işaretleri ve
   dünya / ittifak / savaş / yerleşim içi harita görünümleri.
   Haritanın görünümüyle oynayan bir tek burayı değiştirir.
   ============================================================ */
var CAPDY=21,CAPR=12;
function starPts(x,y,R){var r=R/1.732,a=[],i;for(i=0;i<12;i++){var ang=(-90+i*30)*Math.PI/180,rr=i%2===0?R:r;a.push((x+rr*Math.cos(ang)).toFixed(1)+','+(y+rr*Math.sin(ang)).toFixed(1));}return a.join(' ');}
function markers(idx,cx,cy,t){
  var play=S.phase==='play'&&!S.adv,out='',k;
  function col(o){return (S.phase!=='setup'&&o===S.region)?'#8c2f2a':'var('+COLORS[o]+')';}
  function fc(o){return col(o);}
  var F=(t&&t.F?t.F:TERR[idx].F),MKI='#2b1c0a';
  for(k=0;k<12;k++){
    var px=F[k][0],py=F[k][1];
    var o=S.forts?S.forts[idx*NF+k]:idx,sel=S.sel&&S.sel.state===idx&&S.sel.k===k;
    if(play&&idx!==S.region&&!annexed(S,idx)&&o===S.region)out+='<circle class="fort-control" cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="19" clip-path="url(#tc'+idx+')"/>';
    out+='<path class="fortm castle'+(sel?' sel':'')+'" '+(play?'data-act="fort" data-s="'+idx+'" data-k="'+k+'" ':'')+'transform="translate('+px.toFixed(1)+' '+py.toFixed(1)+') scale(1.05)" d="M-6 5V-5H-3.5V-2.5H-1.25V-5H1.25V-2.5H3.5V-5H6V5Z" style="fill:'+fc(o)+';stroke:'+MKI+';stroke-width:'+(sel?3:1.3)+';stroke-linejoin:round" role="img" aria-label="'+esc(fortName(idx,k))+'"></path>';
  }
  var co=S.capOwner?S.capOwner[idx]:idx,cs=S.sel&&S.sel.state===idx&&S.sel.k===-1,dy=cy-CAPDY;
  out+='<polygon class="fortm'+(cs?' sel':'')+'" '+(play?'data-act="fort" data-s="'+idx+'" data-k="-1" ':'')+'points="'+starPts(cx,dy,CAPR)+'" style="fill:'+fc(co)+';fill-opacity:1;stroke:'+MKI+';stroke-dasharray:none;stroke-width:'+(cs?3.6:1.3)+';stroke-linejoin:round" role="img" aria-label="'+esc(capName(idx))+' başkenti"></polygon>';
  return out;
}
function renderInterior(){
  var s=S,key=s.view,sl=getSlots(s,key),cap=key.charAt(0)==='c',cols=4,rows=4,cw=82,chh=82,gap=8;
  var W=cols*cw+(cols-1)*gap,x0=(600-W)/2,y0=50,i,g;
  var svg=document.getElementById('map');svg.classList.remove('busy');svg.classList.remove('medmap');svg.setAttribute('viewBox','0 0 600 420');
  g='<rect x="0" y="0" width="600" height="420" fill="var(--panel)"/><text class="rname" x="300" y="32" style="font-size:20px">'+esc(sName(key))+'</text>';
  for(i=0;i<sl.length;i++){
    var cx=x0+(i%cols)*(cw+gap),cy=y0+Math.floor(i/cols)*(chh+gap),b=sl[i]?bOf(sl[i]):null;
    g+='<g class="slot'+(s.slot===i?' sel':'')+'" data-act="slot" data-i="'+i+'" tabindex="0" role="button" aria-label="'+(b?b.n:'Boş alan')+'">'+
      '<rect class="sbox'+(b?' on':'')+'" x="'+cx+'" y="'+cy+'" width="'+cw+'" height="'+chh+'" rx="6"/>'+
      (b?'<g transform="translate('+(cx+(cw-52)/2)+' '+(cy+(chh-52)/2)+') scale(1.3)">'+bIcon(b.k)+'</g>':'<path d="M'+(cx+cw/2-7)+' '+(cy+chh/2)+'h14M'+(cx+cw/2)+' '+(cy+chh/2-7)+'v14" stroke="var(--line)" stroke-width="2" stroke-linecap="round"/>')+'</g>';
  }
  svg.innerHTML=g;
}
/* ---------- Ortaçağ harita motoru ---------- */
var PAPC='#e9dcbb',PAPC2='#e0d0a6',SEAC='#9dc0c2',INKC='#4a3618',INKC2='#6e5834',RIVC='#4f7d9e',RHUMB='#3f6a7a',COASTC='#3a2a12';
function prng(s){var n=(s>>>0)||1;return function(){n=n+0x6D2B79F5|0;var t=Math.imul(n^n>>>15,1|n);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function vl(P,z){var d='M'+P[0][0].toFixed(1)+' '+P[0][1].toFixed(1),i;for(i=1;i<P.length;i++)d+='L'+P[i][0].toFixed(1)+' '+P[i][1].toFixed(1);return z?d+'Z':d;}
function rp(a){return a.slice().reverse();}
function cj(L){var o=L[0].slice(),i;for(i=1;i<L.length;i++)o=o.concat(L[i].slice(1));return o;}
function plg(P){return P.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');}
function distP(P,x,y){var m=1e9,i,a,b,dx,dy,l,t,px,py;for(i=1;i<P.length;i++){a=P[i-1];b=P[i];dx=b[0]-a[0];dy=b[1]-a[1];l=dx*dx+dy*dy;t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)):0;px=a[0]+dx*t-x;py=a[1]+dy*t-y;m=Math.min(m,px*px+py*py);}return Math.sqrt(m);}
function inPoly(P,x,y){var c=false,i,j;for(i=0,j=P.length-1;i<P.length;j=i++){if(((P[i][1]>y)!==(P[j][1]>y))&&(x<(P[j][0]-P[i][0])*(y-P[i][1])/(P[j][1]-P[i][1])+P[i][0]))c=!c;}return c;}
function egen(A,B,amp,seed,n,fine){var R=prng(seed),dx=B[0]-A[0],dy=B[1]-A[1],L=Math.sqrt(dx*dx+dy*dy)||1,nx=-dy/L,ny=dx/L,p1=R()*6.283,p2=R()*6.283,p3=R()*6.283,p4=R()*6.283,out=[[A[0],A[1]]],i,t,e,w;
  for(i=1;i<n;i++){t=i/n;e=Math.sin(Math.PI*t)*amp;
    w=Math.sin(t*3.1+p1)*0.5+Math.sin(t*7.4+p2)*0.26+Math.sin(t*15.3+p3)*0.14+(fine?Math.sin(t*33.7+p4)*0.09:0)+(R()-0.5)*0.24;
    out.push([A[0]+dx*t+nx*e*w,A[1]+dy*t+ny*e*w]);}
  out.push([B[0],B[1]]);return out;}
function ept(P,fr){var tot=0,len=[],i,a;for(i=1;i<P.length;i++){a=Math.sqrt(Math.pow(P[i][0]-P[i-1][0],2)+Math.pow(P[i][1]-P[i-1][1],2));len.push(a);tot+=a;}
  var tg=tot*fr,acc=0;for(i=0;i<len.length;i++){if(acc+len[i]>=tg){var t=len[i]?(tg-acc)/len[i]:0;return[P[i][0]+(P[i+1][0]-P[i][0])*t,P[i][1]+(P[i+1][1]-P[i][1])*t];}acc+=len[i];}return P[P.length-1].slice();}
var LAT=[
 [[96,118],[236,74],[392,110],[540,156]],
 [[62,200],[222,190],[378,198],[580,250]],
 [[56,290],[212,288],[364,284],[562,336]],
 [[92,362],[244,386],[400,374],[524,350]]];
var HE=[],VE=[];
(function(r,c){for(r=0;r<4;r++)for(c=0;c<3;c++){if(!HE[r])HE[r]=[];HE[r][c]=egen(LAT[r][c],LAT[r][c+1],r===0?21:(r===3?14:11),907+r*31+c*13,(r===0||r===3)?(r===0?26:22):16,r===0||r===3);}
  for(c=0;c<4;c++)for(r=0;r<3;r++){if(!VE[r])VE[r]=[];VE[r][c]=egen(LAT[r][c],LAT[r+1][c],(c===0||c===3)?21:11,401+r*17+c*29,(c===0||c===3)?22:14,c===0||c===3);}})();
var SYM={
 dag:{f:'#d6c497',w:1.5,d:'<path d="M-12 5L-5-7L0-1L5.5-8.5L12 5Z"/><path d="M-5-7L-2.2-1.6M5.5-8.5L3.8-2.8" fill="none" stroke-linecap="round"/>'},
 tepe:{f:'#ddcda4',w:1.2,d:'<path d="M-10 5Q0-8 10 5Z"/>'},
 agac:{f:'#6f8153',w:.9,d:'<path d="M0 5.4V2.4"/><path d="M-4.3 2.6Q0-7.6 4.3 2.6Z"/>'},
 kum:{f:'none',w:1.3,d:'<path d="M-9 4Q-4.5-3.4 0 4Q4.5-3.4 9 4"/>'},
 kar:{f:'none',w:1.2,d:'<path d="M-8 3L-4-2.4L0 3L4-2.4L8 3"/>'},
 tarla:{f:'none',w:1,d:'<path d="M-7 4.2H7M-6.3 0H6.3M-5.4-4.2H5.4"/>'},
 ev:{f:'#b9713f',w:.9,d:'<path d="M-3.6 4.6V-1L0-4.4L3.6-1V4.6Z"/><path d="M-5.2-1L0-5.8L5.2-1" fill="none"/>'},
 mag:{f:'#5a4326',w:1,d:'<path d="M-6 5V1Q0-7.2 6 1V5Z"/>'},
 gol:{f:'#9dbfc1',sc:'#3d6373',w:1,d:'<path d="M-12 0Q-8-6.6 0-5.8Q10-5 12 1Q9 6.8 0 6Q-9 6.2-12 0Z"/>'},
 ada:{f:'#e3d4ae',w:1.4,d:'<path d="M-13 4Q-8-6 0-4Q9-6 13 3Q4 7-4 6Q-10 7-13 4Z"/>'},
 gemi:{f:'#e6d7ae',sc:'#3d6373',w:1.1,d:'<path d="M-8 3.4H8L5 7H-5Z"/><path d="M0 3V-6.4L6.6 1H0Z"/>'},
 canavar:{f:'none',sc:'#3d6373',w:1.4,d:'<path d="M-11 3Q-7-4-3 2Q1 7 5 1Q8-4 11 2"/><path d="M9-1.6L12.4-3.2L10.4 0.4" fill="none"/>'},
 yosun:{f:'none',sc:'#3d6373',w:1,d:'<path d="M-8 0Q-4-4 0 0Q4 4 8 0"/>'}};
function sym(k,x,y,s,rot){var o=SYM[k];return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+')'+(rot?' rotate('+rot.toFixed(0)+')':'')+' scale('+(s||1).toFixed(2)+')" fill="'+o.f+'" stroke="'+(o.sc||INKC)+'" stroke-width="'+o.w+'" stroke-linejoin="round">'+o.d+'</g>';}
/* Kıyı çizgisi karmaşık, radyo-gürültülü ada silüeti */
function islPath(x,y,rx,ry,seed){var R=prng(seed),n=34,p=[],i,a,k1=1+Math.floor(R()*2),k2=3+R()*2,k3=7+R()*4,ph1=R()*6.283,ph2=R()*6.283,ph3=R()*6.283,w;
 for(i=0;i<n;i++){a=i/n*6.283;
   w=1+Math.sin(a*k1+ph1)*0.21+Math.sin(a*k2+ph2)*0.13+Math.sin(a*k3+ph3)*0.075+(R()-0.5)*0.1;
   p.push([x+Math.cos(a)*rx*w,y+Math.sin(a)*ry*w]);}
 return p;}
function island(x,y,rx,ry,seed,nm,ly){
 var R=prng(seed+7777),p=islPath(x,y,rx,ry,seed),pi=islPath(x,y,rx*0.8,ry*0.8,seed),d=vl(p,true),g='',i,a,q,rr;
 g+='<path d="'+d+'" fill="none" stroke="'+COASTC+'" stroke-width="5" opacity=".12" stroke-linejoin="round"/>';
 for(i=0;i<16;i++){a=i/16*6.283+R()*0.24;rr=1.22+R()*0.3;
   q=[x+Math.cos(a)*rx*rr,y+Math.sin(a)*ry*rr];
   g+='<path d="M'+(q[0]-5).toFixed(1)+' '+q[1].toFixed(1)+'Q'+q[0].toFixed(1)+' '+(q[1]-3.4).toFixed(1)+' '+(q[0]+5).toFixed(1)+' '+q[1].toFixed(1)+'" fill="none" stroke="'+RHUMB+'" stroke-width=".8" opacity=".5"/>';}
 g+='<path d="'+d+'" fill="'+PAPC+'" stroke="'+COASTC+'" stroke-width="1.5" stroke-linejoin="round"/>';
 g+='<path d="'+vl(pi,true)+'" fill="none" stroke="'+COASTC+'" stroke-width=".7" opacity=".45"/>';
 var ps=[],tr=0,pp;
 for(i=0;i<(rx>18?3:1);i++){tr=0;
   while(tr++<120){pp=[x-rx+R()*rx*2,y-ry+R()*ry*2];if(inPoly(p,pp[0],pp[1]))break;}
   if(inPoly(p,pp[0],pp[1]))ps.push(pp);}
 for(i=0;i<ps.length;i++)g+=sym(R()>0.45?'agac':'tepe',ps[i][0],ps[i][1]-ry*0.15,0.45+R()*0.28,0);
 if(nm)g+='<text class="vname" x="'+x+'" y="'+(y+ly)+'" text-anchor="middle" font-family="var(--f-display)" font-style="italic" font-size="8.2" fill="'+INKC2+'">'+nm+'</text>';
 return g;}
var MSTYLE=[
 {big:'kar',bn:8,sm:'agac',sn:5},
 {big:'agac',bn:13,sm:'tepe',sn:4},
 {big:'dag',bn:8,sm:'mag',sn:2},
 {big:'dag',bn:13,sm:'kar',sn:4},
 {big:'tepe',bn:6,sm:'dag',sn:5},
 {big:'kum',bn:9,sm:'tepe',sn:3},
 {big:'agac',bn:5,sm:'tepe',sn:4},
 {big:'tepe',bn:7,sm:'tarla',sn:5},
 {big:'tarla',bn:9,sm:'agac',sn:4}];
var VILLAGE=['Arıklı','Çamdibi','Taşpınar','Kurucaova','Yumaklı','Eğrice','Sorgun','Kavaklı','İkizce','Dereağzı','Yellice','Gölova','Sarıkeçili','Üçgöz','Bağlıca','Alpınar','Demirci','Kızılca'];
var BAY=['Koy','İskele','Limanı'];
var ART=null,SEAART=null,ROSE=[548,66];
function cenOf(P){var a=0,x=0,y=0,i,j,p,q,cr;for(i=0;i<P.length;i++){j=(i+1)%P.length;p=P[i];q=P[j];cr=p[0]*q[1]-q[0]*p[1];a+=cr;x+=(p[0]+q[0])*cr;y+=(p[1]+q[1])*cr;}a*=0.5;if(!a)return[P[0][0],P[0][1]];return[x/(6*a),y/(6*a)];}
/* Kale yerlesimini cozen ceza puani: sinir, yildiz, bolge adi, diger kaleler ve savrulma. */
function sfBad(t,x,y,anc,me){
 var o=0,i,d,nx,ny,ds=distP(t.poly,x,y);
 o+=inPoly(t.poly,x,y)?Math.max(0,9-ds)*2.4:(ds+9)*5;
 o+=Math.max(0,22-Math.hypot(x-t.cx,y-(t.cy-CAPDY)))*2.6;
 nx=Math.abs(x-t.cx);ny=Math.abs(y-(t.cy+6));
 if(nx<48&&ny<17)o+=Math.min(48-nx,17-ny)*2.6;
 for(i=0;i<12;i++){if(i===me)continue;d=Math.hypot(x-t.F[i][0],y-t.F[i][1]);o+=d<0.05?60:Math.max(0,17-d)*2.4;}
 return o+Math.hypot(x-anc[0],y-anc[1])*0.07;
}
function spaceForts(t){
 var a=[],i,j,k,q,s,p,bx,by,bd,bp,x,y,mv=0;
 var D=[[1,0],[-1,0],[0,1],[0,-1],[.71,.71],[-.71,.71],[.71,-.71],[-.71,-.71]];
 var RS=[5,3.2,2,1.2,0.7,0.4];
 for(i=0;i<12;i++)a.push([t.F[i][0],t.F[i][1]]);
 for(k=0;k<RS.length;k++){
  for(j=0;j<18;j++){mv=0;
   for(i=0;i<12;i++){
    p=t.F[i];bx=p[0];by=p[1];bd=sfBad(t,p[0],p[1],a[i],i);
    for(q=0;q<8;q++)for(s=1;s<=2;s++){
     x=p[0]+D[q][0]*RS[k]*s;y=p[1]+D[q][1]*RS[k]*s;
     bp=sfBad(t,x,y,a[i],i);
     if(bp<bd-0.001){bd=bp;bx=x;by=y;}
    }
    if(bx!==p[0]||by!==p[1]){t.F[i]=[bx,by];mv++;}
   }
   if(!mv)break;}
 }
}
var TERR=[],LAND=[];
(function(){
 var i,r,c,k,e,j;
 for(r=0;r<3;r++)for(c=0;c<3;c++){i=r*3+c;
  var poly=cj([HE[r][c],VE[r][c+1],rp(HE[r+1][c]),rp(VE[r][c])]),ar=cenOf(poly),b=[1e9,-1e9,1e9,-1e9];
  for(k=0;k<poly.length;k++){var p=poly[k];if(p[0]<b[0])b[0]=p[0];if(p[0]>b[1])b[1]=p[0];if(p[1]<b[2])b[2]=p[1];if(p[1]>b[3])b[3]=p[1];}
  var t={poly:poly,cx:ar[0],cy:ar[1],r:r,c:c,b:b,E:[HE[r][c],VE[r][c+1],rp(HE[r+1][c]),rp(VE[r][c])],F:[]};
  for(e=0;e<4;e++)for(j=0;j<3;j++){var q=ept(t.E[e],0.2+0.3*j);t.F.push([q[0]+(t.cx-q[0])*0.22,q[1]+(t.cy-q[1])*0.22]);}
  spaceForts(t);
  TERR[i]=t;}
 LAND=cj([HE[0][0],HE[0][1],HE[0][2],VE[0][3],VE[1][3],VE[2][3],rp(HE[3][2]),rp(HE[3][1]),rp(HE[3][0]),rp(VE[2][0]),rp(VE[1][0]),rp(VE[0][0])]);
})();
function scatter(t,R,n,minB,mind,avoid,lab){
 var out=[],tries=0,b=t.b,x,y,i,ok,lx,ly,ty,by;
 while(out.length<n&&tries<n*(lab?600:80)){tries++;
  x=b[0]+R()*(b[1]-b[0]);
  if(lab){ty=b[2]+minB;by=b[3]-minB;
    if(t.cy-19>ty&&by>t.cy+25)y=R()<0.5?ty+R()*(t.cy-19-ty):t.cy+25+R()*(by-t.cy-25);
    else if(t.cy-19>ty)y=ty+R()*(t.cy-19-ty);
    else if(by>t.cy+25)y=t.cy+25+R()*(by-t.cy-25);
    else continue;}
  else y=b[2]+R()*(b[3]-b[2]);
  if(!inPoly(t.poly,x,y))continue;
  if(distP(t.poly,x,y)<minB)continue;
  if(Math.abs(x-t.cx)<72&&Math.abs(y-(t.cy+3))<21)continue;
  if(Math.abs(x-t.cx)<16&&Math.abs(y-(t.cy-CAPDY))<16)continue;
  ok=true;
  for(i=0;i<t.F.length;i++)if(Math.abs(x-t.F[i][0])<15&&Math.abs(y-t.F[i][1])<15){ok=false;break;}
  if(ok&&lab)for(i=0;i<t.F.length;i++){lx=t.F[i][0];ly=t.F[i][1];
    if(lx>x-9&&lx<x+38&&Math.abs(ly-y-3)<8.5){ok=false;break;}}
  if(ok&&lab&&t.cx>x-9&&t.cx<x+46&&Math.abs((t.cy-CAPDY)-(y+2))<18)ok=false;
  if(ok&&lab&&(!inPoly(t.poly,x+34,y-3)||!inPoly(t.poly,x+34,y+5)))ok=false;
  if(ok)for(i=0;i<out.length;i++)if(Math.abs(out[i][0]-x)<mind&&Math.abs(out[i][1]-y)<mind){ok=false;break;}
  if(ok&&avoid)for(i=0;i<avoid.length;i++)if(distP(avoid[i],x,y)<11){ok=false;break;}
  if(!ok)continue;
  out.push([x,y,R()]);}
 return out;}
function riverOf(t,R,e){var A=scatter(t,R,1,16,0,[])[0];if(!A)return null;
 var B=ept(t.E[e],0.18+R()*0.64),dx=B[0]-A[0],dy=B[1]-A[1],L=Math.sqrt(dx*dx+dy*dy)||1,nx=-dy/L,ny=dx/L,ph=R()*6.283,out=[],i,n=18;
 for(i=0;i<=n;i++){var f=i/n,env=Math.sin(Math.PI*Math.min(1,f*1.05))*Math.min(9,L*0.1),w=Math.sin(f*4.6+ph)*0.72+Math.sin(f*9.3+ph*2)*0.3;
   out.push([A[0]+dx*f+nx*env*w,A[1]+dy*f+ny*env*w]);}
 return out;}
function regionArt(idx){
 var t=TERR[idx],R=prng(7000+idx*911),out='',riv=[],st=MSTYLE[idx],i,p,s,rot;
 var ce=[];if(t.r===0)ce.push(0);if(t.c===2)ce.push(1);if(t.r===2)ce.push(2);if(t.c===0)ce.push(3);
 if(!ce.length)ce=[0,1,2,3];
 for(i=0;i<1;i++){var rv=riverOf(t,R,ce[Math.floor(R()*ce.length)]);if(rv){riv.push(rv);out+='<path d="'+vl(rv,0)+'" fill="none" stroke="'+RIVC+'" stroke-width="1.3" stroke-linecap="round" opacity=".75"/>';
   var m=rv[Math.floor(rv.length*0.55)];
   out+='<path d="M'+m[0].toFixed(1)+' '+m[1].toFixed(1)+'Q'+(m[0]+14).toFixed(1)+' '+(m[1]-11).toFixed(1)+' '+(m[0]+6).toFixed(1)+' '+(m[1]-22).toFixed(1)+'" fill="none" stroke="'+RIVC+'" stroke-width=".9" opacity=".5"/>';}}
 if(idx===1||idx===4||idx===8){var g=scatter(t,R,1,14,0,riv)[0];if(g){out+=sym('gol',g[0],g[1],0.7+R()*0.3,0);
   var lb=g[1]+16,la=g[1]-13,near=function(yy){return Math.abs(g[0]-t.cx)<78&&Math.abs(yy-(t.cy+2))<26;},
   hitF=function(yy){for(var z=0;z<t.F.length;z++)if(Math.abs(t.F[z][0]-g[0])<30&&Math.abs(t.F[z][1]-yy)<10)return true;return false;},
   ly=(near(lb)||hitF(lb))?(near(la)||hitF(la)?-1:la):lb;
   if(ly>0&&inPoly(t.poly,g[0],ly-4))out+='<text class="vname" x="'+g[0].toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle" font-family="var(--f-display)" font-style="italic" font-size="8" fill="'+INKC2+'">'+(idx===4?'Kızıl Göl':'Ak Göl')+'</text>';}}
 p=scatter(t,R,st.bn,t.big==='agac'?13:15,t.big==='dag'?26:18,riv);
 for(i=0;i<p.length;i++)out+=sym(st.big,p[i][0],p[i][1],0.72+p[i][2]*0.3,(st.big==='dag'||st.big==='tepe')?0:(p[i][2]*20-10));
 p=scatter(t,R,st.sn,11,15,riv);
 for(i=0;i<p.length;i++)out+=sym(st.sm,p[i][0],p[i][1],0.7+p[i][2]*0.3,0);
 p=scatter(t,R,2,13,42,riv,true);
 for(i=0;i<p.length;i++){out+=sym('ev',p[i][0],p[i][1],1.05,0);
   out+='<text class="vname" x="'+(p[i][0]+8).toFixed(1)+'" y="'+(p[i][1]+3.6).toFixed(1)+'" font-family="var(--f-display)" font-style="italic" font-size="7.8" fill="'+INKC2+'">'+VILLAGE[(idx*2+i)%VILLAGE.length]+'</text>';}
 return out;}
function coastLabels(){var g='',ids=[6,2],k,idx,t,m2,ox,oy,ol,cx2=0,cy2=0,f2,ok2;
 for(k=0;k<ids.length;k++){idx=ids[k];t=TERR[idx];m2=ept(t.E[idx===6?3:0],0.5);
   ox=m2[0]-t.cx;oy=m2[1]-t.cy;ol=Math.sqrt(ox*ox+oy*oy)||1;ox/=ol;oy/=ol;ok2=false;
   for(f2=14;f2<=64&&!ok2;f2+=6){cx2=m2[0]+ox*f2;cy2=m2[1]+oy*f2;
     if(cx2<34||cx2>566||cy2<22||cy2>398)continue;
     if(!inPoly(LAND,cx2,cy2))ok2=true;}
   if(ok2)g+='<text class="capn" x="'+cx2.toFixed(1)+'" y="'+(cy2+3).toFixed(1)+'" text-anchor="middle" font-family="var(--f-map)" font-size="8" letter-spacing="1.4" fill="#33586a" opacity=".92">'+(idx===6?'LIMAN':'MADEN')+'</text>';}
 return g;}
function roseSvg(){
 var cx=ROSE[0],cy=ROSE[1],r=30,d='',i,a,b,px,py,wx,wy,ex,ey;
 d+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(r+9)+'" fill="'+PAPC+'" fill-opacity=".8" stroke="'+INKC+'" stroke-width="1.4"/>';
 d+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(r+3)+'" fill="none" stroke="'+INKC+'" stroke-width=".8" opacity=".55"/>';
 for(i=0;i<4;i++){a=Math.PI/4+i*Math.PI/2;
   d+='<path d="M'+cx+' '+cy+'L'+(cx+Math.cos(a)*r*0.74).toFixed(1)+' '+(cy+Math.sin(a)*r*0.74).toFixed(1)+'" stroke="'+INKC2+'" stroke-width="1.5" opacity=".8"/>';}
 for(i=0;i<4;i++){b=-Math.PI/2+i*Math.PI/2;
   px=cx+Math.cos(b)*r;py=cy+Math.sin(b)*r;
   wx=cx+Math.cos(b+Math.PI/2)*r*0.24;wy=cy+Math.sin(b+Math.PI/2)*r*0.24;
   ex=cx+Math.cos(b-Math.PI/2)*r*0.24;ey=cy+Math.sin(b-Math.PI/2)*r*0.24;
   d+='<path d="M'+wx.toFixed(1)+' '+wy.toFixed(1)+'L'+px.toFixed(1)+' '+py.toFixed(1)+'L'+cx+' '+cy+'Z" fill="'+INKC+'" opacity=".85"/>';
   d+='<path d="M'+ex.toFixed(1)+' '+ey.toFixed(1)+'L'+px.toFixed(1)+' '+py.toFixed(1)+'L'+cx+' '+cy+'Z" fill="'+PAPC2+'" stroke="'+INKC+'" stroke-width=".6"/>';}
 d+='<circle cx="'+cx+'" cy="'+cy+'" r="3.2" fill="'+INKC+'"/>';
 d+='<text x="'+cx+'" y="'+(cy-r-12)+'" text-anchor="middle" font-family="var(--f-map)" font-size="13" fill="'+INKC+'">K</text>';
 return '<g pointer-events="none">'+d+'</g>';}
function seaArt(){
 if(SEAART)return SEAART;
 var R=prng(31337),g='',i,a,L;
 for(i=0;i<16;i++){a=i*Math.PI/8;L=620;
   g+='<line x1="'+ROSE[0]+'" y1="'+ROSE[1]+'" x2="'+(ROSE[0]+Math.cos(a)*L).toFixed(1)+'" y2="'+(ROSE[1]+Math.sin(a)*L).toFixed(1)+'" stroke="'+RHUMB+'" stroke-width=".7" opacity=".22"/>';}
 for(i=0;i<34;i++){var x=R()*600,y=R()*420;
   if(inPoly(LAND,x,y))continue;
   g+=sym('yosun',x,y,0.8+R()*0.5,R()*14-7);}
 g+=sym('gemi',300,42,1.15,0)+sym('gemi',168,48,1,6);
 g+=sym('canavar',100,74,1.25,-8);
 g+='<text x="268" y="26" text-anchor="middle" font-family="var(--f-map)" font-size="13" letter-spacing="5" fill="#33586a" opacity=".95">BORA DENİZİ</text>';
 g+='<text x="30" y="212" text-anchor="middle" font-family="var(--f-map)" font-size="10" letter-spacing="3" fill="#33586a" opacity=".9" transform="rotate(-90 30 212)">BATI DENİZİ</text>';
 g+='<text x="300" y="414" text-anchor="middle" font-family="var(--f-map)" font-size="10" letter-spacing="3" fill="#33586a" opacity=".9">TUZLU DENİZ</text>';
 g+=island(472,44,25,11,5501,'Karga Adası',26);
 g+=island(52,40,21,10,7712,'Üç Kayı Adaları',25);
 g+=island(34,78,11,6,9134,'',0);
 g+=island(560,392,15,7,3388,'Tuz Adası',18);
 g+=roseSvg();
 SEAART=g;return g;}
function landArt(){
 if(ART)return ART;
 var g='',i;
 g+='<rect width="600" height="420" fill="'+SEAC+'" opacity=".82"/>';
 var R=prng(4242);
 for(i=0;i<7;i++){var x=R()*600,y=R()*420,rr=16+R()*38;
   g+='<ellipse cx="'+x.toFixed(0)+'" cy="'+y.toFixed(0)+'" rx="'+rr.toFixed(0)+'" ry="'+(rr*0.6).toFixed(0)+'" fill="#b79a63" opacity="'+(0.05+R()*0.07).toFixed(2)+'"/>';}
 g+=seaArt();
 g+='<defs><clipPath id="landc"><path d="'+vl(LAND,true)+'"/></clipPath>';
 for(i=0;i<9;i++)g+='<clipPath id="tc'+i+'"><path d="'+vl(TERR[i].poly,true)+'"/></clipPath>';
 g+='<pattern id="fiber" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><path d="M0 1.5H8M0 5H8" stroke="#c3ab7d" stroke-width=".5" opacity=".45"/></pattern></defs>';
 g+='<path d="'+vl(LAND,true)+'" fill="'+PAPC+'"/>';
 g+='<path d="'+vl(LAND,true)+'" fill="#7fa8ae" opacity=".3" stroke="#7fa8ae" stroke-width="13" clip-path="url(#landc)"/>';
 g+='<g clip-path="url(#landc)">'+roads()+terrainAll()+'</g>';
 g+='<path d="'+vl(LAND,true)+'" fill="none" stroke="'+COASTC+'" stroke-width="1.8" stroke-linejoin="round"/>';
 g+='<path d="'+vl(LAND,true)+'" fill="none" stroke="'+COASTC+'" stroke-width="4" opacity=".18"/>'+coastLabels();
 g+='<rect width="600" height="420" fill="url(#fiber)" opacity=".3" pointer-events="none"/>';
 g+='<rect x="1.5" y="1.5" width="597" height="417" fill="none" stroke="#6d5636" stroke-width="3" opacity=".55"/><rect x="8" y="8" width="584" height="404" fill="none" stroke="#6d5636" stroke-width="1" opacity=".4"/>';
 ART=g;return g;}
function terrainAll(){var g='',i;for(i=0;i<9;i++)g+='<g clip-path="url(#tc'+i+')" pointer-events="none">'+regionArt(i)+'</g>';return g;}
function roads(){
 var pairs=[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[3,6],[1,4],[4,7],[2,5],[5,8]],g='',i;
 for(i=0;i<pairs.length;i++){var a=TERR[pairs[i][0]],b=TERR[pairs[i][1]],mx=(a.cx+b.cx)/2,my=(a.cy+b.cy)/2,dx=b.cx-a.cx,dy=b.cy-a.cy,L=Math.sqrt(dx*dx+dy*dy)||1;
   mx+=-dy/L*11;my+=dx/L*11;
   g+='<path d="M'+a.cx.toFixed(1)+' '+a.cy.toFixed(1)+'Q'+mx.toFixed(1)+' '+my.toFixed(1)+' '+b.cx.toFixed(1)+' '+b.cy.toFixed(1)+'" fill="none" stroke="#8a6a34" stroke-width="1" stroke-dasharray="5 5" opacity=".42"/>';}
 return g;}
/* ---------- Çizim ---------- */
/* Seçili kalenin/başkentin adını harita üstünde gösteren etiket kutusu */
function selCallout(){
  if(!S.sel||S.phase!=='play'||S.adv||S.battle)return '';
  var st=S.sel.state,k=S.sel.k,t=TERR[st],own=ownerOf(S,st,k),mine=own===S.region,l1,l2,mx,my;
  if(k>=0){mx=t.F[k][0];my=t.F[k][1];l1=fortName(st,k);}
  else{mx=t.cx;my=t.cy-CAPDY;l1='★ '+capName(st);}
  l2=mine?(k>=0?'senin kalen · içine gir':'başkentin · içine gir')
        :REGIONS[own].n+' · ~'+fmt(garrison(S,st,k))+' asker';
  var w=Math.max(l1.length*6.4,l2.length*5.4)+16,h=31,bx=mx+14,flip=false;
  if(bx+w>592){bx=mx-14-w;flip=true;}
  if(bx<8)bx=8;
  var by=Math.max(6,Math.min(420-h-6,my-h/2)),ax=flip?bx+w:bx,ay=Math.max(by+8,Math.min(by+h-8,my));
  var g='<g'+(mine?' data-act="enter" tabindex="0" role="button" aria-label="'+esc(l1)+' içine gir"':'')+' pointer-events="'+(mine?'auto':'none')+'">';
  g+='<line x1="'+mx.toFixed(1)+'" y1="'+my.toFixed(1)+'" x2="'+ax.toFixed(1)+'" y2="'+ay.toFixed(1)+'" stroke="'+INKC+'" stroke-width="1" opacity=".6"/>';
  g+='<rect x="'+bx.toFixed(1)+'" y="'+by.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h+'" rx="3" fill="'+PAPC+'" fill-opacity=".96" stroke="'+INKC+'" stroke-width="1.2"/>';
  g+='<text x="'+(bx+8).toFixed(1)+'" y="'+(by+14).toFixed(1)+'" style="font-family:var(--f-display);font-weight:600;font-size:11px" fill="'+INKC+'">'+esc(l1)+'</text>';
  g+='<text x="'+(bx+8).toFixed(1)+'" y="'+(by+26).toFixed(1)+'" style="font-family:var(--f-mono);font-size:8.8px" fill="'+(mine?INKC2:INKC)+'">'+esc(l2)+'</text>';
  return g+'</g>';
}
function renderMap(){
  var svg=document.getElementById('map'),i,r,c;svg.classList.remove('busy');svg.classList.add('medmap');
  svg.setAttribute('viewBox','0 0 600 420');
  var g=landArt();
  var nearSet=S.phase!=='setup'&&S.region!==null?realmNeighbors(S):[];
  for(r=0;r<3;r++)for(c=0;c<3;c++){
    var idx=r*3+c,t=TERR[idx],pts=plg(t.poly),cx=t.cx,cy=t.cy;
    var cls='region',own=S.phase!=='setup'&&S.region===idx,ann=S.phase!=='setup'&&annexed(S,idx),held=0;
    if(S.phase!=='setup'&&S.forts)for(var fk=0;fk<NF;fk++)if(S.forts[idx*NF+fk]===S.region)held++;
    var co=S.phase!=='setup'?ctl(S,idx):idx,gone=!own&&!ann&&co!==idx;
    if(own||ann)cls+=' own';
    if(gone)cls+=' gone';
    if(S.phase==='setup'&&S.pick===idx)cls+=' pick';
    if(nearSet.indexOf(idx)>=0)cls+=' near';
    if(S.phase==='play'&&S.hot&&S.hot.indexOf(idx)>=0)cls+=' hot';
    if(S.phase!=='setup'&&S.allies&&isAlly(S,idx))cls+=' ally';
    var sub='';
    if(own)sub=REGIONS[idx].n;
    else if(ann)sub='fethedildi';
    else if(gone)sub=esc(REGIONS[co].n)+' aldı';
    else if(S.phase!=='setup')sub=(isAlly(S,idx)?'müttefik · ':'')+(held?fmt(held)+' kale senin':'güç '+fmt(S.strengths[idx]));
    g+='<g class="'+cls+'" data-act="region" data-i="'+idx+'" tabindex="0" role="button" aria-label="'+REGIONS[idx].n+'">'+
       '<polygon points="'+pts+'" fill="var('+COLORS[gone?co:idx]+')"/>'+
       '<text class="rname" x="'+cx+'" y="'+(cy+4)+'" style="font-size:'+nfs(own?cname(S):REGIONS[idx].n)+'px">'+(ann||gone?'':esc(own?cname(S):REGIONS[idx].n))+'</text>'+
       (sub?'<text class="rsub" x="'+cx+'" y="'+(cy+18)+'">'+sub+'</text>':'')+markers(idx,cx,cy,t)+'</g>';
  }
  g+='<g pointer-events="none"><rect x="14" y="12" width="156" height="36" fill="'+PAPC+'" fill-opacity=".85" stroke="'+INKC+'" stroke-width="1.2"/>'+
     '<text class="scale" x="26" y="28">0</text><text class="scale" x="158" y="28" text-anchor="end">60 fersah</text>';
  for(i=0;i<4;i++)g+='<rect x="'+(26+i*33)+'" y="33" width="33" height="6" fill="'+(i%2?PAPC:INKC)+'" stroke="'+INKC+'" stroke-width=".9"/>';
  g+='</g>'+selCallout();
  svg.innerHTML=g;
}
var GCOL=['#a3742a','#2f6b4c','#8c2f2a','#3a5a8c'];
function cen(i){var t=TERR[i];return [t.cx,t.cy,t.poly];}
function allyGroups(s){var out=[],seen={};for(var i=0;i<9;i++){if(!aiAlive(s,i)||seen[i])continue;var g=aiGroup(s,i);g.forEach(function(m){seen[m]=1;});out.push(g.sort(function(a,b){return a-b;}));}return out;}
function joinChance(s,ms){var p=0;ms.forEach(function(m){p+=Math.min(0.95,Math.max(0.05,AIPERS[m].ally*(0.5+s.rel[m]/100)));});return ms.length?p/ms.length:0;}
function joinWhy(s,ms){
  var add=ms.filter(function(m){return !isAlly(s,m);}),cost=ms.length>1?80:60,key=ms.join('-');
  if(!add.length)return 'Zaten müttefiksin.';
  var w=ms.filter(function(m){return s.warWith[m];});if(w.length)return REGIONS[w[0]].n+' ile savaştasın.';
  if(s.allies.length+add.length>2)return 'Yer yok: ittifakta sen dahil en fazla 3 üye olur (şu an müttefiklerin: '+s.allies.length+').';
  if(s.joinTry&&s.joinTry[key]===s.turn)return 'Bu dönem denedin, bir sonraki dönemi bekle.';
  if(s.gold<cost)return 'Altın yetmiyor ('+cost+' gerekir).';
  return '';
}
function renderAllyMap(){
  var svg=document.getElementById('map'),g='',i,gr=allyGroups(S),col={},let_={},n=0;
  svg.classList.remove('busy');svg.classList.add('medmap');svg.setAttribute('viewBox','0 0 600 420');
  gr.forEach(function(m){if(m.length>1){var c=GCOL[n%4],l=String.fromCharCode(65+n);n++;m.forEach(function(x){col[x]=c;let_[x]=l;});}});
  col[S.region]='#8c2f2a';let_[S.region]='★';S.allies.forEach(function(x){col[x]='#8c2f2a';let_[x]='★';});
  g=landArt();
  for(i=0;i<9;i++){var c=cen(i);g+='<polygon points="'+plg(c[2])+'" fill="var('+COLORS[i]+')" fill-opacity=".5" stroke="'+(col[i]||'none')+'" stroke-width="'+(col[i]?3:0)+'" stroke-dasharray="'+(col[i]?'none':'7 4')+'"/>';}
  var lines=[];(S.aiAlly||[]).forEach(function(p){if(aiAlive(S,p[0])&&aiAlive(S,p[1]))lines.push([p[0],p[1],col[p[0]]]);});
  S.allies.forEach(function(a){lines.push([S.region,a,'#8c2f2a']);});
  lines.forEach(function(l){var a=cen(l[0]),b=cen(l[1]);g+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+l[2]+'" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>';});
  for(i=0;i<9;i++){
    var cc=cen(i),own=i===S.region,ann=annexed(S,i),nm=own?cname(S):REGIONS[i].n,sub=own?('⚔ '+fmt(S.soldiers)+' asker'):(ann?'fethedildi':'⚔ '+fmt(S.strengths[i])+' asker');
    g+='<g pointer-events="none"><text class="rname" x="'+cc[0]+'" y="'+(cc[1]+4)+'" style="font-size:'+nfs(nm)+'px">'+(ann?'':esc(nm))+'</text><text class="rsub" x="'+cc[0]+'" y="'+(cc[1]+18)+'">'+sub+'</text>'+
      (let_[i]?'<circle cx="'+cc[0]+'" cy="'+(cc[1]-20)+'" r="11" fill="'+col[i]+'"/><text class="badge" x="'+cc[0]+'" y="'+(cc[1]-16)+'" text-anchor="middle" fill="#f4e6c4">'+let_[i]+'</text>':'')+'</g>';
  }
  svg.innerHTML=g;
}
function renderBattleMap(){
  var b=S.battle,svg=document.getElementById('map'),g='',x,y;
  svg.classList.remove('medmap');
  svg.setAttribute('viewBox','0 0 '+BW*CS+' '+BH*CS);
  g+='<rect x="0" y="0" width="'+BW*CS+'" height="'+BH*CS+'" fill="var(--sea)"/>';
  for(y=0;y<BH;y++)for(x=0;x<BW;x++){
    var z=(b.phase==='place'&&x<PZ)?' zone':'';
    g+='<rect class="cell'+z+'" data-act="bcell" data-x="'+x+'" data-y="'+y+'" x="'+x*CS+'" y="'+y*CS+'" width="'+CS+'" height="'+CS+'"/>';
  }
  b.units.forEach(function(u){
    if(u.n<=0)return;
    var px=u.x*CS+3,py=u.y*CS+3,w=CS-6,hp=Math.max(0,u.n/u.max);
    g+='<g class="unit '+u.side+(b.sel===u.id?' sel':'')+'" data-act="bunit" data-id="'+u.id+'">'+
      '<rect class="body" x="'+px+'" y="'+py+'" width="'+w+'" height="'+w+'" rx="4"/>'+
      '<text class="ut" x="'+(px+w/2)+'" y="'+(py+16)+'">'+TY[u.t].t+(u.o==='adv'?' ▶':(u.o==='chg'?' ⚔':' ▪'))+'</text>'+
      '<text class="un" x="'+(px+w/2)+'" y="'+(py+28)+'">'+fmt(u.n)+'</text>'+
      '<rect x="'+px+'" y="'+(py+w-3)+'" width="'+(w*hp)+'" height="3" fill="var(--good)" pointer-events="none"/></g>';
  });
  svg.innerHTML=g;
}
