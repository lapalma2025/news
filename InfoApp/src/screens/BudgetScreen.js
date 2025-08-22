// src/components/politician/YourMPsComponent.js
import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
    Alert, RefreshControl, TextInput, Linking, Pressable, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/* ================== KOLORY ================== */
const COLORS = {
    primary: '#1f6feb',
    background: '#f6f8fa',
    white: '#ffffff',
    border: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706',
    gray: '#9ca3af',
    black: '#000000',
    lightGray: '#f3f4f6',
};

/* ================== UTILS ================== */
const norm = (s) =>
    String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const mapVoteToPL = (vote) => {
    switch (vote) {
        case 'YES': return 'ZA';
        case 'NO': return 'PRZECIW';
        case 'ABSTAIN': return 'WSTRZYMAŁ SIĘ';
        default: return 'NIEOBECNY';
    }
};

const byNamePL = (a, b) => {
    const cmpL = (a?.lastName || '').localeCompare(b?.lastName || '', 'pl', { sensitivity: 'base' });
    if (cmpL !== 0) return cmpL;
    return (a?.firstName || '').localeCompare(b?.firstName || '', 'pl', { sensitivity: 'base' });
};

/* ================== STAŁE & ALIASY ================== */
// ISO → PL
const ISO_VOIV = new Map(Object.entries({
    'PL-DS': 'dolnośląskie', 'PL-SL': 'śląskie', 'PL-MA': 'małopolskie', 'PL-WP': 'wielkopolskie',
    'PL-MZ': 'mazowieckie', 'PL-ZP': 'zachodniopomorskie', 'PL-PM': 'pomorskie', 'PL-KP': 'kujawsko-pomorskie',
    'PL-LD': 'łódzkie', 'PL-LB': 'lubuskie', 'PL-LU': 'lubelskie', 'PL-PK': 'podkarpackie',
    'PL-PD': 'podlaskie', 'PL-OP': 'opolskie', 'PL-SK': 'świętokrzyskie', 'PL-WN': 'warmińsko-mazurskie'
}));

// EN/warianty → PL
const VOIV_CANON = new Map(Object.entries({
    'dolnoslaskie': 'dolnośląskie', 'dolnośląskie': 'dolnośląskie', 'dolnośląskiego': 'dolnośląskie', 'lower silesian': 'dolnośląskie',
    'slaskie': 'śląskie', 'śląskie': 'śląskie', 'śląskiego': 'śląskie', 'silesian': 'śląskie',
    'malopolskie': 'małopolskie', 'małopolskie': 'małopolskie', 'małopolskiego': 'małopolskie', 'lesser poland': 'małopolskie',
    'wielkopolskie': 'wielkopolskie', 'wielkopolskiego': 'wielkopolskie', 'greater poland': 'wielkopolskie',
    'mazowieckie': 'mazowieckie', 'mazowieckiego': 'mazowieckie', 'masovian': 'mazowieckie',
    'zachodniopomorskie': 'zachodniopomorskie', 'zachodniopomorskiego': 'zachodniopomorskie', 'west pomeranian': 'zachodniopomorskie',
    'pomorskie': 'pomorskie', 'pomorskiego': 'pomorskie', 'pomeranian': 'pomorskie',
    'kujawsko pomorskie': 'kujawsko-pomorskie', 'kujawsko-pomorskie': 'kujawsko-pomorskie', 'kuyavian pomeranian': 'kujawsko-pomorskie',
    'lodzkie': 'łódzkie', 'łódzkie': 'łódzkie', 'lodzkiego': 'łódzkie', 'lodz': 'łódzkie',
    'lubuskie': 'lubuskie', 'lubuskiego': 'lubuskie', 'lubusz': 'lubuskie',
    'lubelskie': 'lubelskie', 'lubelskiego': 'lubelskie', 'lublin': 'lubelskie',
    'podkarpackie': 'podkarpackie', 'podkarpackiego': 'podkarpackie', 'subcarpathian': 'podkarpackie',
    'podlaskie': 'podlaskie', 'podlaskiego': 'podlaskie',
    'opolskie': 'opolskie', 'opolskiego': 'opolskie', 'opole': 'opolskie',
    'swietokrzyskie': 'świętokrzyskie', 'świętokrzyskie': 'świętokrzyskie', 'swietokrzyskiego': 'świętokrzyskie',
    'warminsko mazurskie': 'warmińsko-mazurskie', 'warmińsko-mazurskie': 'warmińsko-mazurskie', 'warmian masurian': 'warmińsko-mazurskie'
}));

function canonVoivName(raw) {
    if (!raw) return null;
    let v = String(raw).toLowerCase()
        .replace(/^wojew[oó]dztw[oa]\s+/, '')
        .replace(/\s+voivodeship$/, '')
        .trim();
    if (VOIV_CANON.has(v)) return VOIV_CANON.get(v);
    return v;
}

function fixCountyLabel(raw) {
    if (!raw) return null;
    const s = norm(raw);
    // Nominatim potrafi zwrócić "Środa Śląska County" / "Powiat średzki"
    if (s.includes('sroda slaska')) return 'powiat średzki';
    if (s.includes('sroda wielkopolska')) return 'powiat średzki';
    if (s.endsWith(' county')) return `powiat ${s.replace(/\s*county$/, '').trim()}`;
    if (!/^powiat\s/.test(raw.toLowerCase()) && !/miasto/.test(raw.toLowerCase())) {
        // Czasem zwraca sam rdzeń ("krośnieński")
        return `powiat ${raw}`;
    }
    return raw;
}

