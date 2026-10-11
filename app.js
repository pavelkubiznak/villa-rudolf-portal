/* Villa Rudolf – průvodce: aplikační logika (dřív inline v index.html, oddělené kvůli CSP).
 *
 * Role souboru od října 2026: portál na GitHub Pages zobrazuje UŽ JEN UKÁZKU (demo host z
 * data/demo-guest.json). Host s reálným tokenem (?t=… nebo token uložený starší PWA) je hned na
 * startu přesměrován na https://villarudolf.com/pruvodce/?t=…, kde žije udržovaný průvodce
 * (villa-rudolf-site). Supabase se odsud nevolá vůbec – žádný klíč, žádné RPC, žádná data hostů.
 *
 * Struktura:
 *   1. Konfigurace (CFG) + přesměrování hostů (presmerujHosta)
 *   2. I18N – texty UI cs/de/en/pl
 *   3. Počasí (CAT) a doporučovací jádro: partyFlags, seasonOf, seasonOk, eligible, scoreTrip,
 *      whyBadges, buildPlan
 *   4. Pomocné: tt, localISO, fmtDate, daysBetween, esc, sanitizeTrip
 *   5. Skupina (party) v localStorage – jen pro demo ('vr-party-demo')
 *   6. Načtení demo hosta (loadGuest)
 *   7. Render: wxCell, mapa (buildMapSection / renderMapInner), matchFilter, render()
 *   8. Start (IIFE) + registrace service workeru
 *
 * Bez frameworku, bez buildu. Karta výletu je .trip s nadpisem h3 – na tom závisí track.js.
 */

/* ===== 1. Konfigurace ===== */
const CFG = {
  TRIPS_URL: 'data/trips.json',
  FORECAST_URL: 'data/forecast.json',
  DEMO_GUEST_URL: 'data/demo-guest.json',
  VILLA: 'villa',
  // Udržovaný průvodce pro hosty s tokenem (villa-rudolf-site). Sem se přesměrovává.
  GUIDE_URL: 'https://villarudolf.com/pruvodce/',
  // Podmínky / ochrana osobních údajů (odkaz v patičce, ?lang= podle jazyka hosta)
  PRIVACY_URL: 'https://villarudolf.com/podminky/'
  // Umami: značka je staticky v index.html (s data-exclude-search, ať do analytiky nejde token z ?t=)
};
const qs=new URLSearchParams(location.search);
// Token z dřívějších verzí PWA. Záměrně se NEMAŽE: PWA z plochy startuje přes start_url bez ?t=
// a díky uloženému tokenu se host dostane na web i bez odkazu ze zprávy.
const TOKEN_KEY='vr-token';

// Host s reálným tokenem → rovnou na villarudolf.com/pruvodce/. Vrací true, když se přesměrovalo
// (pak se tu už nic nerenderuje). Při té příležitosti smaže data hostů, která si starší verze
// portálu ukládaly do localStorage (odpověď vr_verify_token ve 'vr-guest-<token>', upravená
// party ve 'vr-party-<token>') – na tomhle zařízení už nemají co dělat; demo party zůstává.
function presmerujHosta(){
  let token=qs.get('t');
  if(!token){ try{token=localStorage.getItem(TOKEN_KEY);}catch(e){} }
  if(!token||token==='demo') return false;
  try{
    Object.keys(localStorage)
      .filter(k=>(k.startsWith('vr-guest-')||k.startsWith('vr-party-'))&&k!=='vr-party-demo')
      .forEach(k=>localStorage.removeItem(k));
  }catch(e){}
  location.replace(CFG.GUIDE_URL+'?t='+encodeURIComponent(token)+location.hash);
  return true;
}

