/* ============================================================
   data.js — OYUNUN İÇERİĞİ (sadece veri, içinde kod yok)
   Yeni bölge, bina, gelişim dalı, olay, ölüm sebebi veya yardım
   metni eklemek isteyen bir tek burada değişiklik yapar.
   ============================================================ */
var KEY='uc-yil-v10',intro=true,statsOpen=false,mapOnly=false,mercOpen=false,amap=false;
var REGIONS=[
 {n:'Kuzey Krallığı',fert:0.82,trade:0.9,def:1.0,pow:1.15,sat:0,grow:0,wood:1,mine:1,coast:0.8,str:1,aggr:1.1,t:'Buzlu ovalar; sert kış, sert askerler.',pro:'Askerler %15 daha güçlü',con:'Soğuk yüzünden tarım zayıf (×0,82)'},
 {n:'Orman Krallığı',fert:1.0,trade:0.8,def:1.0,pow:1,sat:0,grow:0,wood:2,mine:1,coast:0.8,str:1,aggr:0.9,t:'Sık ormanlar, uzak yollar.',pro:'Odun üretimi 2 kat',con:'Ticaret zayıf (×0,8)'},
 {n:'Yer Altı Devleti',fert:0.85,trade:0.85,def:1.15,pow:1,sat:-3,grow:0,wood:1,mine:1.8,coast:0.3,str:1,aggr:1,t:'Mağara şehirleri, derin madenler, güneşsiz günler.',pro:'Taş ve demir 1,8 kat · savunma ×1,15',con:'Halk mutsuz (−3 memnuniyet/dönem) · tarım ×0,85'},
 {n:'Dağların Efendileri',fert:0.85,trade:0.85,def:1.35,pow:1,sat:0,grow:0,wood:1,mine:1.3,coast:0.5,str:1,aggr:1.7,t:'Aşılmaz geçitler ve yüksek kaleler.',pro:'Savunma ×1,35 · taş ve demir 1,3 kat',con:'Tarım ve ticaret zayıf'},
 {n:'Kızılkale',fert:0.9,trade:0.9,def:1.0,pow:1.25,sat:-2,grow:0,wood:1,mine:1,coast:0,str:1.25,aggr:1.4,t:'Savaşçı merkez. Herkesle komşu, herkesle sınır.',pro:'Ordu %25 daha güçlü',con:'Her devletle komşu (herkes saldırabilir) · −2 memnuniyet/dönem · denize kıyı yok'},
 {n:'Çöl Devleti',fert:0.8,trade:1.4,def:0.95,pow:1,sat:0,grow:0,wood:1,mine:1,coast:0.8,str:1,aggr:1,t:'Kervan yollarının durağı, kurak topraklar.',pro:'Ticaret geliri ×1,4',con:'Çok kurak (tarım ×0,8)'},
 {n:'Gümüşkıyı',fert:0.95,trade:1.2,def:0.85,pow:1,sat:0,grow:0,wood:1,mine:1,coast:1.6,str:1,aggr:0.4,t:'Sol alttaki liman devleti.',pro:'Deniz ticareti ve gemiler 1,6 kat · ticaret ×1,2',con:'Kara savunması zayıf (×0,85)'},
 {n:'Bilge Asası',fert:0.95,trade:1.0,def:0.85,pow:0.95,sat:3,grow:0.01,wood:1,mine:1,coast:1,str:0.95,aggr:0.2,t:'Bilginlerin, barışın ve diplomasinin devleti.',pro:'Halk çok mutlu (+3 memnuniyet/dönem), nüfus hızlı artar',con:'Savunması zayıf (×0,85), ordusu biraz zayıf (×0,95)'},
 {n:'Karaova',fert:1.05,trade:0.95,def:0.9,pow:1,sat:0,grow:0,wood:1,mine:1,coast:1,str:0.95,aggr:1,t:'Ortalama, açık bir ova devleti.',pro:'Verimli ovalar (tarım ×1,05)',con:'Açık arazi, savunma zayıf (×0,9)'}
];
var CATS=[
 {k:'tarim',n:'Tarım ve gıda',subs:[
  {k:'tarla',n:'Yeni tarla ve sulama kanalı',d:'Yiyecek üretimi +%15',e:{food:0.15}},
  {k:'depo',n:'Ambar ve depo ağı',d:'Yiyecek üretimi +%8',e:{food:0.08}},
  {k:'bahce',n:'Bağ, bahçe, zeytinlik',d:'Yiyecek +%8, gelir +%5',e:{food:0.08,inc:0.05}},
  {k:'hayvan',n:'Hayvancılık',d:'Yiyecek +%10, gelir +%6',e:{food:0.10,inc:0.06}}]},
 {k:'ticaret',n:'Ticaret ve ekonomi',subs:[
  {k:'han',n:'Pazar yeri ve han',d:'Vergi geliri +%12',e:{inc:0.12}},
  {k:'kervan',n:'Kervan yolları',d:'Vergi geliri +%15',e:{inc:0.15}},
  {k:'atolye',n:'Zanaat atölyeleri',d:'Gelir +%12, savaş gücü +%3',e:{inc:0.12,pow:0.03}},
  {k:'vergi',n:'Para basmak, vergi sistemi',d:'Gelir +%20, memnuniyet −1',e:{inc:0.20,sat:-1}}]},
 {k:'ordu',n:'Ordu ve savunma',subs:[
  {k:'egitim',n:'Asker eğitimi',d:'Savaş gücü +%15',e:{pow:0.15}},
  {k:'silah',n:'Silah yapımı',d:'Savaş gücü +%12',e:{pow:0.12}},
  {k:'surk',n:'Surlar, kule, kale',d:'Savunma +%20',e:{def:0.20}},
  {k:'suvari',n:'Süvari birliği',d:'Savaş gücü +%10',e:{pow:0.10}},
  {k:'gozcu',n:'Casus ve gözcü teşkilatı',d:'Saldırı ihtimali −%8',e:{atk:0.08}}]},
 {k:'deniz',n:'Denizcilik',subs:[
  {k:'gemi',n:'Gemi yapımı',d:'Kıyı geliri +%10 (tekne için liman gerekir)',e:{cinc:0.10}},
  {k:'tersane',n:'Tersane',d:'Kıyı geliri +%8, savaş gücü +%3 (gemi için liman gerekir)',e:{cinc:0.08,pow:0.03}},
  {k:'kesif',n:'Kıyı keşfi, yeni adalar',d:'Dönem başına +12 altın',e:{gold:12}},
  {k:'donanma',n:'Donanma',d:'Savaş gücü +%8, saldırı ihtimali −%5 (gemi için liman gerekir)',e:{pow:0.08,atk:0.05}}]},
 {k:'sehir',n:'Şehir ve altyapı',subs:[
  {k:'ev',n:'Ev, mahalle, yeni köy',d:'Nüfus artışı +%1,5',e:{grow:0.015}},
  {k:'yol',n:'Yol, köprü, su kemeri',d:'Gelir +%6, nüfus artışı +%0,5',e:{inc:0.06,grow:0.005}},
  {k:'hamam',n:'Hamam ve çeşme',d:'Memnuniyet +1',e:{sat:1}},
  {k:'tesvik',n:'Doğum teşviki ve göç',d:'Nüfus artışı +%2',e:{grow:0.02}}]},
 {k:'bilim',n:'Bilim, kültür, din',subs:[
  {k:'medrese',n:'Medrese ve kütüphane',d:'Memnuniyet +1, gelir +%4',e:{sat:1,inc:0.04}},
  {k:'hukuk',n:'Yazı sistemi, hukuk, kanunlar',d:'Memnuniyet +1,5, gelir +%3',e:{sat:1.5,inc:0.03}},
  {k:'tip',n:'Tıp ve hastane',d:'Nüfus artışı +%1',e:{grow:0.01}},
  {k:'ahlak',n:'Ahlak ve din düzeni',d:'Memnuniyet +2',e:{sat:2}},
  {k:'astro',n:'Astronomi ve mühendislik',d:'Yiyecek +%6, savaş gücü +%4',e:{food:0.06,pow:0.04}}]},
 {k:'yonetim',n:'Yönetim ve siyaset',subs:[
  {k:'divan',n:'Divan ve vezirlik',d:'Gelir +%8',e:{inc:0.08}},
  {k:'hazine',n:'Hazine yönetimi',d:'Devlet idare gideri −%10',e:{admin:0.10}},
  {k:'diplo',n:'Diplomasi',d:'Komşu ilişkileri her dönem +2',e:{dip:2}},
  {k:'istihbarat',n:'İstihbarat',d:'Saldırı ihtimali −%6',e:{atk:0.06}}]},
 {k:'maden',n:'Madencilik ve kaynak',subs:[
  {k:'demir',n:'Demir madeni',d:'Savaş gücü +%8',e:{pow:0.08}},
  {k:'tas',n:'Taş ocağı',d:'Savunma +%8',e:{def:0.08}},
  {k:'altin',n:'Altın ve gümüş madeni',d:'Dönem başına +25 altın',e:{gold:25}},
  {k:'orman',n:'Orman ve odun',d:'Gelir +%5',e:{inc:0.05}},
  {k:'yenikay',n:'Yeni kaynak keşfi',d:'Dönem başına +10 altın',e:{gold:10}}]}
];
var BUILDS=[
 {k:'cami',n:'Cami',cost:150,d:'Memnuniyet her dönem +3'},
 {k:'ambar',n:'Ambar',cost:125,d:'Yiyecek üretimi +%10'},
 {k:'pazar',n:'Pazar',cost:175,d:'Vergi geliri +%15'},
 {k:'kisla',n:'Kışla',cost:200,d:'Savaşta hasar +%15, asker alımı daha ucuz'},
 {k:'sur',n:'Sur',cost:225,d:'Savunma +%20'},
 {k:'liman',n:'Liman',cost:250,d:'Kıyı geliri +%20. Sadece denize bakan kalelerde yapılır, başkentlere yapılamaz. Tekne ve gemi üretimi için gerekir.'}
];
var DEVN={};CATS.forEach(function(c){c.subs.forEach(function(u){DEVN[u.k]=u.n;});});
var DIFF={
 kolay:{n:'Basit',pop:450,sol:50,gold:1200,food:1.5,sat:75,str:20,atk:0.06,help:1,t:'Geniş hazine, seyrek saldırı.'},
 kn:{n:'Normal-basit',pop:415,sol:44,gold:1000,food:1.25,sat:70,str:27,atk:0.08,help:0.8333,t:'Rahat bir başlangıç, komşular fazla acele etmez.'},
 normal:{n:'Normal',pop:380,sol:38,gold:800,food:1.0,sat:65,str:34,atk:0.10,help:0.6667,t:'Dengeli başlangıç.'},
 nz:{n:'Normal-zor',pop:340,sol:33,gold:600,food:0.8,sat:60,str:46,atk:0.13,help:0.5,t:'Hazine daralır, komşular belirgin şekilde güçlüdür.'},
 zor:{n:'Zor',pop:300,sol:28,gold:400,food:0.6,sat:55,str:58,atk:0.16,help:0.3333,t:'Dar hazine, güçlü ve sabırsız komşular.'},
 imk:{n:'İmkansız',pop:260,sol:22,gold:250,food:0.4,sat:45,str:80,atk:0.24,help:0.1,t:'Neredeyse hiç para yok, çok güçlü ve acımasız komşular. Müttefikler çok nadir yardım eder.'}
};
var TAX={dusuk:{n:'Düşük',m:0.7,s:3},normal:{n:'Normal',m:1,s:0},yuksek:{n:'Yüksek',m:1.4,s:-5}};
var COLORS=['--r2','--r0','--r9','--r3','--r7','--r1','--r6','--r4','--r8'];
var TY={S:{n:'Süvari',t:'Sü',spd:2,rng:1,atk:1.3},P:{n:'Piyade',t:'Pi',spd:1,rng:1,atk:1.0},O:{n:'Okçu',t:'Ok',spd:1,rng:3,atk:0.8}};
var BW=14,BH=8,CS=40,timer=null,NF=12,CAPREQ=5,CAPREQ_P=3;
var DCOMP={S:30,P:50,O:20},SLOT={S:[3,1],P:[4,3],O:[2,5]},MAXU=6,SPREAD=4,PZ=7;
var ORD=[{k:'hold',n:'Dur',d:'Birlik yerini korur, menziline gireni vurur; menzili dışından vuruluyorsa karşılık vermeye gider.'},{k:'adv',n:'İlerle',d:'Dizilişi bozmadan, grup halinde düşmana yaklaşır.'},{k:'chg',n:'Hücum',d:'Serbest saldırı: her birlik en yakın düşmanına koşar.'}];
var IDX='uc-yil-idx',GK='uc-yil-g-',delAsk=null;
var setupDiff='normal';
var AIPERS=[
 {t:'Tam bir askeri devlet. Güçlü bir komşusuyla ittifak kurar ve ittifakını bozmaz.',w:{ordu:7,maden:1.5},sc:1,aggr:1.2,ally:1,def:1.1,tr:0.7,top:1,pact:0.5,mil:1.3},
 {t:'Kaynakları kıt. Ordu ve verimliliğe yatırır.',w:{ordu:4,tarim:4},sc:0.7,aggr:0.9,ally:1,def:1,tr:0.8,pact:0.6,mil:1},
 {t:'Madene yatırır, madenle ordusunu güçlendirir.',w:{maden:8,ordu:2},sc:1,aggr:1,ally:1,def:1.15,tr:0.8,mineArmy:1,pact:0.6,mil:1},
 {t:'Savaşa meraklı, kıt kaynaklı ordu devleti. İttifak kurması zor (ilişki 60 gerekir).',w:{ordu:8},sc:0.7,aggr:2.5,ally:0.25,def:1.3,tr:0.5,pact:0.15,mil:1.6},
 {t:'Savaşçı merkez. Orduya ve diplomasiye yatırır, çok komşusu olduğu için ticaret yapar ve topraklarını korur.',w:{ordu:5,yonetim:3,ticaret:3},sc:1,aggr:1.6,ally:1.5,def:1.25,tr:1.5,pact:0.4,mil:1.4},
 {t:'Ticarete ve biraz orduya yatırır, ortalamanın üstünde askeri güç.',w:{ticaret:5,ordu:3.5},sc:1,aggr:1,ally:1,def:1,tr:2,pact:0.7,mil:1},
 {t:'Barışçıl tüccar. Ticarete oynar, halkıyla iyi geçinir, savunmadan yanadır.',w:{ticaret:7,deniz:3,yonetim:2,ordu:0.5},sc:1,aggr:0.15,ally:2,def:1,tr:2.5,pact:0.95,mil:0.6},
 {t:'Bilge ve barışçıl. Bilime, yönetime ve diplomasiye yatırır, halkını mutlu tutar.',w:{bilim:8,yonetim:5,sehir:2,tarim:1,ordu:0.3},sc:1.25,aggr:0.2,ally:1.8,def:0.9,tr:1.5,pact:0.95,mil:0.5},
 {t:'Ortalama davranır.',w:{},sc:1,aggr:1,ally:1,def:1,tr:1,pact:0.6,mil:1}
];
var AIDEV=[{k:'ordu',n:'Ordu',g:0.045},{k:'tarim',n:'Tarım',g:0.012},{k:'ticaret',n:'Ticaret',g:0.015},{k:'deniz',n:'Denizcilik',g:0.01},{k:'sehir',n:'Şehir',g:0.012},{k:'bilim',n:'Bilim',g:0.01},{k:'yonetim',n:'Yönetim',g:0.012},{k:'maden',n:'Madencilik',g:0.018}];
var FA=['Kartal','Şahin','Kurt','Aslan','Boğa','Ejder','Yıldız','Ay','Gün','Demir','Taş','Çelik','Kızıl','Gümüş','Altın','Kara','Ak','Mavi','Yeşil','Buz','Ateş','Rüzgâr','Gölge','Işık','Pusu','Nöbet','Sınır','Geçit'],FB=['Burcu','Kalesi','Hisarı','Kulesi','Geçidi'],CAPN=['Buzkent','Ormankent','Derinşehir','Zirvekale','Kızılşehir','Kumhan','Limankent','Yeşilşehir','Karaşehir'];
var EVENTS=[
 {t:'Bereketli bir hasat yılı geçti.',food:1.15},
 {t:'Kuraklık ekinleri kavurdu.',food:0.75},
 {t:'Salgın köyleri vurdu.',pop:0.94,sat:-5},
 {t:'Zengin bir kervan hazineye vergi bıraktı.',gold:40},
 {t:'Vergi toplayıcıların yolsuzluğu ortaya çıktı.',gold:-35,sat:-2},
 {t:'Halk büyük bir şenlik yaptı.',gold:-25,sat:4},
 {t:'Komşu topraklardan göç geldi.',pop:1.05}
];
var DEATH={
 isyan:'Halk memnuniyeti sıfıra indi. İsyan çıktı.',
 kivilcim:'Memnuniyet çökmüştü. Küçük bir kıvılcım isyana dönüştü.',
 kitlik:'Yiyecek stoku tükendi. Halk aç kaldı.',
 iflas:'Hazine boşaldı. Maaş alamayan askerler isyan etti.'
};
var ICON={
 cami:'<path d="M8 36V22h24v14z"/><path d="M11 22a9 9 0 0 1 18 0z"/><path d="M20 13V8"/><rect x="2" y="14" width="5" height="22"/><rect x="33" y="14" width="5" height="22"/><path d="M2 14l2.5-7 2.5 7zM33 14l2.5-7 2.5 7z"/>',
 ambar:'<path d="M5 36V18l15-11 15 11v18z"/><path d="M14 36V24h12v12z"/><path d="M14 24l12 12M26 24L14 36" fill="none"/>',
 pazar:'<path d="M4 16l4-9h24l4 9z"/><path d="M4 16h32v4H4z"/><path d="M7 20v16M33 20v16" fill="none"/><rect x="7" y="28" width="26" height="5"/>',
 kisla:'<path d="M20 3l14 5v11c0 9-6 14-14 18C12 33 6 28 6 19V8z"/><path d="M20 10v20M13 17h14" fill="none"/>',
 sur:'<rect x="3" y="19" width="34" height="17"/><rect x="3" y="13" width="6" height="6"/><rect x="12" y="13" width="6" height="6"/><rect x="22" y="13" width="6" height="6"/><rect x="31" y="13" width="6" height="6"/><path d="M15 36v-7a5 5 0 0 1 10 0v7"/>',
 liman:'<path d="M4 29h32l-6 8H10z"/><path d="M20 4v25" fill="none"/><path d="M20 6l13 19H20z"/>'
};
var HELP=[
 ['🎯 Oyunun amacı','Hayali haritadaki dokuz devletten birini seçip yönetirsin. Oyunun sabit bir bitişi yok: amaç devletini mümkün olduğunca uzun yaşatmak, güçlendirmek ve komşularının kalelerini alıp büyümektir. Ne kadar dönem ayakta kaldığın, başarının ölçüsüdür.'],
 ['🧭 Başlarken','Haritada bir bölgeye tıkla, zorluğu seç (basit, normal-basit, normal, normal-zor, zor ya da imkansız), istersen devletine bir ad ver ve "Oyuna başla" de. Her bölgenin biyomuna göre bir artısı ve bir eksisi vardır: Kuzey Krallığı güçlü askerlere ama zayıf tarıma, Çöl Devleti güçlü ticarete ama zayıf tarıma, Dağların Efendileri güçlü savunmaya ama zayıf ticarete sahiptir. Ortadaki Kızılkale savaşçıdır ama herkesle komşudur, yani her devlet ona saldırabilir.'],
 ['⏳ Dönem nasıl işler','Her dönem 3 yıl sürer. Dönem içinde istediğin kararları verirsin (gelişim, vergi, asker, bina, diplomasi, savaş), sonra "3 yılı ilerlet"e basarsın. 30 saniyelik ilerleme ekranında bu üç yılda olanlar yazılır, altında bir ipucu çıkar. Dönem bitince komşularda olanlar "📰 Komşu haberleri" kutusunda görünür.'],
 ['📊 Ekran ve değerler','Üst çubukta nüfus, asker ve hazine görünür. Üzerine basınca yiyecek, odun, taş, demir, kumaş gibi tüm değerler önceki ve şimdiki halleriyle haritanın altında açılır. Sağ panelde halkın memnuniyeti vardır; 50 üstü yeşil, 25 altı kırmızı. Memnuniyet, hazine, asker ya da nüfus tehlikeli seviyeye düşünce panelin üstünde uyarı çıkar. Haritadaki "Sadece harita" düğmesi her şeyi gizleyip sadece haritayı gösterir, "Geri dön" ile geri gelirsin. "☰ Menü" seni başlangıç ekranına götürür.'],
 ['🌱 Gelişim','Her dönem en fazla 3 gelişim seçersin. Aynı seçeneği üç kereye kadar seçebilirsin; tekrar eden seçim her seferinde daha pahalıdır. Seçtiklerin dönem sonunda tamamlanır ve yiyecek, gelir, ordu gücü gibi şeyleri artırır. Yanlış seçtiysen altındaki "✕" düğmeleriyle geri alabilirsin.'],
 ['💰 Vergi ve halk','Vergiyi artırırsan hazine dolar ama memnuniyet düşer; düşürürsen tersi olur. "Halka hediye ver" dönemde bir kez altın harcayıp memnuniyeti 15 artırır. Cami her dönem memnuniyeti artırır. Memnuniyet 0 olursa isyan çıkar ve oyun biter.'],
 ['⚔️ Asker','"Bu dönem eklenecek asker sayısı" kutusuna kaç asker eklemek istediğini yazarsın; askerler dönem sonunda orduya katılır. Askerler nüfusun parçasıdır: asker alınca nüfus artmaz, savaşta ölünce azalır. Her asker her dönem maaş ister, bu yüzden gereğinden büyük ordu hazineyi eritir. "Terhis et" 10 askeri halka geri verir.'],
 ['🪖 Paralı asker','"Paralı asker kirala" düğmesine bas, kaç asker ve kaç savaşlığına (en fazla 5) istediğini yaz. Her 10 asker, bir savaş için 20 altındır; 3 savaşlık kiralarsan 3 katı ödersin. Paralı askerler maaş istemez, nüfustan düşmez, savunmada da gelir. Kalan savaş hakkı "Terhis et" düğmesinin yanında yazar. Savaşta ölenler geri gelmez, hak bitince kalanlar ayrılır.'],
 ['🏰 Kaleler ve başkent','Her devletin 12 kalesi (her kenarda 3) ve ortasında bir başkenti vardır. Her kalenin ve başkentin kendi adı vardır (Kartal Kalesi, Buzkent gibi); imleci üstüne getirince ya da tıklayınca görürsün. Haritada bir kaleye tıklayarak saldırabilirsin. Bir devletin başkentine saldırmak için önce onun 3 kalesini almalısın. Düşman senin başkentine saldırmak için senin 5 kaleni almak zorundadır. Aldığın kale ve içindeki binalar sana geçer. Başkenti alınan devlet tamamen sana katılır.'],
 ['🏛️ Binalar','Kendi bölgene, başkentine ya da kalene tıklayıp içine girersin ya da Yönetim sekmesindeki "Başkentine gir" düğmesini kullanırsın. İçerideki 4×4 alana bina yerleştirirsin: cami (memnuniyet), ambar (yiyecek), pazar (gelir), kışla (savaş gücü), sur (savunma), liman (kıyı geliri, tekne ve gemi üretimi için gerekir; sadece denize bakan kalelerde yapılır, başkentlerde yapılamaz). Her bina her dönem bakım ister. Yıkmak, binanın fiyatının dörtte birine mal olur.'],
 ['🗡️ Savaş','Savaş başlamadan önce ordunu sen kurarsın: "+ Süvari/Piyade/Okçu birliği" düğmeleriyle birlik ekler, her birliğe kaç asker koyacağını kutusuna yazarsın (ya da −10/+10 düğmelerini kullanırsın). Oyun askerlerini kendisi bölmez; yedekte bıraktığın askerler savaşmaz ama ölmez, savaş sonunda orduna geri dönerler. Birliğe tıklayıp mavi bölgeden (haritanın sol yarısı) bir kare seçerek yerleştirir, "Savaşı başlat" dersin. Birliklerin Bannerlord\'daki gibi emir alır: savaşa Dur (▪) emriyle başlarlar, yani yerlerini korur ve menzillerine gireni vururlar (menzili dışından vurulan birlik karşılık vermek için ileri atılır). Savaş sırasında tüm orduya ya da seçili birliğe İlerle (▶, dizilişi bozmadan grup halinde yaklaşır) veya Hücum (⚔, her birlik en yakın düşmanına koşar) emri verebilirsin; bir birliğe tıklayıp haritada kare seçerek elle de yürütebilirsin. Süvari okçuyu, piyade süvariyi, okçu piyadeyi yener. Okçu 3 kare uzaktan vurur. İstediğin zaman savaş açabilirsin: bir dönemdeki ilk savaş bedelsizdir, sonrakiler memnuniyeti 10 düşürür. Uzak devletlere savaş açmak, mesafe başına ekstra altın ister. Düşman sana saldırınca müttefiklerin kendiliğinden yardıma gelir.'],
 ['🤝 Diplomasi','Siyaset sekmesinde komşulara hediye verir, ticaret anlaşması ya da barış teklif edersin. İttifak kurmak veya var olan bir gruba katılmak için sol alttaki "🤝 İttifak haritası" düğmesini kullan. İttifak için ilişki en az 40 olmalı (Dağların Efendileri için 60). Bir ittifakta en fazla 3 üye olabilir (sen dahil), yani en fazla 2 müttefikin olur. Harita tüm devletlerin ittifaklarını (harf = grup, ★ = senin ittifakın) ve asker sayılarını gösterir; ittifaksız bir devletle ya da yeri olan bir ittifakla oradan anlaşabilirsin, kabul şansı yüzde olarak yazar. Sana saldırıldığında müttefiklerin otomatik olarak savunmaya katılır. Saldırırken müttefiklerinden yardım isteyebilirsin: sen dahil üç üyeli ittifakta yardım kesin gelir; ikili ittifakta kabul ihtimali zorluğa göre değişir. Müttefikinin başka bir devletle savaşı varsa ona asker yollayabilirsin. Müttefikine saldırırsan ittifak bozulur. Saldırmazlık anlaşması 4 dönem sürer: o süre boyunca devlet sana saldırmaz, sen de ona saldıramazsın; saldırırsan anlaşma bozulur ve ilişki çok düşer. Kabul etmesi devletin karakterine bağlıdır: barışçıl Gümüşkıyı ve Bilge Asası kolay kabul eder, savaşsever Dağların Efendileri çok zor. "Asker gönder" bir komşuya 10 asker hediye edip ilişkiyi artırır; askerlere değer veren savaşçı devletlerde etkisi daha büyüktür. Komşular da kendi aralarında saldırmazlık anlaşması yapar ve müttefiklerine asker yollar.'],
 ['🌍 Komşular nasıl davranır','Her komşunun bir karakteri vardır ve Siyaset sekmesinde "Tavrı" satırında yazar. Kuzey Krallığı orduya yatırım yapar, güçlü bir komşusuyla ittifak kurar ve ittifakını bozmaz. Dağların Efendileri savaş sever ama kaynağı kıttır. Gümüşkıyı barışçıl bir tüccardır. Bilge Asası bilime, barışa ve diplomasiye yatırır, Yer Altı Devleti madene, Kızılkale orduya ve diplomasiye. Komşular birbirleriyle de savaşır, ittifak ve ticaret anlaşması yapar. Savaşan devletler haritada kırmızı çerçeveyle işaretlenir.'],
 ['💀 Nasıl kaybedilir','Memnuniyet 0 olursa isyan çıkar. Yiyecek yetmezse kıtlık olur. Hazine eksiye düşerse maaşını alamayan askerler isyan eder. Düşman başkentini alırsa devletin yıkılır. Bu durumlardan biri olunca ekrana "YOU DEAD" yazılır ve o kayıt listeden kalkar.'],
 ['💡 Başlangıç tavsiyeleri','İlk dönemlerde tarım ve gıdaya yatır, hazineyi sıfıra yaklaştırma ve memnuniyeti 30\'un üstünde tut. Çok asker almadan önce maaşını hesapla. Komşuyla ittifak kurmak erken saldırıları azaltır. Zayıflayan bir komşunun kalelerini almak için fırsat kolla. Aynı anda birden fazla oyun açabilirsin, "☰ Menü"den "Yeni oyun" demen yeter.']
];