function normalizeVoivFromGeo(geo) {
    const iso = geo?.ISO3166_2_lvl4 || geo?.isoCode || null;
    if (iso && ISO_VOIV.has(iso)) return ISO_VOIV.get(iso);
    let v = String(geo?.voivodeship || geo?.state || '').toLowerCase();
    v = v.replace(/^wojew[oó]dztwo\s+/, '').replace(/\s+voivodeship$/, '').trim();
    return canonVoivName(v);
}

/* ================== CSV PKW (pełne) ==================
   Uwaga: zostawiamy oficjalny CSV z Twoich danych.
   Dla 8/21/24/33 PKW opisuje „województwo X” – dodamy ręcznie listy powiatów/miast,
   żeby można było zbudować klucze county||voiv/city||voiv.
*/
const PKW_CSV = `"Numer okręgu";"Liczba mandatów";"Liczba list";"Liczba kandydatów";"Mieszkańcy";"Wyborcy";"Siedziba OKW";"Opis granic"
1;12;7;157;884568;705355;"Legnica";"część województwa dolnośląskiego obejmująca obszary powiatów: bolesławiecki, głogowski, jaworski, kamiennogórski, karkonoski, legnicki, lubański, lubiński, lwówecki, polkowicki, zgorzelecki, złotoryjski oraz miast na prawach powiatu: Jelenia Góra, Legnica"
2;8;7;107;578649;469771;"Wałbrzych";"część województwa dolnośląskiego obejmująca obszary powiatów: dzierżoniowski, kłodzki, świdnicki, wałbrzyski, ząbkowicki oraz miasta na prawach powiatu: Wałbrzych"
3;14;7;186;1202108;991398;"Wrocław";"część województwa dolnośląskiego  obejmująca obszary powiatów:  górowski, milicki, oleśnicki, oławski, strzeliński, średzki, trzebnicki, wołowski, wrocławski  oraz miasta na prawach powiatu:  Wrocław"
4;12;7;157;924917;736102;"Bydgoszcz";"część województwa kujawsko-pomorskiego obejmująca obszary powiatów: bydgoski, inowrocławski, mogileński, nakielski, sępoleński, świecki, tucholski, żniński oraz miasta na prawach powiatu: Bydgoszcz"
5;13;8;181;967871;766803;"Toruń";"część województwa kujawsko-pomorskiego obejmująca obszary powiatów: aleksandrowski, brodnicki, chełmiński, golubsko-dobrzyński, grudziądzki, lipnowski, radziejowski, rypiński, toruński, wąbrzeski, włocławski oraz miast na prawach powiatu: Grudziądz, Toruń, Włocławek"
6;15;8;218;1128896;892899;"Lublin";"część województwa lubelskiego obejmująca obszary powiatów: janowski, kraśnicki, lubartowski, lubelski, łęczyński, łukowski, opolski, puławski, rycki, świdnicki oraz miasta na prawach powiatu: Lublin"
7;12;8;176;877849;684520;"Chełm";"część województwa lubelskiego obejmująca obszary powiatów: bialski, biłgorajski, chełmski, hrubieszowski, krasnostawski, parczewski, radzyński, tomaszowski, włodawski, zamojski oraz miast na prawach powiatu: Biała Podlaska, Chełm, Zamość"
8;12;8;170;930419;731347;"Zielona Góra";"województwo lubuskie"
9;10;7;130;686258;574427;"Łódź";"część województwa łódzkiego obejmująca obszary powiatów: brzeziński, łódzki wschodni oraz miasta na prawach powiatu: Łódź"
10;9;8;130;681155;534429;"Piotrków Trybunalski";"część województwa łódzkiego obejmująca obszary powiatów: bełchatowski, opoczyński, piotrkowski, radomszczański, rawski, skierniewicki, tomaszowski oraz miast na prawach powiatu: Piotrków Trybunalski, Skierniewice"
11;12;8;175;905805;724571;"Sieradz";"część województwa łódzkiego obejmująca obszary powiatów: kutnowski, łaski, łęczycki, łowicki, pabianicki, pajęczański, poddębicki, sieradzki, wieluński, wieruszowski, zduńskowolski, zgierski"
12;8;7;110;624941;488478;"Kraków";"część województwa małopolskiego obejmująca obszary powiatów: chrzanowski, myślenicki, oświęcimski, suski, wadowicki"
13;14;7;184;1139919;942480;"Kraków";"część województwa małopolskiego obejmująca obszary powiatów: krakowski, miechowski, olkuski oraz miasta na prawach powiatu: Kraków"
14;10;7;133;786802;595980;"Nowy Sącz";"część województwa małopolskiego obejmująca obszary powiatów: gorlicki, limanowski, nowosądecki, nowotarski, tatrzański oraz miasta na prawach powiatu: Nowy Sącz"
15;9;7;123;724866;563478;"Tarnów";"część województwa małopolskiego obejmująca obszary powiatów: bocheński, brzeski, dąbrowski, proszowicki, tarnowski, wielicki oraz miasta na prawach powiatu: Tarnów"
16;10;7;135;782080;619635;"Płock";"część województwa mazowieckiego obejmująca obszary powiatów: ciechanowski, gostyniński, mławski, płocki, płoński, przasnyski, sierpecki, sochaczewski, żuromiński, żyrardowski oraz miasta na prawach powiatu: Płock"
17;9;8;130;670809;527564;"Radom";"część województwa mazowieckiego obejmująca obszary powiatów: białobrzeski, grójecki, kozienicki, lipski, przysuski, radomski, szydłowiecki, zwoleński oraz miasta na prawach powiatu: Radom"
18;12;9;193;930131;725834;"Siedlce";"część województwa mazowieckiego obejmująca obszary powiatów: garwoliński, łosicki, makowski, miński, ostrołęcki, ostrowski, pułtuski, siedlecki, sokołowski, węgrowski, wyszkowski oraz miasta na prawach powiatu: Ostrołęka, Siedlce"
19;20;7;262;1639667;1927793;"Warszawa";"część województwa mazowieckiego obejmująca obszar miasta na prawach powiatu: Warszawa; zagranica; statki"
20;12;7;159;1127706;876706;"Warszawa";"część województwa mazowieckiego obejmująca obszary powiatów: grodziski, legionowski, nowodworski, otwocki, piaseczyński, pruszkowski, warszawski zachodni, wołomiński"
21;12;8;184;901617;730417;"Opole";"województwo opolskie"
22;11;7;140;838008;652328;"Krosno";"część województwa podkarpackiego obejmująca obszary powiatów: bieszczadzki, brzozowski, jarosławski, jasielski, krośnieński, leski, lubaczowski, przemyski, przeworski, sanocki oraz miast na prawach powiatu: Krosno, Przemyśl"
23;15;7;195;1220907;947474;"Rzeszów";"część województwa podkarpackiego obejmująca obszary powiatów: dębicki, kolbuszowski, leżajski, łańcucki, mielecki, niżański, ropczycko-sędziszowski, rzeszowski, stalowowolski, strzyżowski, tarnobrzeski oraz miasta na prawach powiatu: Rzeszów, Tarnobrzeg"
24;14;8;203;1108053;868241;"Białystok";"województwo podlaskie"
25;12;7;163;1000568;813135;"Gdańsk";"część województwa pomorskiego obejmująca obszary powiatów: gdański, kwidzyński, malborski, nowodworski, starogardzki, sztumski, tczewski  oraz miast na prawach powiatu: Gdańsk, Sopot"
26;14;7;187;1175123;910676;"Słupsk";"część województwa pomorskiego obejmująca obszary powiatów: bytowski, chojnicki, człuchowski, kartuski, kościerski, lęborski, pucki, słupski, wejherowski oraz miast na prawach powiatu: Gdynia, Słupsk"
27;9;8;129;737912;578133;"Bielsko-Biała";"część województwa śląskiego obejmująca obszary powiatów: bielski, cieszyński, pszczyński, żywiecki oraz miasta na prawach powiatu: Bielsko-Biała"
28;7;7;92;547045;441106;"Częstochowa";"część województwa śląskiego obejmująca obszary powiatów: częstochowski, kłobucki, lubliniecki, myszkowski oraz miasta na prawach powiatu: Częstochowa"
29;9;7;122;672575;545201;"Katowice";"część województwa śląskiego obejmująca obszary powiatów: gliwicki, tarnogórski oraz miast na prawach powiatu: Bytom, Gliwice, Zabrze"
30;9;7;124;670420;530008;"Bielsko-Biała";"część województwa śląskiego obejmująca obszary powiatów: mikołowski, raciborski, rybnicki, wodzisławski oraz miast na prawach powiatu: Jastrzębie-Zdrój, Rybnik, Żory"
31;12;7;150;854693;695432;"Katowice";"część województwa śląskiego obejmująca obszar powiatu: bieruńsko-lędziński oraz miast na prawach powiatu: Chorzów, Katowice, Mysłowice, Piekary Śląskie, Ruda Śląska, Siemianowice Śląskie, Świętochłowice, Tychy"
32;9;7;119;610295;499586;"Katowice";"część województwa śląskiego obejmująca obszary powiatów: będziński, zawierciański oraz miast na prawach powiatu: Dąbrowa Górnicza, Jaworzno, Sosnowiec"
33;16;9;252;1166405;933071;"Kielce";"województwo świętokrzyskie"
34;8;8;116;576370;449980;"Elbląg";"część województwa warmińsko-mazurskiego obejmująca obszary powiatów: bartoszycki, braniewski, działdowski, elbląski, iławski, lidzbarski, nowomiejski, ostródzki oraz miasta na prawach powiatu: Elbląg"
35;10;7;134;741708;581013;"Olsztyn";"część województwa warmińsko-mazurskiego obejmująca obszary powiatów: ełcki, giżycki, gołdapski, kętrzyński, mrągowski, nidzicki, olecki, olsztyński, piski, szczycieński, węgorzewski oraz miasta na prawach powiatu: Olsztyn"
36;12;7;160;958820;749353;"Kalisz";"część województwa wielkopolskiego obejmująca obszary powiatów: gostyński, jarociński, kaliski, kępiński, kościański, krotoszyński, leszczyński, ostrowski, ostrzeszowski, pleszewski, rawicki oraz miasta na prawach powiatu: Kalisz, Leszno"
37;9;8;135;742934;580833;"Konin";"część województwa wielkopolskiego obejmująca obszary powiatów: gnieźnieński, kolski, koniński, słupecki, średzki, śremski, turecki, wrzesiński oraz miasta na prawach powiatu: Konin"
38;9;7;122;745025;575230;"Piła";"część województwa wielkopolskiego obejmująca obszary powiatów: chodzieski, czarnkowsko-trzcianecki, grodziski, międzychodzki, nowotomyski, obornicki, pilski, szamotulski, wągrowiecki, wolsztyński, złotowski"
39;10;6;118;866222;712724;"Poznań";"część województwa wielkopolskiego obejmująca obszar powiatu: poznański oraz miasta na prawach powiatu: Poznań"
40;8;7;104;583587;459778;"Koszalin";"część województwa zachodniopomorskiego  obejmująca obszary powiatów: białogardzki, choszczeński, drawski, kołobrzeski, koszaliński, sławieński, szczecinecki, świdwiński, wałecki oraz miasta na prawach powiatu: Koszalin"
41;12;8;168;945227;758332;"Szczecin";"część województwa zachodniopomorskiego obejmująca obszary powiatów: goleniowski, gryficki, gryfiński, kamieński, łobeski, myśliborski, policki, pyrzycki, stargardzki oraz miast na prawach powiatu: Szczecin, Świnoujście"
`;