/* ===== 2. i18n ===== */
const I18N = {
  cs:{greet:'Vážená rodino',welcome:'připravili jsme vám tipy na výlety v okolí – řazené podle počasí, věku dětí i velikosti vaší skupiny.',
    greetGroup:'Vážení hosté',welcomeGroup:'připravili jsme vám tipy na výlety v okolí – řazené podle počasí a velikosti vaší party.',
    demoBanner:'Toto je ukázka průvodce. Svůj osobní průvodce otevřete z odkazu ve zprávě od Villy Rudolf.',
    editInterests:'Jedete na motorkách?',intMoto:'Ano, jsme na motorkách',
    adults:'dospělí',kids:'děti',today:'Dnešní tip',
    arrivingIn:d=>`Přijíždíte za ${d} ${d===1?'den':(d<5?'dny':'dní')}`,plan:'Plán podle počasí',allTrips:'Všechny výlety',
    detail:'Detail',recTitle:'Doporučujeme vám',moreTitle:'Další výlety',
    greetFamily:n=>`Vážená rodino ${n}`,north:'S',mapPoland:'POLSKO',mapMountains:'KRKONOŠE',region:'Krkonoše',title:'Villa Rudolf – průvodce',
    alt:'nebo',openLabel:'Otevřeno',priceLabel:'Vstupné',
    transport:'Doprava',byFoot:'pěšky od vily',min:'min autem',foot:'Výlet přímo od vily',
    reservation:'Pro skupinu doporučujeme rezervovat předem.',idDocs:'Do Polska má mít vlastní doklad i každé dítě.',
    capacity:'Před cestou zkontrolujte obsazenost online.',
    wxLive:'Počasí živě z yr.no',updated:'aktualizováno',planNote:'Plán se řídí předpovědí a je jen doporučení – ráno mrkněte na aktuální počasí a dny klidně prohoďte (outdoor za hezka, indoor za deště).',
    editParty:'upravit',editTitle:'Upřesnit skupinu',editAdults:'Dospělí',editKids:'Věk dětí (např. 8, 12)',editSave:'Uložit',editClose:'Zavřít',
    footer:'Připraveno ve Ville Rudolf · ceny a otevírací doby ověřte před cestou · počasí: yr.no.',thanks:'Děkujeme za návštěvu a přejeme šťastnou cestu domů!',
    privacy:'Ochrana osobních údajů',analytics:'Návštěvnost měříme anonymně, bez cookies (Umami).',
    mapTitle:'Mapa okolí',mapCaption:'Zvýrazněné = výlety z vašeho plánu',mapCapRing:'v kroužku = pěšky od vily',mapFoot:'pěšky',ringLabel:'pěšky od vily',
    legVilla:'Pěšky od vily',legNear:'V okolí',legFar:'Na celý den',
    filters:{vse:'Vše',pesky:'Bez auta',dest:'Za deště',deti:'Pro děti',zviratka:'Zvířátka',vyhledy:'Výhledy',koupani:'Koupání',nenarocne:'Nenáročné'},
    tripWord:n=>n===1?'výlet':(n>=2&&n<=4?'výlety':'výletů'),
    why:{rain:'ideální za deště',clear:'krásný den ven',heat:'osvěžení v horku',teen:'pro teenagery',kids:'pro děti',foot:'bez auta',cold:'do chladna',adrenalin:'adrenalin',indoor:'pod střechu',moto:'pro motorkáře'}},
  de:{greet:'Liebe Familie',welcome:'wir haben Ausflugstipps für die Umgebung zusammengestellt – sortiert nach Wetter, Alter der Kinder und Größe Ihrer Gruppe.',
    greetGroup:'Liebe Gäste',welcomeGroup:'wir haben Ausflugstipps für die Umgebung zusammengestellt – sortiert nach Wetter und Größe Ihrer Gruppe.',
    demoBanner:'Dies ist eine Vorschau des Guides. Ihren persönlichen Guide öffnen Sie über den Link in der Nachricht von Villa Rudolf.',
    editInterests:'Sind Sie mit dem Motorrad unterwegs?',intMoto:'Ja, wir sind mit dem Motorrad da',
    adults:'Erwachsene',kids:'Kinder',today:'Tipp für heute',
    arrivingIn:d=>`Anreise in ${d} ${d===1?'Tag':'Tagen'}`,plan:'Plan nach Wetter',allTrips:'Alle Ausflüge',
    detail:'Details',recTitle:'Unsere Empfehlung für Sie',moreTitle:'Weitere Ausflüge',
    greetFamily:n=>`Liebe Familie ${n}`,north:'N',mapPoland:'POLEN',mapMountains:'RIESENGEBIRGE',region:'Riesengebirge',title:'Villa Rudolf – Reiseführer',
    alt:'oder',openLabel:'Öffnungszeiten',priceLabel:'Eintritt',
    transport:'Anfahrt',byFoot:'zu Fuß von der Villa',min:'Min. mit dem Auto',foot:'Ausflug direkt von der Villa',
    reservation:'Für die Gruppe bitte vorab reservieren.',idDocs:'Nach Polen braucht auch jedes Kind einen eigenen Ausweis.',
    capacity:'Vor der Fahrt die Auslastung online prüfen.',
    wxLive:'Wetter live von yr.no',updated:'aktualisiert',planNote:'Der Plan folgt der Vorhersage und ist nur eine Empfehlung – schauen Sie morgens aufs aktuelle Wetter und tauschen Sie die Tage ruhig (Outdoor bei Sonne, Indoor bei Regen).',
    editParty:'anpassen',editTitle:'Gruppe anpassen',editAdults:'Erwachsene',editKids:'Alter der Kinder (z. B. 8, 12)',editSave:'Speichern',editClose:'Schließen',
    footer:'Zusammengestellt in der Villa Rudolf · Preise und Öffnungszeiten vorab prüfen · Wetter: yr.no.',thanks:'Danke für Ihren Besuch und eine gute Heimreise!',
    privacy:'Datenschutz',analytics:'Besuche messen wir anonym und ohne Cookies (Umami).',
    mapTitle:'Übersichtskarte',mapCaption:'Hervorgehoben = Ausflüge aus Ihrem Plan',mapCapRing:'im Kreis = zu Fuß erreichbar',mapFoot:'zu Fuß',ringLabel:'zu Fuß erreichbar',
    legVilla:'Zu Fuß',legNear:'In der Umgebung',legFar:'Tagesausflüge',
    filters:{vse:'Alle',pesky:'Ohne Auto',dest:'Bei Regen',deti:'Für Kinder',zviratka:'Tiere',vyhledy:'Aussichten',koupani:'Baden',nenarocne:'Gemütlich'},
    tripWord:n=>n===1?'Ausflug':'Ausflüge',
    why:{rain:'ideal bei Regen',clear:'schöner Tag draußen',heat:'Abkühlung bei Hitze',teen:'für Teenager',kids:'für Kinder',foot:'ohne Auto',cold:'für kühle Tage',adrenalin:'Adrenalin',indoor:'überdacht',moto:'für Motorradfahrer'}},
  en:{greet:'Dear guests',welcome:'we put together trip ideas nearby – ranked by weather, kids’ ages and your group size.',
    greetGroup:'Dear guests',welcomeGroup:'we put together trip ideas nearby – ranked by weather and your group size.',
    demoBanner:'This is a preview of the guide. Open your personal guide from the link in the message from Villa Rudolf.',
    editInterests:'Are you travelling by motorbike?',intMoto:'Yes, we are on motorbikes',
    adults:'adults',kids:'children',today:'Today’s pick',
    arrivingIn:d=>`Arriving in ${d} day${d===1?'':'s'}`,plan:'Weather-based plan',allTrips:'All trips',
    detail:'Details',recTitle:'Recommended for you',moreTitle:'More trips',
    greetFamily:n=>`Dear ${n} family`,north:'N',mapPoland:'POLAND',mapMountains:'GIANT MOUNTAINS',region:'Krkonoše Mountains',title:'Villa Rudolf – guide',
    alt:'or',openLabel:'Open',priceLabel:'Admission',
    transport:'Getting there',byFoot:'on foot from the villa',min:'min by car',foot:'Trip straight from the villa',
    reservation:'For a group, book ahead.',idDocs:'For Poland every child needs their own ID.',
    capacity:'Check live occupancy before you go.',
    wxLive:'Live weather from yr.no',updated:'updated',planNote:'The plan follows the forecast and is only a suggestion – check today’s weather in the morning and swap days freely (outdoor when sunny, indoor when wet).',
    editParty:'edit',editTitle:'Adjust your group',editAdults:'Adults',editKids:'Children’s ages (e.g. 8, 12)',editSave:'Save',editClose:'Close',
    footer:'Prepared at Villa Rudolf · verify prices and hours before you go · weather: yr.no.',thanks:'Thank you for visiting and safe travels home!',
    privacy:'Privacy',analytics:'Visits are measured anonymously, without cookies (Umami).',
    mapTitle:'Area map',mapCaption:'Highlighted = trips from your plan',mapCapRing:'in the ring = walkable',mapFoot:'on foot',ringLabel:'walkable',
    legVilla:'Walkable',legNear:'Nearby',legFar:'Day trips',
    filters:{vse:'All',pesky:'No car',dest:'Rainy day',deti:'For kids',zviratka:'Animals',vyhledy:'Views',koupani:'Swimming',nenarocne:'Easy'},
    tripWord:n=>n===1?'trip':'trips',
    why:{rain:'ideal in rain',clear:'great day outside',heat:'cool off in the heat',teen:'for teens',kids:'for kids',foot:'no car needed',cold:'for cool days',adrenalin:'adrenaline',indoor:'indoors',moto:'for riders'}},
  pl:{greet:'Szanowna Rodzino',welcome:'przygotowaliśmy dla Was propozycje wycieczek w okolicy – uszeregowane według pogody, wieku dzieci i wielkości grupy.',
    greetGroup:'Szanowni Goście',welcomeGroup:'przygotowaliśmy dla Was propozycje wycieczek w okolicy – uszeregowane według pogody i wielkości grupy.',
    demoBanner:'To jest przykładowa wersja przewodnika. Swój osobisty przewodnik otworzycie z linku w wiadomości od Villa Rudolf.',
    editInterests:'Podróżujecie motocyklami?',intMoto:'Tak, jesteśmy na motocyklach',
    adults:'dorośli',kids:'dzieci',today:'Propozycja na dziś',
    arrivingIn:d=>`Przyjazd za ${d} ${d===1?'dzień':'dni'}`,plan:'Plan według pogody',allTrips:'Wszystkie wycieczki',
    detail:'Szczegóły',recTitle:'Polecamy Wam',moreTitle:'Więcej wycieczek',
    // polsky by se příjmení muselo skloňovat (Kowalskich) – proto oslovení bez něj
    greetFamily:()=>'Szanowna Rodzino',north:'N',mapPoland:'POLSKA',mapMountains:'KARKONOSZE',region:'Karkonosze',title:'Villa Rudolf – przewodnik',
    alt:'lub',openLabel:'Otwarte',priceLabel:'Wstęp',
    transport:'Dojazd',byFoot:'pieszo od willi',min:'min samochodem',foot:'Wycieczka prosto od willi',
    reservation:'Dla grupy zalecamy wcześniejszą rezerwację.',idDocs:'Do Polski każde dziecko powinno mieć własny dokument.',
    capacity:'Przed wyjazdem sprawdźcie dostępność miejsc online.',
    wxLive:'Pogoda na żywo z yr.no',updated:'zaktualizowano',planNote:'Plan opiera się na prognozie i jest tylko sugestią – rano sprawdźcie aktualną pogodę i spokojnie zamieńcie dni (na dworze przy ładnej, pod dachem przy deszczu).',
    editParty:'zmień',editTitle:'Uściślij grupę',editAdults:'Dorośli',editKids:'Wiek dzieci (np. 8, 12)',editSave:'Zapisz',editClose:'Zamknij',
    footer:'Przygotowane w Villa Rudolf · ceny i godziny otwarcia sprawdźcie przed wyjazdem · pogoda: yr.no.',thanks:'Dziękujemy za wizytę i życzymy szczęśliwej drogi do domu!',
    privacy:'Ochrona danych',analytics:'Odwiedziny mierzymy anonimowo, bez plików cookie (Umami).',
    mapTitle:'Mapa okolicy',mapCaption:'Wyróżnione = wycieczki z Waszego planu',mapCapRing:'w kółku = pieszo od willi',mapFoot:'pieszo',ringLabel:'pieszo od willi',
    legVilla:'Pieszo od willi',legNear:'W okolicy',legFar:'Na cały dzień',
    filters:{vse:'Wszystko',pesky:'Bez samochodu',dest:'Na deszcz',deti:'Dla dzieci',zviratka:'Zwierzęta',vyhledy:'Widoki',koupani:'Kąpiel',nenarocne:'Łatwe'},
    // pl má tři formy: 1 wycieczka / 2–4 wycieczki / 5+ wycieczek, s výjimkou 12–14
    tripWord:n=>{const j=n%10,d=n%100;return n===1?'wycieczka':(j>=2&&j<=4&&!(d>=12&&d<=14)?'wycieczki':'wycieczek');},
    why:{rain:'idealne na deszcz',clear:'piękny dzień na dworze',heat:'ochłoda w upał',teen:'dla nastolatków',kids:'dla dzieci',foot:'bez samochodu',cold:'na chłodne dni',adrenalin:'adrenalina',indoor:'pod dachem',moto:'dla motocyklistów'}}
};

/* ===== 3. Počasí: kategorie -> ikona + text ===== */
const CAT = {
  thunder:{ic:'i-cloud-rain',cs:'bouřky',de:'Gewitter',en:'thunderstorms',pl:'burze',wet:1},
  heavyrain:{ic:'i-cloud-rain',cs:'silný déšť',de:'kräftiger Regen',en:'heavy rain',pl:'silny deszcz',wet:1},
  rain:{ic:'i-cloud-rain',cs:'déšť',de:'Regen',en:'rain',pl:'deszcz',wet:1},
  showers:{ic:'i-cloud-rain',cs:'přeháňky',de:'Schauer',en:'showers',pl:'przelotne opady',wet:.5},
  snow:{ic:'i-cloud-rain',cs:'sníh',de:'Schnee',en:'snow',pl:'śnieg',wet:1},
  fog:{ic:'i-cloud',cs:'mlha',de:'Nebel',en:'fog',pl:'mgła',wet:0},
  cloudy:{ic:'i-cloud',cs:'zataženo',de:'bedeckt',en:'cloudy',pl:'pochmurno',wet:0},
  partly:{ic:'i-cloud-sun',cs:'polojasno',de:'wolkig',en:'partly cloudy',pl:'częściowo pochmurno',wet:0},
  fair:{ic:'i-cloud-sun',cs:'skoro jasno',de:'meist sonnig',en:'mostly sunny',pl:'przeważnie słonecznie',wet:0},
  clear:{ic:'i-sun',cs:'jasno',de:'sonnig',en:'sunny',pl:'słonecznie',wet:0}
};
const isWet = c => CAT[c] ? CAT[c].wet : 0;
const isNice = c => ['clear','fair','partly'].includes(c);

/* ===== Doporučovací jádro ===== */
function partyFlags(p){
  const kids = p.children||[];
  const zajmy = p.interests||[];
  return {
    size:(p.adults||0)+kids.length,
    minKidAge:kids.length?Math.min.apply(null,kids):null,
    hasToddler:kids.some(a=>a<=4),
    hasYoungKid:kids.some(a=>a>=5&&a<=9),
    hasKid:kids.some(a=>a<=11),
    hasTeen:kids.some(a=>a>=12),
    activeParty:kids.some(a=>a>=12)||kids.length===0, // bez dětí = dospělá parta: výhledy a adrenalin nahoru (odznak „adrenalin" ale jen se skutečným teenagerem)
    isGroup:((p.adults||0)+kids.length)>=8,
    hasKids:kids.length>0,          // rozhoduje o oslovení: rodina vs. parta
    interests:zajmy,
    isMoto:zajmy.includes('moto')
  };
}
// PROVOZNÍ sezóna výletů – záměrně jiná než marketingová hranice webu (assets/season.js v site:
// zima od 15. 10., zdůvodněná poptávkou hostů, ne provozem). Lanovky a ski areály jedou
// prosinec–březen ('winter'), koupaliště a letní atrakce duben – 14. října ('summer').
// 15. 10. – 30. 11. je 'shoulder': žádný výlet nemá seasons ['shoulder'], takže seasonOk() i filtr
// katalogu v render() tehdy nechají jen celoroční výlety – bez lyží v listopadu (dřív chyba code-02).
function seasonOf(iso){
  const m=+iso.slice(5,7),d=+iso.slice(8,10);
  if(m===12||m<=3) return 'winter';
  if(m>=4&&(m<10||(m===10&&d<15))) return 'summer';
  return 'shoulder';
}
// Výlet bez `seasons` je celoroční (stejně jako seasonOk() v planneru na webu).
function seasonOk(trip,iso){const s=trip.seasons;return !s||!s.length||!iso||s.includes(seasonOf(iso));}
// Vítr: model met.no (~9 km) vrchol Sněžky nerozliší – za 134 běhů cronu (VII–IX 2026) byl max 30 km/h
// u vily a 27 km/h v bodě lanovky, dřívější hranice 45 tedy nikdy nesepnula. Hranice provozu lanovky
// (~60 km/h v nárazech) odpovídá modelovému průměru zhruba 30–35. 35 je odhad – kalibrovat proti odstávkám.
const WIND_LIMIT_KMH=35;
let FORECAST=null; // nastavuje render(); eligible() přes něj sahá na předpověď v místě výletu
// tvrdé filtry pro daný den
function eligible(trip,day,fl){
  if(!seasonOk(trip,day&&day.date)) return false; // lyže v červenci a koupaliště v lednu ven z plánu (v katalogu zůstávají)
  if(trip.needsClearLowWind&&day){
    // počasí v místě výletu (Sněžka, Černá hora), ne u vily v údolí; když chybí, vezmi vilu
    const w=(day.date&&wxFor(FORECAST,trip.id,day.date))||day;
    if(isWet(w.cat)||w.thunder||day.thunder||w.cat==='fog'||(w.windKmh&&w.windKmh>=WIND_LIMIT_KMH)) return false;
  }
  // hard = ne pro batolata, pokud výlet není přímo pro ně napsaný (trasa pro sportovní kočárek)
  if(fl.hasToddler && trip.effort==='hard' && !(trip.bestFor||[]).includes('toddler')) return false;
  // do plánu nedoporučuj výlety s věkovým limitem nad nejmladší dítě (v katalogu zůstávají)
  if(trip.minAge&&fl.minKidAge!=null&&fl.minKidAge<trip.minAge) return false;
  // interests = pro koho je výlet navíc zajímavý (jen bonus ve skóre).
  // interestOnly = bez toho zájmu nedává smysl vůbec (vyjížďka po serpentinách
  // rodině s kočárkem), takže ven z plánu – v katalogu zůstává.
  if(trip.interestOnly&&!(trip.interests||[]).some(i=>fl.interests.includes(i))) return false;
  return true;
}
function scoreTrip(trip,day,fl){
  let s=0; const c=day?day.cat:null; const hot=day&&day.max>=28; const cold=day&&day.max<=12;
  const zimni=(trip.seasons||[]).includes('winter'); // lyže: mráz a sníh nejsou handicap, ale důvod
  if(c){
    if(c==='snow'){ s += zimni?2:((trip.indoorOrCovered||trip.rainOk)?3:-3.5); }
    else if(['rain','heavyrain','thunder'].includes(c)){ s += (trip.indoorOrCovered||(trip.rainOk&&c!=='thunder'))?3:-3.5; } // za bouřky jen pod střechu
    else if(c==='showers'){ s += (trip.indoorOrCovered||trip.rainOk)?1:-1; }
    else if(isNice(c)){ s += trip.outdoor?2:(trip.lovesHeat?0:-1); }
  }
  if(hot){ if(trip.lovesHeat) s+=3; else if(trip.outdoor&&trip.effort!=='easy') s-=1.5; }
  if(cold&&!zimni){ s += trip.indoorOrCovered?1:-1; }
  if(fl.activeParty){ if(['adrenalin','viewpoint'].includes(trip.category)|| ['bobsled-pec','ebikes','snezka-cablecar'].includes(trip.id)) s+=1.5; }
  if(fl.hasToddler||fl.hasYoungKid){ if(['janske-hallenbad','baumwipfelpfad','aqua-vrchlabi','aquapark-karpacz','hricky-buky'].includes(trip.id)) s+=1.5; if(trip.stairs) s-=1; }
  if(trip.byFoot) s+=0.6;
  // parta bez dětí: dětské atrakce dolů. Bez toho dostali čtyři motorkáři
  // do doporučení dětský zábavní park.
  if(!fl.hasKid && trip.category==='kids') s-=2.5; // hasKid = dítě do 11 let; teenagery hřiště nezajímá
  // zájmový bonus – motorkáři dostanou nahoru to, co je baví (muzeum, serpentiny, vyjížďka)
  if((trip.interests||[]).some(i=>fl.interests.includes(i))) s+=2.5;
  return s;
}
function whyBadges(trip,day,fl,L){
  const w=L.why,out=[],c=day?day.cat:null,hot=day&&day.max>=28,cold=day&&day.max<=12;
  if(c&&['rain','heavyrain','thunder','showers','snow'].includes(c)&&(trip.indoorOrCovered||(trip.rainOk&&c!=='thunder'))) out.push({t:w.rain,k:'rain'});
  else if(hot&&trip.lovesHeat) out.push({t:w.heat,k:'heat'});
  else if(c&&isNice(c)&&trip.outdoor) out.push({t:w.clear,k:''});
  else if(cold&&trip.indoorOrCovered) out.push({t:w.cold,k:''});
  if(fl.isMoto&&(trip.interests||[]).includes('moto')) out.push({t:w.moto,k:'heat'});
  if(fl.hasTeen&&['bobsled-pec','ebikes','snezka-cablecar'].includes(trip.id)) out.push({t:w.adrenalin,k:'heat'});
  if((fl.hasToddler||fl.hasYoungKid)&&['janske-hallenbad','baumwipfelpfad','hricky-buky'].includes(trip.id)) out.push({t:w.kids,k:''});
  if(trip.byFoot) out.push({t:w.foot,k:''});
  return out.slice(0,3);
}
// plán na celý pobyt s anti-opakováním
function buildPlan(trips,days,fl){
  const used=new Set(), plan=[];
  for(const day of days){
    const ranked=trips.filter(t=>eligible(t,day,fl)).map(t=>({t,sc:scoreTrip(t,day,fl)})).sort((a,b)=>b.sc-a.sc);
    let pick=ranked.find(r=>!used.has(r.t.id))||ranked[0];
    if(pick){ used.add(pick.t.id); }
    plan.push({day,pick:pick?pick.t:null,ranked});
  }
  // alternativy až po výběru všech dnů: nenabízej hlavní tip jiného dne a každou alternativu
  // ukaž jen jednou – jinak se „Stezka korunami stromů" opakovala 13× za čtrnáctidenní pobyt
  const shown=new Set(used);
  for(const p of plan){
    p.alts=p.ranked.filter(r=>!shown.has(r.t.id)&&r.sc>0).slice(0,2).map(r=>r.t);
    p.alts.forEach(t=>shown.add(t.id)); delete p.ranked;
  }
  return plan;
}