/* „Pełne” województwa – ręczne listy powiatów + miast na prawach powiatu */
const FULL_VOIV_SUPP = {
    'lubuskie': {
        district: 8,
        powiaty: ['gorzowski', 'krośnieński', 'międzyrzecki', 'nowosolski', 'słubicki', 'strzelecko-drezdenecki', 'sulęciński', 'świebodziński', 'wschowski', 'zielonogórski', 'żagański', 'żarski'],
        miasta: ['Gorzów Wielkopolski', 'Zielona Góra']
    },
    'opolskie': {
        district: 21,
        powiaty: ['brzeski', 'głubczycki', 'kędzierzyńsko-kozielski', 'kluczborski', 'krapkowicki', 'namysłowski', 'nyski', 'oleski', 'opolski', 'prudnicki', 'strzelecki'],
        miasta: ['Opole']
    },
    'podlaskie': {
        district: 24,
        powiaty: ['augustowski', 'białostocki', 'bielski', 'grajewski', 'hajnowski', 'kolneński', 'łomżyński', 'moniecki', 'sejneński', 'siemiatycki', 'sokólski', 'suwalski', 'wysokomazowiecki', 'zambrowski'],
        miasta: ['Białystok', 'Łomża', 'Suwałki']
    },
    'świętokrzyskie': {
        district: 33,
        powiaty: ['buski', 'jędrzejowski', 'kazimierski', 'kielecki', 'konecki', 'opatowski', 'ostrowiecki', 'pińczowski', 'sandomierski', 'skarżyski', 'starachowicki', 'staszowski', 'włoszczowski'],
        miasta: ['Kielce']
    }
};