/* ===== 4. Pomocné ===== */
const tt=(v,lang)=> v==null?'':(typeof v==='string'?v:(v[lang]||v.cs||v.de||v.en||v.pl||''));
// jedno místo pro mapování jazyka na locale – dřív se větvilo na třech místech
// a angličtina kvůli tomu dostávala v patičce německý formát data
const LOCALE={cs:'cs-CZ',de:'de-DE',en:'en-GB',pl:'pl-PL'};
const locale=lang=>LOCALE[lang]||LOCALE.de;
// místní datum (Praha) jako YYYY-MM-DD – toISOString() by dalo UTC a mezi půlnocí a 2:00 včerejšek
const localISO=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function fmtDate(iso,lang){const d=new Date(iso+'T00:00:00');return d.toLocaleDateString(locale(lang),{weekday:'short',day:'numeric',month:'numeric'});}
// Horní mez délky pobytu: překlep v roce odjezdu (2062 místo 2026) by jinak znamenal tisíce dnů
// a O(dny × výlety) výpočet + DOM, který hostovi zasekne prohlížeč. Neplatné datum → prázdný pobyt.
const MAX_STAY_DAYS=60;
function daysBetween(a,b){
  const out=[];let d=new Date(a+'T00:00:00Z');const e=new Date(b+'T00:00:00Z');
  if(isNaN(d)||isNaN(e)) return out;
  while(d<=e&&out.length<MAX_STAY_DAYS){out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}
  return out;
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

// trips.json je hranice důvěry (čte ho i villarudolf.com; do main může zapsat deploy key na Hetzneru).
// Hodnoty, které se vkládají do HTML/SVG bez esc() – id do href/id, accent do style/fill, icon do
// href="#i-…", travelMin, url odkazů – proto prochází whitelistem. Neplatný id = výlet se zahodí.
const SLUG=/^[a-z0-9-]{1,40}$/, HEX=/^#[0-9a-f]{6}$/i; // mapLum() počítá jas jen pro 6 hex znaků
// množina ikon = <symbol id="i-…"> v index.html (app.js se načítá až za nimi)
const ICONS=new Set(Array.from(document.querySelectorAll('symbol[id^="i-"]')).map(s=>s.id.slice(2)));
function sanitizeTrip(t){
  if(!t||typeof t!=='object'||!SLUG.test(String(t.id))) return null;
  const la=Number(t.coords&&t.coords.lat),lo=Number(t.coords&&t.coords.lon);
  if(!Number.isFinite(la)||!Number.isFinite(lo)) return null; // bez souřadnic nejde na mapu → renderMapInner by spadl
  t.coords={lat:la,lon:lo};
  t.accent=HEX.test(String(t.accent))?t.accent:'#33493a';
  t.icon=ICONS.has(t.icon)?t.icon:'pin';
  const tm=Number(t.travelMin); t.travelMin=Number.isFinite(tm)?tm:null;
  t.links=(Array.isArray(t.links)?t.links:[])
    .filter(l=>{const ok=l&&typeof l.url==='string'&&/^https:\/\//i.test(l.url); // žádné javascript:, data:, http:
      if(!ok)console.warn('trips.json: zahazuji odkaz u',t.id,l&&l.url); return ok;})
    .map(l=>{const byLang={};for(const [k,u] of Object.entries(l.urlByLang||{}))if(typeof u==='string'&&/^https:\/\//i.test(u))byLang[k]=u; // web v jazyce hosta (jen https)
      return Object.assign({},l,{icon:ICONS.has(l.icon)?l.icon:'globe',urlByLang:byLang});});
  return t;
}

/* ===== 5. Úprava skupiny (jen localStorage – portál běží jen jako demo) ===== */
const partyKey=token=>'vr-party-'+token;
function parseParty(adultsRaw,kidsRaw,interestsRaw){
  let adults=parseInt(adultsRaw,10); if(!Number.isFinite(adults))adults=1;
  adults=Math.min(30,Math.max(1,adults));
  const children=String(kidsRaw||'').split(/[^\d]+/) // čárka, mezera, středník – co host napíše
    .map(s=>parseInt(s.trim(),10))
    .filter(n=>Number.isFinite(n))
    .map(n=>Math.min(17,Math.max(0,n)))
    .slice(0,20);
  // whitelist – do zájmů se nesmí dostat nic, co neumí jádro ani katalog
  const ZNAME=['moto'];
  const interests=(Array.isArray(interestsRaw)?interestsRaw:[]).filter(i=>ZNAME.includes(i));
  return {adults,children,interests};
}
function loadPartyOverride(token){
  try{const raw=localStorage.getItem(partyKey(token));if(!raw)return null;const p=JSON.parse(raw);
    // interests dopisujeme až teď – uložená party ze starší verze je nemá
    if(p&&typeof p.adults==='number'&&Array.isArray(p.children))
      return Object.assign({interests:[]},p);}catch(e){}
  return null;
}
function savePartyOverride(token,party){
  try{localStorage.setItem(partyKey(token),JSON.stringify(party));}catch(e){}
}

/* ===== 6. Demo host ===== */
async function loadGuest(){
  const g=await (await fetch(CFG.DEMO_GUEST_URL)).json();
  // Evergreen demo: pobyt vždy začíná zítra (klouzavé datum), ať sedí na živou předpověď
  const lp=n=>{const x=new Date();x.setDate(x.getDate()+n);return localISO(x);};
  g.arrival=lp(1); g.departure=lp(5);
  return g;
}

/* ===== 7. Render ===== */
function wxFor(forecast,locId,date){const loc=forecast&&forecast.byLocation&&forecast.byLocation[locId];return loc&&loc.daily?loc.daily[date]:null;}
// forecast.json zapisuje cron na Hetzneru – teploty proto jen jako čísla, ne jako text do HTML
function wxCell(day,lang){
  if(!day)return '<div class="cd">–</div>';
  const mx=Number(day.max),mn=Number(day.min);
  if(!Number.isFinite(mx)||!Number.isFinite(mn))return '<div class="cd">–</div>';
  const m=CAT[day.cat]||CAT.cloudy;
  return `<div class="ic"><svg class="icon"><use href="#${m.ic}"></use></svg></div><div class="tp">${mx}°<small>/${mn}°</small></div><div class="cd">${m[lang]||m.cs}</div>`;
}

/* ===== Přehledová mapka (self-contained inline SVG z coords v trips.json) ===== */
const VILLA_COORDS={lat:50.6255,lon:15.8136};
function mapLum(hex){ // relativní jas 0..1 pro volbu čitelné barvy čísla
  const n=parseInt(String(hex).replace('#',''),16);
  return (0.2126*((n>>16)&255)+0.7152*((n>>8)&255)+0.0722*(n&255))/255;
}
function mapSmooth(pts){ // Catmull-Rom → kubické Bézier: hladká cesta skrz všechny body
  if(!pts.length) return '';
  if(pts.length<2) return `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d=`M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||pts[i+1];
    const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6;
    const c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
    d+=`C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}
/* ===== Filtrační logika (sdílená mapou i kartami) ===== */
function matchFilter(t,f){
  switch(f){
    case 'pesky':     return t.byFoot===true;
    case 'dest':      return !!(t.indoorOrCovered||t.rainOk);
    case 'deti':      return (t.category==='kids'||t.category==='animals'||(t.minAge<=4&&t.effort==='easy'))&&(t.bestFor||[]).some(b=>b==='toddler'||b==='child');
    case 'zviratka':  return t.category==='animals';
    case 'vyhledy':   return t.category==='viewpoint';
    case 'koupani':   return t.category==='water';
    case 'nenarocne': return t.effort==='easy';
    default:          return true; // 'vse'
  }
}
const FILTER_IDS=['vse','pesky','dest','deti','zviratka','vyhledy','koupani','nenarocne'];

function buildMapSection(trips,plan,lang,L){
  return `<div class="sec-h"><svg class="icon"><use href="#i-map"></use></svg><h2>${esc(L.mapTitle)}</h2></div>`
    +`<div class="mapwrap"><div id="map-inner">${renderMapInner(trips,plan,lang,L,'vse')}</div></div>`;
}

// Vnitřek mapy (SVG + popis + legenda) – přerenderovává se při změně filtru.
function renderMapInner(trips,plan,lang,L,filterId){
  const W=460,padX=30,padTop=34,padBot=34;
  const F='Instrument Sans,system-ui,sans-serif';
  const showPlan=filterId==='vse';
  const pickIds=new Set(plan.map(p=>p.pick&&p.pick.id).filter(Boolean));
  // rozdělení: „pěšky od vily" (schematický kroužek) vs. projektované (okolí + celý den)
  const villaZ=[],proj=[];
  trips.forEach((t,i)=>{ (t.zone==='villa'?villaZ:proj).push({t,num:i+1}); });
  const vis=o=>matchFilter(o.t,filterId);

  const kx=Math.cos(VILLA_COORDS.lat*Math.PI/180);
  const projPoint=(lat,lon)=>({rx:lon*kx,ry:-lat});
  // projektujeme jen NE-vila zóny + vilu; bbox drží kontextové kotvy (hranice/řeka)
  const raw=[{...projPoint(VILLA_COORDS.lat,VILLA_COORDS.lon),villa:true}]
    .concat(proj.map(o=>({...projPoint(o.t.coords.lat,o.t.coords.lon),villa:false})));
  const contextAnchors=[[50.795,15.44],[50.795,15.90],[50.600,15.82],[50.700,15.41],[50.700,15.92]].map(([la,lo])=>projPoint(la,lo));
  let minRx=Infinity,maxRx=-Infinity,minRy=Infinity,maxRy=-Infinity;
  for(const p of raw.concat(contextAnchors)){minRx=Math.min(minRx,p.rx);maxRx=Math.max(maxRx,p.rx);minRy=Math.min(minRy,p.ry);maxRy=Math.max(maxRy,p.ry);}
  const rxRange=maxRx-minRx,ryRange=maxRy-minRy;
  const scale=(W-2*padX)/Math.max(rxRange,1e-6);
  const H=Math.round(ryRange*scale+padTop+padBot);
  const X=lon=>padX+(lon*kx-minRx)*scale;
  const Y=lat=>padTop+(-lat-minRy)*scale;
  const pts=raw.map(p=>({x:padX+(p.rx-minRx)*scale,y:padTop+(p.ry-minRy)*scale,villa:p.villa}));
  // declutter projektovaných pinů: párová repulze 18px + TVRDÝ „moat" kolem vily
  // (VILLA_CLEAR) – drží piny mimo kroužek i mimo popisky vily; směr (azimut) se zachová.
  const vx0=pts[0].x,vy0=pts[0].y;
  const MIN=18,VILLA_CLEAR=52;
  for(let it=0;it<170;it++){
    for(let i=1;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      const a=pts[i],b=pts[j];
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||0.001;
      if(d<MIN){ const push=(MIN-d)/2,ux=dx/d,uy=dy/d; a.x-=ux*push;a.y-=uy*push;b.x+=ux*push;b.y+=uy*push; }
    }
    for(let i=1;i<pts.length;i++){ const p=pts[i];
      let dx=p.x-vx0,dy=p.y-vy0,d=Math.hypot(dx,dy)||0.001;
      if(d<VILLA_CLEAR){ p.x=vx0+dx/d*VILLA_CLEAR; p.y=vy0+dy/d*VILLA_CLEAR; }
      p.x=Math.max(padX,Math.min(W-padX,p.x));
      p.y=Math.max(padTop,Math.min(H-padBot,p.y));
    }
  }
  const vx=+pts[0].x.toFixed(1),vy=+pts[0].y.toFixed(1);
  // měřítko + severka
  const kmPerPx=110.574/scale;
  const target=0.3*(W-2*padX)*kmPerPx;
  const barKm=[2,5,10,15].reduce((a,b)=>Math.abs(b-target)<Math.abs(a-target)?b:a);
  const barPx=barKm/kmPerPx,sx=padX,sy=H-12;
  const northLetter=L.north||'N',nx=W-20;

  let svg=`<svg class="map" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(L.mapTitle)}">`
    +`<rect class="m-land" x="0" y="0" width="${W}" height="${H}" rx="12"/>`;

  // ===== geografický podklad (za piny) =====
  const XY=(la,lo)=>({x:X(lo),y:Y(la)});
  const bcp=[[50.792,15.42],[50.780,15.58],[50.762,15.71],[50.750,15.80],[50.747,15.92]];
  const borderLatAt=lon=>{ if(lon<=bcp[0][1])return bcp[0][0];
    for(let k=0;k<bcp.length-1;k++){const[la0,lo0]=bcp[k],[la1,lo1]=bcp[k+1];
      if(lon>=lo0&&lon<=lo1)return la0+(la1-la0)*(lon-lo0)/(lo1-lo0);}
    return bcp[bcp.length-1][0]; };
  const borderPts=bcp.map(([la,lo])=>XY(la,lo));
  // extrapolace hranice k oběma okrajům viewBoxu ve směru krajních segmentů
  // (širší bbox kvůli Adršpachu vpravo – žádná mezera, hranice plyne dál)
  const nB=borderPts.length;
  const slopeR=(borderPts[nB-1].x-borderPts[nB-2].x)?(borderPts[nB-1].y-borderPts[nB-2].y)/(borderPts[nB-1].x-borderPts[nB-2].x):0;
  const slopeL=(borderPts[1].x-borderPts[0].x)?(borderPts[1].y-borderPts[0].y)/(borderPts[1].x-borderPts[0].x):0;
  const rightY=borderPts[nB-1].y+slopeR*(W-borderPts[nB-1].x);
  const leftY=borderPts[0].y+slopeL*(0-borderPts[0].x);
  const bEnds=[{x:0,y:leftY},...borderPts,{x:W,y:rightY}];
  const borderPath=mapSmooth(bEnds);
  svg+=`<path class="m-foreign" d="${borderPath} L ${W} 0 L 0 0 Z"/>`;
  const rN=30,ridgeTop=[],ridgeBase=[];
  for(let i=0;i<=rN;i++){
    const t=i/rN,lon=15.42+(15.92-15.42)*t,by=Y(borderLatAt(lon)),base=by+15;
    const win=Math.max(0,Math.min(1,t/0.12,(1-t)/0.12));
    const bump=3.5+2.2*Math.sin(t*Math.PI*6)+1.3*Math.sin(t*Math.PI*9+0.6)+4.5*Math.exp(-Math.pow((lon-15.74)/0.03,2));
    ridgeBase.push({x:X(lon),y:base});
    ridgeTop.push({x:X(lon),y:base-(10+bump)*win});
  }
  const ridgeBot=ridgeBase.slice().reverse().map(p=>`L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');
  svg+=`<path class="m-ridge" d="${mapSmooth(ridgeTop)} ${ridgeBot} Z"/>`;
  svg+=`<path class="m-border" d="${borderPath}"/>`;
  const riverPts=[[50.690,15.735],[50.668,15.775],[50.645,15.800],[50.6255,15.8136],[50.612,15.836],[50.598,15.858]].map(([la,lo])=>XY(la,lo));
  svg+=`<path class="m-river" d="${mapSmooth(riverPts)}"/>`;
  // řídké popisky do prázdných míst (destinace pojmenovává legenda, ne mapa)
  svg+=`<text class="m-lbl" x="${X(15.5).toFixed(1)}" y="${Math.max(15,Y(50.8)-2).toFixed(1)}" text-anchor="middle">${esc(L.mapPoland)}</text>`
    +`<text class="m-lbl" x="${X(15.63).toFixed(1)}" y="${(Y(borderLatAt(15.63))+12).toFixed(1)}" text-anchor="middle">${esc(L.mapMountains)}</text>`
    +`<text class="m-lbl" x="${X(15.96).toFixed(1)}" y="${Y(50.53).toFixed(1)}" text-anchor="middle">Trutnov</text>`;

  // ===== schematický kroužek „pěšky od vily" =====
  // piny na SPODNÍM půlkruhu (na severu je hustý pás projektovaných pinů → dole je volno),
  // popisky vily jdou do čistého vnitřku kroužku nad značku.
  const R_RING=32,ringR=8;
  const vz=villaZ.filter(vis);
  const ringN=vz.length;
  const ringPos=vz.map((o,i)=>{
    const a=(ringN<=1?90:180*i/(ringN-1))*Math.PI/180; // 0°→180° = pravá→dole→levá
    return {o,x:vx+R_RING*Math.cos(a),y:vy+R_RING*Math.sin(a)};
  });
  if(ringN>0) svg+=`<circle class="m-ring-villa" cx="${vx}" cy="${vy}" r="${R_RING}"/>`;

  // spojnice vila → naplánované projektované piny (jen v režimu „Vše")
  if(showPlan) proj.forEach((o,i)=>{ if(!pickIds.has(o.t.id))return; const p=pts[i+1];
    svg+=`<line x1="${vx}" y1="${vy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#92703c" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="2 3"/>`;
  });

  // projektované piny (okolí + celý den)
  proj.forEach((o,i)=>{ if(!vis(o))return; const p=pts[i+1],x=p.x.toFixed(1),y=p.y.toFixed(1),t=o.t;
    const numFill=mapLum(t.accent)>0.62?'#2c302b':'#fff';
    svg+=`<a href="#${t.id}">`;
    if(showPlan&&pickIds.has(t.id)) svg+=`<circle cx="${x}" cy="${y}" r="11.5" fill="none" stroke="${t.accent}" stroke-opacity="0.35" stroke-width="3"/>`;
    svg+=`<circle cx="${x}" cy="${y}" r="8.5" fill="${t.accent}" stroke="#fff" stroke-width="1.5"/>`
      +`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" font-family="${F}" fill="${numFill}">${o.num}</text></a>`;
  });

  // piny na kroužku (pěšky od vily)
  ringPos.forEach(rp=>{ const t=rp.o.t,x=rp.x.toFixed(1),y=rp.y.toFixed(1);
    const numFill=mapLum(t.accent)>0.62?'#2c302b':'#fff';
    svg+=`<a href="#${t.id}">`;
    if(showPlan&&pickIds.has(t.id)) svg+=`<circle cx="${x}" cy="${y}" r="10.5" fill="none" stroke="${t.accent}" stroke-opacity="0.35" stroke-width="3"/>`;
    svg+=`<circle cx="${x}" cy="${y}" r="${ringR}" fill="${t.accent}" stroke="#fff" stroke-width="1.5"/>`
      +`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" font-family="${F}" fill="${numFill}">${rp.o.num}</text></a>`;
  });

  // vila navrchu + popisky (v čistém vnitřku kroužku, nad značkou)
  svg+=`<circle cx="${vx}" cy="${vy}" r="11" fill="#33493a"/>`
    +`<path d="M${vx-4} ${vy+4.5} L${vx-4} ${vy-0.5} L${vx} ${vy-4.5} L${vx+4} ${vy-0.5} L${vx+4} ${vy+4.5} Z" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>`;
  if(ringN>0) svg+=`<text x="${vx}" y="${(vy-27).toFixed(1)}" text-anchor="middle" font-size="7.5" font-weight="600" font-family="${F}" fill="#8a8272" letter-spacing="0.03em" paint-order="stroke" stroke="#ebe5d6" stroke-width="2.6" stroke-linejoin="round">${esc(L.ringLabel)}</text>`;
  svg+=`<text x="${vx}" y="${(vy-15).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" font-family="${F}" fill="#33493a" paint-order="stroke" stroke="#ebe5d6" stroke-width="3" stroke-linejoin="round">Villa Rudolf</text>`;
  // severka + měřítko
  svg+=`<g stroke="#33493a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M${nx} 22 L${nx} 8"/><path d="M${nx-3.5} 12 L${nx} 8 L${nx+3.5} 12"/></g>`
    +`<text x="${nx}" y="34" text-anchor="middle" font-size="9" font-weight="700" font-family="${F}" fill="#33493a">${northLetter}</text>`;
  svg+=`<g stroke="#73786d" stroke-width="1" stroke-linecap="round"><path d="M${sx} ${sy} H${(sx+barPx).toFixed(1)}"/><path d="M${sx} ${sy-3} V${sy+3}"/><path d="M${(sx+barPx).toFixed(1)} ${sy-3} V${sy+3}"/></g>`
    +`<text x="${sx}" y="${sy-6}" font-size="8" font-family="${F}" fill="#73786d">${barKm} km</text>`;
  svg+=`</svg>`;

  // ===== legenda: tři skupiny (pěšky / v okolí / na celý den) =====
  const groups=[['villa',L.legVilla],['near',L.legNear],['far',L.legFar]];
  let key='';
  for(const [zone,head] of groups){
    const items=trips.map((t,i)=>({t,num:i+1})).filter(o=>o.t.zone===zone&&matchFilter(o.t,filterId));
    if(!items.length)continue;
    key+=`<div class="mapkey-group"><div class="mapkey-h">${esc(head)}</div><div class="mapkey">`;
    for(const o of items){ const t=o.t,pick=showPlan&&pickIds.has(t.id);
      const short=esc(tt(t.name,lang).split('–')[0].split('(')[0].trim());
      const dist=t.byFoot?esc(L.mapFoot):(t.travelMin?esc(t.travelMin+' min'):esc(L.foot));
      key+=`<a href="#${t.id}" class="mk${pick?' pick':''}" style="--acc:${t.accent}"><span class="n">${o.num}</span><span class="t">${short}</span><span class="d">${dist}</span></a>`;
    }
    key+=`</div></div>`;
  }

  // popis pod mapou
  let cap='';
  if(showPlan) cap=esc(L.mapCaption);
  if(ringN>0) cap+=(cap?' · ':'')+esc(L.mapCapRing);
  const shown=proj.filter(vis).length+ringN;
  if(!cap) cap=shown+' '+esc(L.tripWord(shown));

  return `${svg}<div class="mapcap">${cap}</div>${key}`;
}

// Na #hash se skáče jen při prvním vykreslení – po úpravě skupiny se překresluje
// znovu a host by jinak odskočil od formuláře na starý cíl v URL.
let prvniVykresleni=true;
function render(data,token){
  const {guest,forecast}=data;
  FORECAST=forecast;
  const lang=Object.prototype.hasOwnProperty.call(I18N,guest.lang)?guest.lang:'de';
  const L=I18N[lang];
  document.documentElement.lang=lang;
  document.title=L.title;
  const party=guest.party||{adults:2,children:[]};
  const fl=partyFlags(party);
  const stay=daysBetween(guest.arrival,guest.departure);
  // odjezd před příjezdem nebo nečitelné datum = chyba zadání, ne prázdný plán (viz daysBetween)
  if(!stay.length||guest.departure<guest.arrival) throw new Error('stay');
  // katalog jen pro sezónu pobytu – lyžařské areály v září a koupaliště v lednu hosta jen matou;
  // v 'shoulder' (15. 10. – 30. 11.) zůstanou jen celoroční výlety
  const staySeasons=new Set(stay.map(seasonOf));
  const trips=data.trips.filter(t=>!t.seasons||!t.seasons.length||t.seasons.some(s=>staySeasons.has(s)));
  const days=stay.map(d=>({date:d, ...(wxFor(forecast,CFG.VILLA,d)||{})}));
  const plan=buildPlan(trips,days,fl);
  const today=localISO(new Date());
  const gen=forecast&&forecast.generatedAt?new Date(forecast.generatedAt):null;

  const childTxt=(party.children&&party.children.length)?`<span><svg class="icon"><use href="#i-users"></use></svg>${party.children.length} ${L.kids} (${esc(party.children.join(', '))})</span>`:'';
  // Lišta „toto je ukázka": portál už reálné hosty nezobrazuje (ti jsou přesměrováni na web)
  let html=`<div class="demo-bar" role="note"><svg class="icon"><use href="#i-info"></use></svg><span>${esc(L.demoBanner)}</span></div>`;
  html+=`<header class="hero">
    <div class="kick">Villa Rudolf · ${esc(L.region)}</div>
    <h1>${(fl.hasKids&&guest.name&&guest.name.last)?L.greetFamily(esc(guest.name.last)):esc(fl.hasKids?L.greet:L.greetGroup)}</h1>
    <div class="sub">${esc(fl.hasKids?L.welcome:L.welcomeGroup)}</div>
    <div class="party">
      <span><svg class="icon"><use href="#i-calendar"></use></svg>${fmtDate(guest.arrival,lang)} – ${fmtDate(guest.departure,lang)}</span>
      <span><svg class="icon"><use href="#i-users"></use></svg>${party.adults} ${L.adults}</span>${childTxt}
      <button type="button" class="party-edit" id="party-edit-btn" aria-expanded="false" aria-controls="edit-form"><svg class="icon"><use href="#i-edit"></use></svg>${esc(L.editParty)}</button>
    </div></header>
    <div class="card edit-form" id="edit-form" hidden>
      <h3>${esc(L.editTitle)}</h3>
      <div class="fld"><label for="ef-adults">${esc(L.editAdults)}</label>
        <input type="number" id="ef-adults" min="1" max="30" step="1" inputmode="numeric" value="${party.adults}"></div>
      <div class="fld"><label for="ef-kids">${esc(L.editKids)}</label>
        <input type="text" id="ef-kids" value="${esc((party.children||[]).join(', '))}"></div>
      <div class="fld"><label for="ef-moto">${esc(L.editInterests)}</label>
        <label class="chk"><input type="checkbox" id="ef-moto"${fl.isMoto?' checked':''}> ${esc(L.intMoto)}</label></div>
      <div class="btns"><button type="button" class="save" id="ef-save">${esc(L.editSave)}</button>
        <button type="button" class="close" id="ef-close">${esc(L.editClose)}</button></div>
    </div>`;

  // HERO – dnes / příjezd
  let heroDay=plan.find(p=>p.day.date===today)||null, heroLabel=L.today;
  if(!heroDay){
    if(today<guest.arrival){const dd=Math.round((new Date(guest.arrival)-new Date(today))/864e5);heroLabel=L.arrivingIn(dd);heroDay=plan[0];}
    else if(today>guest.departure){heroDay=null;}
  }
  if(heroDay&&heroDay.pick){const t=heroDay.pick;const bs=whyBadges(t,heroDay.day,fl,L);
    const hmx=Number(heroDay.day.max);
    const wxTxt=heroDay.day.cat?((CAT[heroDay.day.cat]||CAT.cloudy)[lang]+(Number.isFinite(hmx)?' · '+hmx+'°C':'')+' · '):'';
    html+=`<div class="today" style="--acc:${t.accent}">
      <div class="lbl">${esc(heroLabel)}</div>
      <h3><svg class="icon" style="color:${t.accent}"><use href="#i-${t.icon}"></use></svg> ${esc(tt(t.name,lang))}</h3>
      <div class="meta">${wxTxt}${esc(tt(t.tagline,lang))}</div>
      <div class="badges">${bs.map(b=>`<span class="badge ${b.k}">${esc(b.t)}</span>`).join('')}</div>
      <div class="alts"><a href="#${t.id}">${esc(L.detail)} →</a></div>
    </div>`;}
  else if(today>guest.departure){html+=`<div class="today"><h3>${esc(L.thanks)}</h3></div>`;}

  // PLÁN PODLE POČASÍ
  html+=`<div class="sec-h"><svg class="icon"><use href="#i-route"></use></svg><h2>${esc(L.plan)}</h2></div><div class="card">`;
  for(const p of plan){const t=p.pick;
    html+=`<div class="day"><div class="wx"><div class="dt">${fmtDate(p.day.date,lang)}</div>${wxCell(p.day.cat?p.day:null,lang)}</div><div class="pick">`;
    if(t){const bs=whyBadges(t,p.day,fl,L);
      html+=`<div class="nm" style="--acc:${t.accent}"><span class="acc"></span><a href="#${t.id}" style="text-decoration:none;color:inherit">${esc(tt(t.name,lang))}</a></div>
        <div class="badges">${bs.map(b=>`<span class="badge ${b.k}">${esc(b.t)}</span>`).join('')}</div>`;
      if(p.alts.length)html+=`<div class="alts">${L.alt}: ${p.alts.map(a=>`<a href="#${a.id}">${esc(tt(a.name,lang).split('–')[0].split('(')[0].trim())}</a>`).join(' · ')}</div>`;
    }
    html+=`</div></div>`;}
  html+=`</div><div class="note"><svg class="icon"><use href="#i-info"></use></svg><span>${esc(L.planNote)}</span></div>`;

  // PŘEHLEDOVÁ MAPKA
  html+=buildMapSection(trips,plan,lang,L);

  // Karta výletu. compact=true → <details>: sbalená hlavička, jedno klepnutí ji rozbalí.
  // Značka .trip a nadpis h3 musí zůstat i ve sbalené variantě – závisí na nich Umami tracking (track.js).
  function tripCard(t,compact){
    const openNote=tt(t.openNote,lang),price=tt(t.price,lang);
    // travelMin 0 = výlet startuje u domu (okružní trasa) – „0 min autem" by byl nesmysl
    const doprava=t.byFoot?L.byFoot:(t.travelMin?(t.travelMin+' '+L.min):L.foot);
    const hlava=`<div class="tg">${esc(tt(t.tagline,lang))}</div>
      <h3><svg class="icon" style="color:${t.accent}"><use href="#i-${t.icon}"></use></svg> ${esc(tt(t.name,lang))}</h3>`;
    let telo=`<p>${esc(tt(t.desc,lang))}</p>
      <div class="facts">
        <div><div class="lbl">${L.openLabel}</div>${esc(openNote)}</div>
        <div><div class="lbl">${L.priceLabel}</div>${esc(price)}</div>
        <div><div class="lbl">${L.transport}</div>${doprava}</div>
      </div>`;
    const warns=[];
    if(t.group&&t.group.reservation&&fl.isGroup)warns.push(L.reservation);
    if(t.crossBorderId&&(party.children&&party.children.length))warns.push(L.idDocs);
    if(t.group&&t.group.capacity)warns.push(L.capacity);
    for(const wn of warns)telo+=`<div class="note"><svg class="icon"><use href="#i-alert"></use></svg><span>${esc(wn)}</span></div>`;
    telo+=`<div class="links">${(t.links||[]).map(l=>`<a target="_blank" rel="noopener" href="${esc((l.urlByLang&&l.urlByLang[lang])||l.url)}"><svg class="icon"><use href="#i-${l.icon}"></use></svg><span>${esc(tt(l.label,lang))}</span></a>`).join('')}</div>`;
    if(!compact)return `<div class="card trip" id="${t.id}" style="--acc:${t.accent}">${hlava}${telo}</div>`;
    return `<details class="card trip" id="${t.id}" style="--acc:${t.accent}"><summary>`
      +`<div class="sum">${hlava}<div class="smeta">${doprava}</div></div>`
      +`<svg class="icon chev"><use href="#i-chevron"></use></svg></summary>${telo}</details>`;
  }

  // DOPORUČENÍ (výlety z plánu podle počasí) + zbytek katalogu sbalený
  const recIds=new Set();
  for(const p of plan){ if(p.pick)recIds.add(p.pick.id); (p.alts||[]).forEach(a=>recIds.add(a.id)); }
  const recTrips=trips.filter(t=>recIds.has(t.id)),restTrips=trips.filter(t=>!recIds.has(t.id));

  if(recTrips.length){
    html+=`<div class="sec-h"><svg class="icon"><use href="#i-route"></use></svg><h2>${esc(L.recTitle)}</h2></div>`;
    for(const t of recTrips)html+=tripCard(t,false);
  }
  // Bez plánu (host už odjel) není co doporučovat – zbytek je pak prostě celý katalog.
  html+=`<div class="sec-h"><svg class="icon"><use href="#i-pin"></use></svg><h2>${esc(recTrips.length?L.moreTitle:L.allTrips)}</h2></div>`;
  html+=`<div class="chips">`
    +FILTER_IDS.map(f=>`<button type="button" class="chip${f==='vse'?' on':''}" data-f="${f}">${esc(L.filters[f])}</button>`).join('')
    +`<span class="chip-count" id="chip-count">${restTrips.length} ${esc(L.tripWord(restTrips.length))}</span></div>`;
  for(const t of restTrips)html+=tripCard(t,true);

  // Patička: zdroj počasí, odkaz na podmínky / ochranu údajů (čl. 13 GDPR) a věta o anonymní analytice
  html+=`<footer><p>${esc(L.footer)}</p><p>${esc(L.wxLive)}${gen?(' · '+L.updated+' '+gen.toLocaleString(locale(lang),{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})):''}</p>`
    +`<p><a href="${CFG.PRIVACY_URL}?lang=${encodeURIComponent(lang)}" target="_blank" rel="noopener">${esc(L.privacy)}</a> · ${esc(L.analytics)}</p></footer>`;
  document.getElementById('app').innerHTML=html;

  // ===== Úprava skupiny: ovládání formuláře =====
  const form=document.getElementById('edit-form');
  const btn=document.getElementById('party-edit-btn');
  if(form&&btn){
    const open=()=>{form.hidden=false;btn.setAttribute('aria-expanded','true');const a=document.getElementById('ef-adults');if(a)a.focus();};
    const close=()=>{form.hidden=true;btn.setAttribute('aria-expanded','false');};
    btn.addEventListener('click',()=>{form.hidden?open():close();});
    const closeBtn=document.getElementById('ef-close');
    if(closeBtn)closeBtn.addEventListener('click',close);
    const saveBtn=document.getElementById('ef-save');
    if(saveBtn)saveBtn.addEventListener('click',()=>{
      const adultsRaw=(document.getElementById('ef-adults')||{}).value;
      const kidsRaw=(document.getElementById('ef-kids')||{}).value;
      const motoEl=document.getElementById('ef-moto');
      const np=parseParty(adultsRaw,kidsRaw,motoEl&&motoEl.checked?['moto']:[]);
      savePartyOverride(token,np);
      data.guest.party=np;
      render(data,token); // přerenderuj celé UI s novým party (plán se přepočítá)
    });
  }

  // ===== Filtrační chipy: skrytí karet + přerenderování mapy + počet =====
  // Filtruje se jen sekce „Další výlety“; doporučení z plánu zůstávají vidět vždy.
  const chips=document.querySelectorAll('.chip');
  const mapInner=document.getElementById('map-inner');
  const countEl=document.getElementById('chip-count');
  function applyFilter(fid){
    chips.forEach(c=>c.classList.toggle('on',c.dataset.f===fid));
    let n=0;
    for(const t of restTrips){ const el=document.getElementById(t.id); if(!el)continue;
      const show=matchFilter(t,fid); el.hidden=!show; if(show)n++; }
    if(mapInner) mapInner.innerHTML=renderMapInner(trips,plan,lang,L,fid);
    if(countEl) countEl.textContent=n+' '+L.tripWord(n);
  }
  chips.forEach(c=>c.addEventListener('click',()=>applyFilter(c.dataset.f)));

  // ===== Skok na #výlet: sbalenou kartu rovnou rozbal =====
  // Jinak by cíl z mapy/plánu skončil na zavřené kartě a detail by byl zase na dvě klepnutí.
  function otevriCil(scroll){
    let id='';
    try{id=decodeURIComponent(location.hash.slice(1));}catch(e){return;} // rozbitý hash nesmí shodit render()
    if(!id)return;
    const el=document.getElementById(id);
    if(!el)return;
    document.querySelectorAll('.trip.cil').forEach(e=>e.classList.remove('cil'));
    el.classList.add('cil');
    if(el.tagName==='DETAILS')el.open=true;
    if(scroll)el.scrollIntoView(); // po prvním vykreslení: karta v době skoku ještě neexistovala
  }
  window.onhashchange=()=>otevriCil(false);
  otevriCil(prvniVykresleni);
  prvniVykresleni=false;
}