/* ================== Budowa map z CSV ================== */
function buildDistrictMapsFromCSV(csv) {
    const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
    lines.shift();

    const countyMap = new Map();         // "powiat średzki" → nr (fallback)
    const cityMap = new Map();           // "Gdańsk" → nr (fallback)
    const voivMap = new Map();           // "województwo lubuskie" → nr (dla info)
    const countyVoivMap = new Map();     // "powiat średzki||dolnośląskie" → nr
    const cityVoivMap = new Map();       // "Gdańsk||pomorskie" → nr

    for (const line of lines) {
        const parts = line.split(';');
        const district = parseInt(parts[0], 10);
        const opis = (parts[7] || '').replace(/^"|"$/g, '');
        if (!Number.isFinite(district) || !opis) continue;

        const voivMatch = opis.match(/wojew[oó]dztw[oa]\s+([a-ząćęłńóśźż\- ]+?)(?:\s+obejm|$)/i);
        const voivCanon = canonVoivName(voivMatch ? voivMatch[1] : null);
        if (voivCanon) voivMap.set(norm(`województwo ${voivCanon}`), district);

        // powiaty:
        const powiatyMatch = opis.match(/powiatów:\s*([^;"]+?)(?:\s*oraz\s*miast.*)?$/i);
        if (powiatyMatch) {
            powiatyMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
                const label = `powiat ${name.replace(/\.$/, '')}`;
                const key = norm(label);
                countyMap.set(key, district);
                if (voivCanon) countyVoivMap.set(`${key}||${norm(voivCanon)}`, district);
            });
        }

        // miasta na prawach powiatu:
        const miastaMatch = opis.match(/miast(?:a)? na prawach powiatu:\s*([^;"]+)$/i);
        if (miastaMatch) {
            miastaMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(city => {
                const cKey = norm(city);
                cityMap.set(cKey, district);
                if (voivCanon) cityVoivMap.set(`${cKey}||${norm(voivCanon)}`, district);
            });
        }
    }

    // dopełnij pełne województwa
    for (const [voiv, { district, powiaty, miasta }] of Object.entries(FULL_VOIV_SUPP)) {
        voivMap.set(`województwo ${norm(voiv)}`, district);
        for (const p of powiaty) {
            const key = norm(`powiat ${p}`);
            countyMap.set(key, district);
            countyVoivMap.set(`${key}||${norm(voiv)}`, district);
        }
        for (const c of miasta) {
            const cKey = norm(c);
            cityMap.set(cKey, district);
            cityVoivMap.set(`${cKey}||${norm(voiv)}`, district);
        }
    }

    return { countyMap, cityMap, voivMap, countyVoivMap, cityVoivMap };
}

const {
    countyMap: COUNTY_TO_DISTRICT,
    cityMap: CITY_TO_DISTRICT,
    voivMap: VOIV_TO_DISTRICT,
    countyVoivMap: COUNTY_VOIV_TO_DISTRICT,
    cityVoivMap: CITY_VOIV_TO_DISTRICT
} = buildDistrictMapsFromCSV(PKW_CSV);

/* ================== Geokodowanie ================== */
async function geocodePostalCodePL(postalRaw) {
    const postal = String(postalRaw || '').trim();
    if (!postal) return null;
    const candidates = [
        postal,
        postal.replace(/\D+/g, '').replace(/^(\d{2})(\d{3})$/, '$1-$2'),
    ];

    for (const q of candidates) {
        const url = `https://nominatim.openstreetmap.org/search?country=Poland&postalcode=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'InfoApp/1.0 (contact@example.com)' } });
        if (!res.ok) continue;
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length) {
            const a = arr[0].address || {};
            return {
                ISO3166_2_lvl4: arr[0].ISO3166_2_lvl4,
                voivodeship: a.state || null,
                county: a.county || a.state_district || a.municipality || null,
                cityCounty: a.city || a.town || a.village || null,
            };
        }
    }
    return null;
}

/* ================== Sejm API ================== */
const API = {
    MPs: 'https://api.sejm.gov.pl/sejm/term10/MP',
    MP: (id) => `https://api.sejm.gov.pl/sejm/term10/MP/${id}`,
    MP_PHOTO_MINI: (id) => `https://api.sejm.gov.pl/sejm/term10/MP/${id}/photo-mini`,
    PROCEEDINGS: 'https://api.sejm.gov.pl/sejm/term10/proceedings',
    MP_VOTES_FOR_DAY: (mpId, sitting, ymd) => `https://api.sejm.gov.pl/sejm/term10/MP/${mpId}/votings/${sitting}/${ymd}`,
};
const sejmVotingUrl = (sitting, votingNumber) =>
    `https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=glosowania&NrKadencji=10&NrPosiedzenia=${encodeURIComponent(sitting)}&NrGlosowania=${encodeURIComponent(votingNumber)}`;

let PROCEEDINGS_CACHE = null;

/* ================== Votings ================== */
async function collectVotesForMP(mpId, dayWindow) {
    if (!PROCEEDINGS_CACHE) {
        const res = await fetch(API.PROCEEDINGS);
        if (!res.ok) throw new Error(`PROCEEDINGS ${res.status}`);
        PROCEEDINGS_CACHE = await res.json();
    }

    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() - dayWindow);

    const sittings = (PROCEEDINGS_CACHE || [])
        .filter(s => Array.isArray(s.dates) && s.dates.length)
        .map(s => ({
            number: s.number ?? s.num,
            dates: s.dates
                .map(d => new Date(d))
                .filter(d => !isNaN(d) && d <= now && d >= limit)
                .sort((a, b) => b - a),
        }))
        .filter(s => s.number && s.dates.length)
        .sort((a, b) => (b.dates[0] - a.dates[0]));

    const out = [];
    for (const s of sittings) {
        for (const d of s.dates) {
            const ymd = d.toISOString().slice(0, 10);
            try {
                const r = await fetch(API.MP_VOTES_FOR_DAY(mpId, s.number, ymd));
                if (!r.ok) continue;
                const arr = await r.json();
                if (!Array.isArray(arr) || !arr.length) continue;

                arr.sort((a, b) => {
                    const da = new Date(a.date || 0);
                    const db = new Date(b.date || 0);
                    if (+db !== +da) return db - da;
                    return (b.votingNumber || 0) - (a.votingNumber || 0);
                });

                for (const v of arr) {
                    out.push({
                        topic: v.title || v.description || v.topic || 'Głosowanie',
                        vote: mapVoteToPL(v.vote),
                        date: (v.date ? new Date(v.date).toISOString().slice(0, 10) : ymd),
                        sitting: s.number,
                        votingNumber: v.votingNumber,
                    });
                }
            } catch { /* ignore */ }
        }
    }
    return out;
}

async function fetchRecentVotingsForMP(mpId, currentWindow = 90, alreadyHave = []) {
    let list = await collectVotesForMP(mpId, currentWindow);
    const seen = new Set(alreadyHave.map(v => `${v.sitting}-${v.votingNumber}`));
    list = list.filter(v => !seen.has(`${v.sitting}-${v.votingNumber}`));
    return list.slice(0, 12);
}

/* ================== Postal → okręg ================== */
async function resolveDistrictByPostal(postal) {
    const geo = await geocodePostalCodePL(postal);
    console.log('[POSTAL] input:', postal);
    console.log('[POSTAL] geocode result:', geo);
    if (!geo) return null;

    const voiv = normalizeVoivFromGeo(geo);
    const countyRaw = fixCountyLabel(geo.county);
    const cityRaw = geo.cityCounty;

    console.log('[POSTAL] normalized:', { voiv, countyRaw, cityRaw });

    // 1) miasto + województwo
    if (cityRaw && voiv) {
        const k = `${norm(cityRaw)}||${norm(voiv)}`;
        if (CITY_VOIV_TO_DISTRICT.has(k)) {
            const d = CITY_VOIV_TO_DISTRICT.get(k);
            console.log('[POSTAL] MATCH: city+voiv ->', d, 'key:', k);
            return d;
        }
    }

    // 2) powiat + województwo
    if (countyRaw && voiv) {
        const base = norm(String(countyRaw).replace(/^powiat\s+/i, ''));
        const k = `${norm(`powiat ${base}`)}||${norm(voiv)}`;
        if (COUNTY_VOIV_TO_DISTRICT.has(k)) {
            const d = COUNTY_VOIV_TO_DISTRICT.get(k);
            console.log('[POSTAL] MATCH: county+voiv ->', d, 'key:', k);
            return d;
        }
    }

    // 3) samo miasto (fallback)
    if (cityRaw) {
        const k = norm(cityRaw);
        if (CITY_TO_DISTRICT.has(k)) {
            const d = CITY_TO_DISTRICT.get(k);
            console.log('[POSTAL] MATCH: city (fallback) ->', d, 'key:', k);
            return d;
        }
    }

    // 4) sam powiat (fallback)
    if (countyRaw) {
        const base = norm(String(countyRaw).replace(/^powiat\s+/i, ''));
        const k = norm(`powiat ${base}`);
        if (COUNTY_TO_DISTRICT.has(k)) {
            const d = COUNTY_TO_DISTRICT.get(k);
            console.log('[POSTAL] MATCH: county (fallback) ->', d, 'key:', k);
            return d;
        }
    }

    // 5) całe województwo (na końcu!)
    if (voiv) {
        const kVoiv = `województwo ${norm(voiv)}`;
        if (VOIV_TO_DISTRICT.has(kVoiv)) {
            const d = VOIV_TO_DISTRICT.get(kVoiv);
            console.log('[POSTAL] MATCH: full voiv ->', d, 'key:', kVoiv);
            return d;
        }
    }

    console.log('[POSTAL] NO MATCH, returning null');
    return null;
}

/* ================== KOMPONENT ================== */
const ParlamentScreen = () => {
    const [allMPs, setAllMPs] = useState([]);
    const [displayedMPs, setDisplayedMPs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [postalCode, setPostalCode] = useState('');
    const [nameQuery, setNameQuery] = useState('');
    const [userDistrict, setUserDistrict] = useState(null);

    const [expandedMP, setExpandedMP] = useState(null);

    // per-karta
    const [mpLoadingMap, setMpLoadingMap] = useState({}); // true podczas dociągania
    const [mpLoadedMap, setMpLoadedMap] = useState({});   // pierwsze zapytanie zakończone (sukces/pusto)
    const [mpWindowMap, setMpWindowMap] = useState({});   // 90 -> 180 -> ...
    const [mpVotesMap, setMpVotesMap] = useState({});     // { id: Vote[] }

    const bootRef = useRef(false);

    useEffect(() => {
        if (bootRef.current) return;
        bootRef.current = true;
        bootstrapAll();
    }, []);

    async function bootstrapAll() {
        setLoading(true);
        try {
            const res = await fetch(API.MPs);
            if (!res.ok) throw new Error(`MPs ${res.status}`);
            const list = await res.json();
            list.sort(byNamePL);
            setAllMPs(list);
            setDisplayedMPs(
                list.slice(0, 60).map(m => ({
                    id: m.id,
                    firstName: m.firstName,
                    lastName: m.lastName,
                    club: m.club,
                    district: m.districtNum ?? null,
                    photoUrl: API.MP_PHOTO_MINI(m.id),
                }))
            );
        } catch (e) {
            console.error('[MP] bootstrap error', e);
            Alert.alert('Błąd połączenia', 'Nie udało się pobrać danych z API Sejmu.');
        } finally {
            setLoading(false);
        }
    }

    const onRefresh = async () => {
        setRefreshing(true);
        PROCEEDINGS_CACHE = null;
        await bootstrapAll();
        setRefreshing(false);
    };

    function applyFilters(baseList, district, nameQ) {
        let list = baseList.slice();
        if (district) list = list.filter(m => Number(m.districtNum ?? m.district) === Number(district));
        if (nameQ && nameQ.trim()) {
            const q = norm(nameQ);
            list = list.filter(m => {
                const fn = norm(m.firstName);
                const ln = norm(m.lastName);
                return fn.includes(q) || ln.includes(q) || `${fn} ${ln}`.includes(q) || `${ln} ${fn}`.includes(q);
            });
        }
        return list.sort(byNamePL).map(m => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            club: m.club,
            district: m.districtNum ?? m.district ?? null,
            photoUrl: API.MP_PHOTO_MINI(m.id),
        }));
    }

    async function handlePostalCodeSubmit() {
        const raw = postalCode.trim();
        if (!raw) {
            Alert.alert('Błąd', 'Wprowadź kod pocztowy (np. 57-300 lub 57300)');
            return;
        }
        setLoading(true);
        try {
            const district = await resolveDistrictByPostal(raw);
            if (!district) {
                Alert.alert('Nie znaleziono okręgu', 'Nie udało się przypisać kodu pocztowego do okręgu.');
                setLoading(false);
                return;
            }
            setUserDistrict(district);

            const pool = allMPs?.length ? allMPs : [];
            const filtered = applyFilters(pool, district, nameQuery);
            setDisplayedMPs(filtered);
            setExpandedMP(null);
            setMpLoadingMap({});
            setMpLoadedMap({});
            setMpWindowMap({});
            setMpVotesMap({});
        } catch (e) {
            console.error('[POSTAL] error', e);
            Alert.alert('Błąd', 'Nie udało się określić okręgu na podstawie kodu pocztowego.');
        } finally {
            setLoading(false);
        }
    }

    function handleNameSearch() {
        const pool = allMPs?.length ? allMPs : [];
        const filtered = applyFilters(pool, userDistrict, nameQuery);
        setDisplayedMPs(filtered);
        setExpandedMP(null);
        setMpLoadingMap({});
        setMpLoadedMap({});
        setMpWindowMap({});
        setMpVotesMap({});
    }

    function clearFilters() {
        setUserDistrict(null);
        setPostalCode('');
        setNameQuery('');
        setDisplayedMPs(
            (allMPs || []).slice(0, 60).sort(byNamePL).map(m => ({
                id: m.id, firstName: m.firstName, lastName: m.lastName, club: m.club,
                district: m.districtNum ?? null, photoUrl: API.MP_PHOTO_MINI(m.id),
            }))
        );
        setExpandedMP(null);
        setMpLoadingMap({});
        setMpLoadedMap({});
        setMpWindowMap({});
        setMpVotesMap({});
    }

    const onToggleMP = async (mpId) => {
        if (expandedMP === mpId) {
            setExpandedMP(null);
            return;
        }
        setExpandedMP(mpId);

        if (!mpVotesMap[mpId]?.length && !mpLoadedMap[mpId]) {
            setMpLoadingMap(prev => ({ ...prev, [mpId]: true }));
            try {
                const initialWindow = 90;
                const votes = await fetchRecentVotingsForMP(mpId, initialWindow, []);
                setMpVotesMap(prev => ({ ...prev, [mpId]: votes }));
                setMpWindowMap(prev => ({ ...prev, [mpId]: initialWindow }));
            } catch (e) {
                console.warn('[VOTES] first load error', e);
            } finally {
                setMpLoadedMap(prev => ({ ...prev, [mpId]: true })); // pierwsze zapytanie zakończone
                setMpLoadingMap(prev => ({ ...prev, [mpId]: false }));
            }
        }
    };

    const onLoadMoreVotes = async (mpId) => {
        const current = mpWindowMap[mpId] ?? 90;
        const nextWindow = current >= 400 ? 400 : current + 90;
        if (nextWindow === current) return;

        setMpLoadingMap(prev => ({ ...prev, [mpId]: true }));
        try {
            const already = mpVotesMap[mpId] || [];
            const more = await fetchRecentVotingsForMP(mpId, nextWindow, already);
            const merged = [...already];
            const seen = new Set(already.map(v => `${v.sitting}-${v.votingNumber}`));
            for (const v of more) {
                const key = `${v.sitting}-${v.votingNumber}`;
                if (!seen.has(key)) { seen.add(key); merged.push(v); }
            }
            merged.sort((a, b) => {
                const da = new Date(a.date || 0);
                const db = new Date(b.date || 0);
                if (+db !== +da) return db - da;
                return (b.votingNumber || 0) - (a.votingNumber || 0);
            });
            setMpVotesMap(prev => ({ ...prev, [mpId]: merged }));
            setMpWindowMap(prev => ({ ...prev, [mpId]: nextWindow }));
        } catch (e) {
            console.warn('[VOTES] load more error', e);
        } finally {
            setMpLoadingMap(prev => ({ ...prev, [mpId]: false }));
            setMpLoadedMap(prev => ({ ...prev, [mpId]: true }));
        }
    };

    const renderVoteIcon = (vote) => {
        switch (vote) {
            case 'ZA': return <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />;
            case 'PRZECIW': return <Ionicons name="close-circle" size={16} color={COLORS.error} />;
            case 'WSTRZYMAŁ SIĘ': return <Ionicons name="remove-circle" size={16} color={COLORS.warning} />;
            default: return <Ionicons name="help-circle" size={16} color={COLORS.gray} />;
        }
    };

    const openVotingOnWeb = async (sitting, votingNumber) => {
        const url = sejmVotingUrl(sitting, votingNumber);
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) await Linking.openURL(url);
            else Alert.alert('Nie można otworzyć linku', url);
        } catch {
            Alert.alert('Błąd', 'Nie udało się otworzyć strony głosowania.');
        }
    };

    const renderMPCard = (mp) => {
        const isOpen = expandedMP === mp.id;
        const isLoadingInside = !!mpLoadingMap[mp.id];
        const wasLoadedOnce = !!mpLoadedMap[mp.id];
        const votes = mpVotesMap[mp.id] || [];
        const windowUsed = mpWindowMap[mp.id] ?? 90;

        return (
            <View key={mp.id} style={styles.mpCard}>
                <Pressable onPress={() => onToggleMP(mp.id)} android_ripple={{ color: '#00000011' }}>
                    <View style={styles.mpHeader}>
                        <View style={styles.mpPhotoContainer}>
                            <Image source={{ uri: mp.photoUrl }} style={styles.mpPhoto} />
                        </View>
                        <View style={styles.mpInfo}>
                            <Text style={styles.mpName}>{mp.firstName || '—'} {mp.lastName || ''}</Text>
                            <Text style={styles.mpParty}>{mp.club || 'Niezależny'}</Text>
                            <Text style={styles.mpDistrict}>Okręg {mp.district ?? '—'}</Text>
                        </View>
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.gray} />
                    </View>
                </Pressable>

                {isOpen && (
                    <View style={styles.mpDetails}>
                        <Text style={styles.recentVotingsTitle}>
                            Ostatnie głosowania {windowUsed <= 90 ? '(3 mies.)' : `(do ${windowUsed} dni)`}
                        </Text>

                        {/* Pokaż to co mamy; nie chowaj przy loaderze */}
                        {votes.length > 0 && votes.map(v => (
                            <View key={`${mp.id}-${v.sitting}-${v.votingNumber}`} style={styles.votingItem}>
                                <View style={styles.votingHeader}>
                                    {renderVoteIcon(v.vote)}
                                    <Text style={styles.votingTopic} numberOfLines={4}>{v.topic}</Text>
                                    <Pressable
                                        onPress={(e) => { e.stopPropagation?.(); openVotingOnWeb(v.sitting, v.votingNumber); }}
                                        style={styles.linkIconBtn}
                                        android_ripple={{ color: '#00000011', borderless: true }}
                                    >
                                        <Ionicons name="open-outline" size={18} color={COLORS.primary} />
                                    </Pressable>
                                </View>
                                <Text style={styles.votingDate}>
                                    {v.date} • Posiedzenie {v.sitting}, głos. {v.votingNumber}
                                </Text>
                            </View>
                        ))}

                        {/* Jeżeli pierwsze zapytanie skończone i pusto → dopiero wtedy pokaż komunikat */}
                        {wasLoadedOnce && votes.length === 0 && !isLoadingInside && (
                            <Text style={styles.noVotings}>Brak dostępnych głosowań w wybranym okresie.</Text>
                        )}

                        {/* Footer: przycisk „Zobacz więcej” i loader POD listą */}
                        {windowUsed < 400 && (
                            <Pressable
                                onPress={(e) => { e.stopPropagation?.(); onLoadMoreVotes(mp.id); }}
                                style={[styles.moreBtn, isLoadingInside && { opacity: 0.6 }]}
                                android_ripple={{ color: '#ffffff22' }}
                                disabled={isLoadingInside}
                            >
                                <Ionicons name="download-outline" size={16} color={COLORS.white} />
                                <Text style={styles.moreBtnText}>{isLoadingInside ? 'Ładowanie…' : 'Zobacz więcej'}</Text>
                            </Pressable>
                        )}

                        {isLoadingInside && (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Ładowanie…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    {userDistrict ? `Twoi posłowie — Okręg ${userDistrict}` : 'Posłowie'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {userDistrict ? 'Posłowie z Twojego okręgu' : 'Użyj kodu pocztowego lub wpisz imię/nazwisko'}
                </Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                        <Ionicons name="mail-open-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.textInput, { paddingLeft: 36 }]}
                            placeholder="Kod pocztowy (np. 57-300 lub 57300)"
                            value={postalCode}
                            onChangeText={setPostalCode}
                            maxLength={7}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="numbers-and-punctuation"
                            returnKeyType="search"
                            onSubmitEditing={handlePostalCodeSubmit}
                        />
                    </View>
                    <TouchableOpacity style={styles.searchButton} onPress={handlePostalCodeSubmit}>
                        <Ionicons name="search" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                        <Ionicons name="person-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.textInput, { paddingLeft: 36 }]}
                            placeholder="Imię i/lub nazwisko (np. Kowalski, Jan Kowalski)"
                            value={nameQuery}
                            onChangeText={setNameQuery}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="search"
                            onSubmitEditing={handleNameSearch}
                        />
                    </View>
                    <TouchableOpacity style={styles.searchButton} onPress={handleNameSearch}>
                        <Ionicons name="funnel-outline" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {(userDistrict || nameQuery) && (
                    <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                        <Text style={styles.clearButtonText}>Wyczyść filtry</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.mpsContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {displayedMPs?.length ? (
                    displayedMPs.map(renderMPCard)
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={COLORS.gray} />
                        <Text style={styles.emptyTitle}>Brak posłów</Text>
                        <Text style={styles.emptyText}>Zmień filtr lub wyczyść wyszukiwanie.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

/* ================== STYLE ================== */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },

    headerContainer: { padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: COLORS.textSecondary },

    searchContainer: { padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', height: 48,
        borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.background,
    },
    inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
    textInput: { flex: 1, height: 48, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
    searchButton: {
        width: 48, height: 48, marginLeft: 12,
        backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    },
    clearButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: COLORS.lightGray, borderRadius: 20 },
    clearButtonText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },

    mpsContainer: { flex: 1, padding: 20 },
    mpCard: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
        shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    mpHeader: { flexDirection: 'row', alignItems: 'center' },
    mpPhotoContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', backgroundColor: COLORS.lightGray, marginRight: 12 },
    mpPhoto: { width: '100%', height: '100%' },
    mpInfo: { flex: 1 },
    mpName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 2 },
    mpParty: { fontSize: 14, color: COLORS.primary, marginBottom: 2 },
    mpDistrict: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },

    mpDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
    recentVotingsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },

    votingItem: { marginBottom: 10 },
    votingHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    votingTopic: { flex: 1, fontSize: 13, color: COLORS.textPrimary, marginLeft: 8, lineHeight: 18 },
    votingDate: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 24 },
    linkIconBtn: { paddingHorizontal: 6, paddingVertical: 2 },

    noVotings: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },

    moreBtn: {
        marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
    },
    moreBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },

    footerLoader: { marginTop: 8, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});

export default ParlamentScreen;