/* ===== 8. Start ===== */
(async function(){
  // Host s tokenem jde na web – tady se pak nic nenačítá ani nerenderuje.
  if(presmerujHosta()) return;
  registrujSW();
  const token='demo';
  try{
    const [guest,tripsRaw,forecast]=await Promise.all([
      loadGuest(),
      fetch(CFG.TRIPS_URL).then(r=>r.json()),
      fetch(CFG.FORECAST_URL).then(r=>r.json()).catch(()=>null)
    ]);
    const trips=(tripsRaw&&Array.isArray(tripsRaw.trips)?tripsRaw.trips:[]).map(sanitizeTrip).filter(Boolean);
    // Party: v demu je localStorage ('vr-party-demo') jediný zdroj úprav – bez PII.
    const ov=loadPartyOverride(token);
    const p=ov||guest.party||{adults:2,children:[]};
    // jedna normalizace pro demo i localStorage (clamp, whitelist zájmů)
    guest.party=parseParty(p.adults==null?2:p.adults,(p.children||[]).join(','),p.interests);
    render({guest,trips,forecast},token);
  }catch(e){
    // Jazyk hosta tu ještě známý být nemusí – hláška je ve všech čtyřech.
    const msg='Průvodce se nepodařilo načíst – zkuste to prosím za chvíli. / Der Guide konnte nicht geladen werden – bitte später erneut versuchen. / The guide could not be loaded – please try again later. / Nie udało się wczytać przewodnika – spróbujcie ponownie za chwilę.';
    document.getElementById('app').innerHTML='<div class="loading">'+msg+'</div>';
    console.error(e);
  }
})();

/* ===== Service worker (PWA, offline) — relativní cesta kvůli GH Pages subpath ===== */
function registrujSW(){
  try{
    if('serviceWorker' in navigator){
      window.addEventListener('load',function(){
        navigator.serviceWorker.register('./sw.js').catch(function(e){console.warn('SW',e);});
      });
    }
  }catch(e){/* jsdom apod. — SW není k dispozici */}
}
