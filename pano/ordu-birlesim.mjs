// ORDU KOMUTA PANELI veri birlesim katmani (gorev spec 2026-11-01). Bu modul SERVER'DAN AYRI
// yasayan saf/salt-okur fonksiyonlar tutar: server.js yalniz cagirir (isleyici ayakta kalir),
// ordu-panosu.test.mjs server'i BASLATMADAN buradaki fonksiyonlari hermetik sinar (gorev
// siniri: 'server.js'i baslatma — izole sayfa/kadro/veri birlesim fonksiyonlarini testle').
// Yorumlar ASCII (gorev talimati); HTML/JSON yuz metinleri Turkce diakritikli olabilir.
// DURUSTLUK: dosya yok -> null/bos + sayi 0 (uydurma yok); bozuk satir ATLANIR + SAYILIR;
// sema ihlali -> RED throw (cagiran 500 verir — fail-closed); HICBIR fonksiyon yazmaz.
import { existsSync, readdirSync, readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';

const TURLER = ['komutan', 'kurmay', 'asker', 'nobet'];
const CANLI_KAYNAKLAR = ['kira', 'graf', 'statik', 'snapshot'];
// STEERING-6: cekirdek rol adi sozlugu gorev-grafigi SSOT ile BIREBIR (kelime seviyesinde senkron):
// paneldeki rol anahtari = makinenin graf JSON'unda aradigi anahtar. KULLANICI insandir (alt-ajan degil).
const SSOT_ROLLER = ['MANAGER', 'CODER', 'TESTER', 'INSAN-VEKILI-PROXY', 'GOZLEMCI'];
const IZINLI_ROL_ETIKETLERI = [...SSOT_ROLLER, 'KULLANICI'];

// --- kadro SSOT sema denetimi (zorunlu alanlar) --------------------------------------

export function kadroDogrula(kadro) {
  if (!kadro || typeof kadro !== 'object' || Array.isArray(kadro)) {
    throw new Error('RED: kadro SSOT nesne olmak zorunda');
  }
  if (!Number.isFinite(kadro.surum)) throw new Error('RED: kadro surum sayi olmak zorunda');
  if (typeof kadro.damgaISO !== 'string' || !Number.isFinite(Date.parse(kadro.damgaISO))) {
    throw new Error('RED: kadro damgaISO gecerli ISO damga olmak zorunda: ' + String(kadro.damgaISO));
  }
  if (!Array.isArray(kadro.birlikler) || kadro.birlikler.length === 0) {
    throw new Error('RED: kadro birlikler dolu dizi olmak zorunda');
  }
  const gorulen = new Set();
  for (const b of kadro.birlikler) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('RED: birlik kaydi nesne olmak zorunda');
    for (const alan of ['kodAdi', 'rol', 'gorev', 'hedef', 'kaynakAciklama']) {
      if (typeof b[alan] !== 'string' || !b[alan].trim()) {
        throw new Error('RED: birlik alani zorunlu ve dolu metin: ' + alan + ' (kayit: ' + String(b.kodAdi) + ')');
      }
    }
    if (!TURLER.includes(b.tur)) throw new Error('RED: birlik tur izinli degil (komutan|kurmay|asker|nobet): ' + String(b.tur));
    if (!CANLI_KAYNAKLAR.includes(b.canliKaynak)) {
      throw new Error('RED: canliKaynak izinli degil (kira|graf|statik|snapshot): ' + String(b.canliKaynak));
    }
    if (!Array.isArray(b.dosyalar) || b.dosyalar.some((d) => typeof d !== 'string')) {
      throw new Error('RED: birlik dosyalar metin dizisi olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
    }
    // Spec guncellemesi (2026-11-01 17:5x): istege bagli cephe/denetim/olcum/atananGorevler alanlari.
    // olcum YALNIZ olculmus deger tasir — kaynak etiketi zorunlu (uydurma olcum semasi disi).
    if (b.cephe !== undefined && (typeof b.cephe !== 'string' || !b.cephe.trim())) {
      throw new Error('RED: birlik cephe dolu metin olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
    }
    if (b.denetim !== undefined && (typeof b.denetim !== 'string' || !b.denetim.trim())) {
      throw new Error('RED: birlik denetim dolu metin olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
    }
    if (b.atanmisGorevler !== undefined) {
      if (!Array.isArray(b.atanmisGorevler) || b.atanmisGorevler.some((g) => typeof g !== 'string')) {
        throw new Error('RED: atanmisGorevler metin dizisi olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
    }
    // BOLUM 6 spec eki (2026-11-01): istege bagli ajanId — varsa KAYNAK ETIKETI zorunlu
    // (olculmemis ajan id uydurma engeli; UUID beklenir ama kira kimligi gibi kisa kimlik de yasal).
    if (b.ajanId !== undefined) {
      if (typeof b.ajanId !== 'string' || b.ajanId.trim().length < 8) {
        throw new Error('RED: birlik ajanId en az 8 karakterli kimlik olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
      if (typeof b.ajanIdKaynak !== 'string' || !b.ajanIdKaynak.trim()) {
        throw new Error('RED: ajanId varsa ajanIdKaynak dolu metin olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
    }
    // STEERING-5/6: gorevEmri (EK-3 4 alan + insan-okur ozet) + roller (SSOT cekirdek adlari) + uzmanlik.
    if (b.gorevEmri !== undefined) {
      const ge = b.gorevEmri;
      if (!ge || typeof ge !== 'object' || Array.isArray(ge)) {
        throw new Error('RED: gorevEmri nesne olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
      for (const alan of ['hedef', 'ciktiFormati', 'aracKaynak', 'ozet']) {
        if (typeof ge[alan] !== 'string' || !ge[alan].trim()) {
          throw new Error('RED: gorevEmri alani zorunlu ve dolu metin: ' + alan + ' (kayit: ' + String(b.kodAdi) + ')');
        }
      }
      if (!ge.gorevSiniri || typeof ge.gorevSiniri !== 'object' || Array.isArray(ge.gorevSiniri) ||
          !Array.isArray(ge.gorevSiniri.yapar) || !Array.isArray(ge.gorevSiniri.yapmaz) ||
          ge.gorevSiniri.yapar.some((y) => typeof y !== 'string') || ge.gorevSiniri.yapmaz.some((y) => typeof y !== 'string')) {
        throw new Error('RED: gorevEmri.gorevSiniri {yapar:[], yapmaz:[]} metin dizileri olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
    }
    if (b.roller !== undefined) {
      if (!Array.isArray(b.roller) || b.roller.length === 0 || b.roller.some((r) => typeof r !== 'string' || !r.trim())) {
        throw new Error('RED: birlik roller dolu metin dizisi olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
      for (const r of b.roller) {
        if (!IZINLI_ROL_ETIKETLERI.includes(r)) {
          throw new Error('RED: rol adi SSOT sozlugunde degil (izinli: ' + IZINLI_ROL_ETIKETLERI.join('|') + '): ' + r + ' (kayit: ' + String(b.kodAdi) + ')');
        }
      }
    }
    if (b.uzmanlik !== undefined && (typeof b.uzmanlik !== 'string' || !b.uzmanlik.trim())) {
      throw new Error('RED: birlik uzmanlik dolu metin olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
    }
    if (b.olcum !== undefined) {
      if (!b.olcum || typeof b.olcum !== 'object' || Array.isArray(b.olcum)) {
        throw new Error('RED: olcum nesne olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
      if (b.olcum.calismaSuresi !== undefined) {
        if (!Array.isArray(b.olcum.calismaSuresi) || b.olcum.calismaSuresi.some((o) =>
            !o || typeof o !== 'object' || Array.isArray(o) ||
            typeof o.ad !== 'string' || typeof o.sure !== 'string' ||
            typeof o.sonuc !== 'string' || typeof o.kaynak !== 'string' || !o.kaynak.trim())) {
          throw new Error('RED: olcum.calismaSuresi {ad,sure,sonuc,kaynak} kayit dizisi olmak zorunda — kaynak etiketi ZORUNLU (kayit: ' + String(b.kodAdi) + ')');
        }
      }
      if (b.olcum.benchmark !== undefined && (typeof b.olcum.benchmark !== 'string' || !b.olcum.benchmark.trim())) {
        throw new Error('RED: olcum.benchmark dolu metin olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
      if (b.olcum.kaynak !== undefined && (typeof b.olcum.kaynak !== 'string' || !b.olcum.kaynak.trim())) {
        throw new Error('RED: olcum.kaynak dolu metin olmak zorunda (kayit: ' + String(b.kodAdi) + ')');
      }
    }
    if (gorulen.has(b.kodAdi)) throw new Error('RED: kodAdi TEKRARLI: ' + b.kodAdi);
    gorulen.add(b.kodAdi);
  }
  // STEERING-5/6: rolAtamasi N:M haritasi — anahtarlar SSOT 5 cekirdek rol adi (birebir),
  // degerler kadroda TANIMLI kod adi dizileri (tek rol cok ajan / tek ajan cok rol; bos dizi = atanmadi).
  if (kadro.rolAtamasi !== undefined) {
    const ra = kadro.rolAtamasi;
    if (!ra || typeof ra !== 'object' || Array.isArray(ra)) {
      throw new Error('RED: rolAtamasi nesne olmak zorunda');
    }
    for (const [rol, kodlar] of Object.entries(ra)) {
      if (!SSOT_ROLLER.includes(rol)) {
        throw new Error('RED: rolAtamasi anahtari SSOT cekirdek rolu olmak zorunda (' + SSOT_ROLLER.join('|') + '): ' + rol);
      }
      if (!Array.isArray(kodlar) || kodlar.some((k) => typeof k !== 'string' || !k.trim())) {
        throw new Error('RED: rolAtamasi degeri kod-adi metin dizisi olmak zorunda: ' + rol);
      }
      for (const k of kodlar) {
        if (!gorulen.has(k)) throw new Error('RED: rolAtamasi kadroda TANIMSIZ kod adi: ' + k + ' (rol: ' + rol + ')');
      }
    }
  }
  return true;
}

// --- kira etiketi (nobet.mjs 4+2 durust genisletme ile ayni tablo) --------------------

export function kiraEtiketi(kiraDurumSonuc) {
  if (!kiraDurumSonuc || typeof kiraDurumSonuc !== 'object') return null;
  if (kiraDurumSonuc.yok) return 'yok';
  if (kiraDurumSonuc.bozuk) return 'bozuk';
  if (kiraDurumSonuc.durum === 'birakildi') return 'birakildi';
  return kiraDurumSonuc.taze ? 'taze' : 'bayat';
}

const ETIKET_AD = { yok: 'kira yok', bozuk: 'kira bozuk', birakildi: 'kira birakildi', taze: 'kira taze', bayat: 'kira bayat' };

// --- kadro + kira birlesimi (canlilik isareti) ----------------------------------------
// Kira devirSinifi kadro TURUNE baglanir: operator -> KURMAY sinifi (tur kurmay), nobet ->
// nobet sinifi (tur nobet). Taze kiranin sahibi o sinifin kira-kaynakli kartini CANLI yapar;
// kira yok/bayat/birakildi -> kart DURUST gri etiket tasir (canli DIYLENMEZ).

export function kadroBirlesim(kadro, kiraDurumSonuc) {
  kadroDogrula(kadro);
  const etiket = kiraEtiketi(kiraDurumSonuc);
  const canli = !!(kiraDurumSonuc && kiraDurumSonuc.taze);
  const sahibi = kiraDurumSonuc && typeof kiraDurumSonuc.kimlik === 'string' ? kiraDurumSonuc.kimlik : null;
  const sinif = kiraDurumSonuc && typeof kiraDurumSonuc.devirSinifi === 'string' ? kiraDurumSonuc.devirSinifi : null;
  const birlikler = kadro.birlikler.map((b) => {
    const kiraSinifi = b.tur === 'kurmay' ? 'operator' : b.tur === 'nobet' ? 'nobet' : null;
    let canlilik;
    if (b.canliKaynak === 'kira') {
      if (canli && kiraSinifi && sinif === kiraSinifi) {
        canlilik = { canli: true, etiket: 'CANLI — kira sahibi: ' + sahibi };
      } else if (kiraSinifi) {
        canlilik = { canli: false, etiket: (ETIKET_AD[etiket] || 'kira durumu bilinmiyor') + ' — kira sahibi: ' + (sahibi || 'yok') };
      } else {
        canlilik = { canli: false, etiket: 'kira kaynakli kayit tur eslesmesi yok (tur: ' + b.tur + ')' };
      }
    } else if (b.canliKaynak === 'graf') {
      canlilik = { canli: false, etiket: 'ŞABLON — henüz canlı ajan yok' };
    } else if (b.canliKaynak === 'snapshot') {
      const an = typeof b.olcumAniISO === 'string' ? b.olcumAniISO : 'bilinmiyor';
      canlilik = { canli: false, etiket: 'ÖLÇÜM ANI: ' + an + ' — bayat snapshot, canlı DENMEZ' };
    } else {
      canlilik = { canli: false, etiket: 'STATİK kayıt — canlılık sinyali taşımaz' };
    }
    return { ...b, canlilik };
  });
  return { ...kadro, kiraEtiketi: etiket, birlikler };
}

// --- aktif is: STATE_BOARD '## Aktif is' blogundan duz metin --------------------------

export function aktifIsOku(yol) {
  if (!existsSync(yol)) return { aktifIs: null, satir: 0 };
  const satirlar = readFileSync(yol, 'utf8').split(/\r?\n/);
  const i = satirlar.findIndex((s) => s.trim() === '## Aktif iş');
  if (i < 0) return { aktifIs: null, satir: 0 };
  const govde = [];
  for (let k = i + 1; k < satirlar.length; k++) {
    if (satirlar[k].startsWith('## ')) break;
    govde.push(satirlar[k]);
  }
  const duz = govde.join('\n')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // link -> metin (yol)
    .replace(/\*\*/g, '')                            // kalin isaretleri soyulur
    .replace(/^>+\s?/gm, '')                         // alinti cekmeceleri soyulur
    .replace(/\n{3,}/g, '\n\n')                      // uc+ bos satir ikiye iner
    .trim();
  return { aktifIs: duz.length > 0 ? duz : null, satir: govde.filter((s) => s.trim()).length };
}

// Son damga: '## Son damgalar' basligindan ONCEKI son tarihli damga satiri (bölgenin en yenisi).
// Eski hata (server.js'te): basliktan SONRAKI ilk satir = arsivin en yeni OZETI -> panel bayat damga gosteriyordu.
export function sonDamgaSatiri(satirlar) {
  const i = satirlar.findIndex((s) => s.trim() === '## Son damgalar');
  if (i < 0) return null;
  for (let k = i - 1; k >= 0; k--) {
    const s = satirlar[k].trim();
    if (/^- \d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 160);
    if (s.startsWith('#')) break; // damga bolgesi bitti — yukari tasma yok
  }
  // bolge bossa durust geri dusus: arsivin ilk satiri (eski davranis)
  return (satirlar.slice(i + 1).find((s) => s.trim().startsWith('- ')) ?? null)?.trim().slice(0, 160) ?? null;
}

// --- 429 defteri ozeti (jsonl; bozuk satir atlanir + sayilir) -------------------------

export function defterOzet(yol) {
  if (!existsSync(yol)) return { toplam: 0, bozuk: 0, sonKayit: null };
  let kayitlar = 0, bozuk = 0, sonKayit = null;
  for (const satir of readFileSync(yol, 'utf8').split(/\r?\n/)) {
    if (!satir.trim()) continue;
    try {
      sonKayit = JSON.parse(satir);
      kayitlar++;
    } catch { bozuk++; }
  }
  return { toplam: kayitlar, bozuk, sonKayit };
}

// --- git HEAD (diskten salt-okur; subprocess YOK — .git dosyalarindan okur) -------------

export function gitHeadOku(kok) {
  const git = join(kok, '.git');
  const headYolu = join(git, 'HEAD');
  if (!existsSync(headYolu)) return null;
  const head = readFileSync(headYolu, 'utf8').trim();
  if (!head.startsWith('ref: ')) return { dal: null, hash: head, kisa: head.slice(0, 7) };
  const ref = head.slice(5);
  const dal = ref.slice(ref.lastIndexOf('/') + 1);
  const refYolu = join(git, ref);
  if (!existsSync(refYolu)) return { dal, hash: null, kisa: null };
  const hash = readFileSync(refYolu, 'utf8').trim();
  return { dal, hash, kisa: hash.slice(0, 7) };
}

// --- akis: uc kaynagi tek kronolojik dizide birlestir ---------------------------------
// Kayitlar {turu, ad, zamanISO} seklindedir; en yeni en ustte (kronolojik). Gecersiz
// damgali/bos satirlar ATLANIR + atlanan sayisi durustce tasınır (sessiz yutma yok).

function zamanli(turu, ad, zamanISO) {
  const t = Date.parse(zamanISO);
  if (!Number.isFinite(t)) return null;
  return { turu, ad: String(ad), zamanISO: String(zamanISO), ms: t };
}

export function akisBirlestir(kaynaklar) {
  const hepsi = [];
  let atlanan = 0;
  for (const kaynak of [kaynaklar.handofflar || [], kaynaklar.kiraOlaylar || [], kaynaklar.defterKayitlari || []]) {
    for (const o of kaynak) {
      if (!o || typeof o !== 'object') { atlanan++; continue; }
      const kayit = zamanli(o.turu, o.ad, o.zamanISO);
      if (!kayit) { atlanan++; continue; }
      hepsi.push(kayit);
    }
  }
  hepsi.sort((a, b) => b.ms - a.ms); // kronolojik: en yeni once
  const olaylar = hepsi.map(({ turu, ad, zamanISO }) => ({ turu, ad, zamanISO }));
  return { olaylar, atlanan };
}

// Salt-okur kaynak okuyuculari (dosya/dizin yok -> BOS liste; hata degil):

export function handoffOlaylari(dir) {
  if (!existsSync(dir)) return [];
  const olaylar = [];
  for (const ad of readdirSync(dir)) {
    if (!ad.endsWith('.md')) continue;
    const yol = join(dir, ad);
    const st = statSync(yol);
    olaylar.push({ turu: 'handoff', ad, zamanISO: st.mtime.toISOString() });
  }
  return olaylar;
}

export function kiraOlaylari(kiraYolu, logOkuFn) {
  const { olaylar, bozuk } = logOkuFn(kiraYolu); // devir-kira.mjs logOku: bozuk satir sayar
  const cikti = [];
  let atlanan = 0;
  for (const o of olaylar) {
    if (!o || typeof o !== 'object') { atlanan++; continue; }
    const ad = o.tur + (o.kimlik ? ' · ' + o.kimlik : '') + (o.sebep ? ' (' + o.sebep + ')' : '');
    const kayit = zamanli('kira', ad, o.damga);
    if (!kayit) { atlanan++; continue; }
    cikti.push(kayit);
  }
  return { olaylar: cikti.map(({ turu, ad, zamanISO }) => ({ turu, ad, zamanISO })), atlanan: atlanan + bozuk };
}

export function defterKayitlari(yol) {
  if (!existsSync(yol)) return [];
  const kayitlar = [];
  let atlanan = 0;
  for (const satir of readFileSync(yol, 'utf8').split(/\r?\n/)) {
    if (!satir.trim()) continue;
    try {
      const k = JSON.parse(satir);
      const ad = [k.provider, k.hataSinifi || k.tip].filter(Boolean).join(' · ') || '429 kaydı';
      const kayit = zamanli('429', ad, k.damgaISO);
      if (!kayit) { atlanan++; continue; }
      kayitlar.push(kayit);
    } catch { atlanan++; }
  }
  return kayitlar;
}

// Tek kapi: uc kaynagi okur + birlestirir (server ucu bunu cagirir).
export function akisTopla({ handoffDir, kiraYolu, defterYolu, logOkuFn }) {
  const kira = kiraOlaylari(kiraYolu, logOkuFn || (() => ({ olaylar: [], bozuk: 0 })));
  const birlesim = akisBirlestir({
    handofflar: handoffOlaylari(handoffDir),
    kiraOlaylar: kira.olaylar,
    defterKayitlari: defterKayitlari(defterYolu),
  });
  return { olaylar: birlesim.olaylar, atlanan: birlesim.atlanan + kira.atlanan };
}

// --- saglik birlesimi (sorun envanteri + olcum ekleri) ---------------------------------

export function saglikBirlesim(sorunOzet, ekle) {
  if (!sorunOzet || typeof sorunOzet !== 'object' || !Array.isArray(sorunOzet.siniflar) || sorunOzet.siniflar.length === 0) {
    throw new Error('RED: sorun envanteri siniflar dolu dizi olmak zorunda');
  }
  for (const s of sorunOzet.siniflar) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.ad !== 'string' ||
        typeof s.fren !== 'string') {
      throw new Error('RED: saglik karti alanlari eksik (id/ad/fren zorunlu): ' + JSON.stringify(s).slice(0, 120));
    }
  }
  return { ...sorunOzet, defterToplam: ekle && ekle.defterToplam !== undefined ? ekle.defterToplam : null, kiraEtiketi: ekle && ekle.kiraEtiketi !== undefined ? ekle.kiraEtiketi : null };
}

// --- spec guncellemesi (2026-11-01 17:5x): BOLUM 1 semsiye verileri ---------------------
// (i) en buyuk sorunlar: enOldurucu5 id'leri siniflarla cozulur (kayit yoksa DURUST ad).
// (ii) genel saglik isigi: kira etiketi + fren sayilari + son 429 yakinligindan olculur.
// (iii) cozum yollari: fixKuyrugu. (iv) graf sayimi: durum+aktif alanlarindan durust sayim.
// (v) ilerleme: tamamlanma orani + kritik-yoldan siradaki 3 gorev.

export function enOlduruculer(sorunOzet) {
  if (!sorunOzet || !Array.isArray(sorunOzet.siniflar)) return [];
  const harita = new Map(sorunOzet.siniflar.map((s) => [s.id, s]));
  const idler = Array.isArray(sorunOzet.enOldurucu5) ? sorunOzet.enOldurucu5 : [];
  return idler.map((id) => {
    const s = harita.get(id);
    return s
      ? { id: s.id, ad: s.ad, tekrarYaklasik: typeof s.tekrarYaklasik === 'number' ? s.tekrarYaklasik : null, fren: s.fren }
      : { id: String(id), ad: '(sinif kaydi bulunamadi)', tekrarYaklasik: null, fren: null };
  });
}

export function frenSayilari(sorunOzet) {
  const sayim = { ACIK: 0, KISMEN: 0, COGU: 0, diger: 0 };
  if (!sorunOzet || !Array.isArray(sorunOzet.siniflar)) return sayim;
  for (const s of sorunOzet.siniflar) {
    if (s && typeof s.fren === 'string' && Object.prototype.hasOwnProperty.call(sayim, s.fren)) sayim[s.fren]++;
    else sayim.diger++;
  }
  return sayim;
}

export function sorunBirlesim(sorunOzet) {
  if (!sorunOzet || typeof sorunOzet !== 'object' || !Array.isArray(sorunOzet.siniflar) || sorunOzet.siniflar.length === 0) {
    return null; // sorun envanteri yok/bozuk -> null (cagiran durust 'okunamadi' der)
  }
  return {
    enOldurucu: enOlduruculer(sorunOzet),
    frenSayilari: frenSayilari(sorunOzet),
    fixKuyrugu: Array.isArray(sorunOzet.fixKuyrugu) ? sorunOzet.fixKuyrugu.map(String) : [],
    damgaISO: typeof sorunOzet.damgaISO === 'string' ? sorunOzet.damgaISO : null,
  };
}

// Genel saglik isigi: kirmizi = fren ACIK > 0 VEYA kira bozuk; sari = KISMEN > 0 VEYA kira
// bayat VEYA son 429 kaydi son 30 dk icinde; yesil = gerisi. 'birakildi'/'yok' NORMAL nöbet
// araligidir (uyari DEGIL). neden[] olculmus satirlari tasir — bos dizgi uydurulmaz.
export function genelSaglikIsigi({ kiraEtiketi, fren, son429Ms, simdiMs }) {
  const simdi = Number.isFinite(simdiMs) ? simdiMs : Date.now();
  const f = fren || {};
  const neden = [];
  let renk = 'yesil';
  if ((f.ACIK || 0) > 0) { renk = 'kirmizi'; neden.push((f.ACIK || 0) + ' sorun sinifi freni ACIK'); }
  if (kiraEtiketi === 'bozuk') { renk = 'kirmizi'; neden.push('kira bozuk (fail-closed)'); }
  if (renk !== 'kirmizi') {
    if ((f.KISMEN || 0) > 0) { renk = 'sari'; neden.push((f.KISMEN || 0) + ' sinif freni KISMEN'); }
    if (kiraEtiketi === 'bayat') { renk = 'sari'; neden.push('kira bayat'); }
    if (Number.isFinite(son429Ms) && simdi - son429Ms < 30 * 60 * 1000) {
      if (renk === 'yesil') renk = 'sari';
      neden.push('son 429 kaydi son 30 dk icinde');
    }
  }
  if (neden.length === 0) neden.push('acik fren yok; kira ve 429 defteri sakin');
  const etiket = renk === 'kirmizi' ? 'kirmizi' : renk === 'sari' ? 'sari' : 'yesil';
  return { renk, etiket, neden, testDurumu: 'ölçülmedi (uçtan test koşulmaz — sayfa salt-okur)' };
}

// Graf sayimi (durust): toplam/aktif/pasif/tamam + tamamlanma orani + kritik-yoldan siradaki 3.
// aktif = g.aktif===true; pasif = kalan; tamam = durum 'KAPALI' ile baslar. Oran = tamam/toplam.
export function grafSayim(graf) {
  if (!graf || typeof graf !== 'object' || !Array.isArray(graf.gorevler)) return null;
  const gs = graf.gorevler.filter((g) => g && typeof g.id === 'string');
  const toplam = gs.length;
  const aktif = gs.filter((g) => g.aktif === true).length;
  const kapaliMi = (g) => typeof g.durum === 'string' && g.durum.startsWith('KAPALI');
  const tamam = gs.filter(kapaliMi).length;
  const yol = Array.isArray(graf.kritikYol) ? graf.kritikYol : [];
  const siradaki3 = [];
  for (const id of yol) {
    if (siradaki3.length >= 3) break;
    const g = gs.find((x) => x.id === id);
    if (g && !kapaliMi(g)) siradaki3.push({ id: g.id, ad: typeof g.gorev === 'string' ? g.gorev : '', durum: typeof g.durum === 'string' ? g.durum : '' });
  }
  return {
    toplam, aktif, pasif: toplam - aktif, tamam,
    tamamlanmaOrani: toplam > 0 ? Math.round((tamam / toplam) * 1000) / 10 : null,
    siradaki3,
    grafSurumu: typeof graf.grafSurumu === 'string' ? graf.grafSurumu : null,
  };
}

// --- BOLUM 6 (spec eki 2026-11-01): LOG — birlesik detay kayitlari (salt-okur) ----------
// Kaynaklar: kira-log jsonl + 429-defter jsonl + handoff dogumlari (readdir+stat) + deney
// defteri jsonl. Her kayit {zamanISO, tur, kodAdi, ajanId, detay, kaynakDosya}.
// Sisme kontrolu: panel diske log YAZMAZ; pencere (saat filtresi) + tavan (son N kayit)
// yalniz GORUNTULEME sinirlaridir — kaynak defterler append-only'dir, panel silmez.

const UUID_DESEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ajan id kisa gosterimi: UUID -> 8 hane onek (tamina title/aria'da yer verilir);
// UUID olmayan kimlik (nobet-ajan-21180 gibi kira kimligi) TAM birakilir — kisaltma bilgi kaybettirir.
export function kisaAjanId(ajanId) {
  if (typeof ajanId !== 'string' || !ajanId.trim()) return null;
  return UUID_DESEN.test(ajanId) ? ajanId.slice(0, 8) : ajanId;
}

// GD-008/tail deseni: dosyanin TAMAMI bellege alinmaz — son maxBayt'lik tampondan satir cozulur.
// Tail okunduysa (dosya tavandan buyukse) ILK SATIR kesik olabilir -> atlanir (bozuk-ilk-satr).
export function kuyrukOku(yol, maxBayt = 65536) {
  if (!existsSync(yol)) return { satirlar: [], kesikIlkAtlandi: false, boyut: 0 };
  const boyut = statSync(yol).size;
  const uzunluk = Math.min(boyut, maxBayt);
  const fd = openSync(yol, 'r');
  try {
    const tampon = Buffer.alloc(uzunluk);
    if (uzunluk > 0) readSync(fd, tampon, 0, uzunluk, boyut - uzunluk);
    const satirlar = tampon.toString('utf8').split(/\r?\n/).filter((s) => s.trim());
    const kesikIlkAtlandi = boyut > maxBayt && satirlar.length > 0;
    if (kesikIlkAtlandi) satirlar.shift(); // ilk satir kesik — bozuk-ilk-satr toleransi
    return { satirlar, kesikIlkAtlandi, boyut };
  } finally { closeSync(fd); }
}

// Ajan kimlik eslemesi: UUID/kimlik -> {kodAdi, etiket}. Iki olculmus kaynak:
// (a) kadro birliklerinin ajanId alani (kayitli olcum), (b) deney ajanlar.json kosanPaseo
// (snapshot — canli kaniti yok, etiketiyle gosterilir).
export function ajanEslemeKur(kadro, deneyAjanlar) {
  const esleme = new Map();
  if (kadro && Array.isArray(kadro.birlikler)) {
    for (const b of kadro.birlikler) {
      if (b && typeof b.ajanId === 'string' && b.ajanId.trim()) esleme.set(b.ajanId, { kodAdi: b.kodAdi, etiket: 'kayitli' });
    }
  }
  if (deneyAjanlar && Array.isArray(deneyAjanlar.kosanPaseo)) {
    for (const a of deneyAjanlar.kosanPaseo) {
      if (a && typeof a.id === 'string' && a.id.trim()) {
        esleme.set(a.id, { kodAdi: typeof a.ad === 'string' && a.ad.trim() ? a.ad : a.id.slice(0, 8), etiket: 'snapshot' });
      }
    }
  }
  return esleme;
}

const DETAY_TAVAN = 400; // uzun deney metinleri kirpilir — panel sismez (kirpildigi soylenir)

function detayKes(metin) {
  const s = String(metin);
  return s.length > DETAY_TAVAN ? s.slice(0, DETAY_TAVAN) + ' …(kısaltıldı)' : s;
}

function kiraLogKayitlari(yol) {
  const { satirlar } = kuyrukOku(yol);
  const kayitlar = []; let atlanan = 0;
  for (const satir of satirlar) {
    let k; try { k = JSON.parse(satir); } catch { atlanan++; continue; }
    const zamanISO = typeof k.damga === 'string' && Number.isFinite(Date.parse(k.damga)) ? k.damga : null;
    if (!zamanISO) { atlanan++; continue; }
    // kira devirSinifi kadro sinifina baglanir (nobet -> NOBET-1, operator -> KURMAY-1)
    const kodAdi = k.devirSinifi === 'nobet' ? 'NOBET-1' : k.devirSinifi === 'operator' ? 'KURMAY-1' : null;
    const parca = [String(k.tur || 'kira-olay')];
    if (k.sebep) parca.push('sebep: ' + k.sebep);
    if (k.durum) parca.push('durum: ' + k.durum);
    if (k.oncekiKimlik) parca.push('önceki: ' + k.oncekiKimlik);
    if (Number.isFinite(k.pid)) parca.push('pid ' + k.pid);
    kayitlar.push({ zamanISO, tur: 'kira', kodAdi, ajanId: typeof k.kimlik === 'string' ? k.kimlik : null, detay: parca.join(' · '), kaynakDosya: yol });
  }
  return { kayitlar, atlanan };
}

function defterLogKayitlari(yol, esleme) {
  const { satirlar } = kuyrukOku(yol);
  const kayitlar = []; let atlanan = 0;
  for (const satir of satirlar) {
    let k; try { k = JSON.parse(satir); } catch { atlanan++; continue; }
    const zamanISO = typeof k.damgaISO === 'string' && Number.isFinite(Date.parse(k.damgaISO)) ? k.damgaISO : null;
    if (!zamanISO) { atlanan++; continue; }
    const es = typeof k.agentId === 'string' && esleme.has(k.agentId) ? esleme.get(k.agentId) : null;
    kayitlar.push({
      zamanISO, tur: '429',
      kodAdi: es ? es.kodAdi + (es.etiket === 'snapshot' ? ' (snapshot)' : '') : null,
      ajanId: typeof k.agentId === 'string' ? k.agentId : null,
      detay: detayKes(String(k.provider || '?') + ' · ' + String(k.hataSinifi || '?')),
      kaynakDosya: yol,
    });
  }
  return { kayitlar, atlanan };
}

function handoffDogumKayitlari(dir) {
  const kayitlar = [];
  if (!existsSync(dir)) return { kayitlar, atlanan: 0 };
  let girdiler = [];
  try { girdiler = readdirSync(dir); } catch { return { kayitlar: [], atlanan: 0 }; }
  for (const ad of girdiler) {
    if (!ad.endsWith('.md')) continue;
    const yol = join(dir, ad);
    let st; try { st = statSync(yol); } catch { continue; }
    const dogumVar = Number.isFinite(st.birthtimeMs) && st.birthtimeMs > 0;
    const zamanISO = new Date(dogumVar ? st.birthtimeMs : st.mtimeMs).toISOString();
    kayitlar.push({
      zamanISO, tur: 'handoff', kodAdi: null, ajanId: null,
      detay: 'handoff doğdu: ' + ad + (dogumVar ? '' : ' (doğum ölçülemedi — değişim zamanı)'),
      kaynakDosya: yol,
    });
  }
  return { kayitlar, atlanan: 0 };
}

function deneyLogKayitlari(yol, esleme) {
  const { satirlar } = kuyrukOku(yol);
  const kayitlar = []; let atlanan = 0;
  for (const satir of satirlar) {
    let k; try { k = JSON.parse(satir); } catch { atlanan++; continue; }
    const zamanISO = typeof k.t === 'string' && Number.isFinite(Date.parse(k.t)) ? k.t : null;
    if (!zamanISO) { atlanan++; continue; } // bozuk damgali kayit (t:'t' gibi) ATLANIR + sayilir
    const aktor = typeof k.aktor === 'string' ? k.aktor : null;
    let kodAdi = null, ajanId = null;
    if (aktor && aktor.startsWith('ai-manager')) {
      for (const [id, e] of esleme) {
        if (e.etiket === 'snapshot' && /manager/i.test(e.kodAdi)) { kodAdi = e.kodAdi + ' (snapshot)'; ajanId = id; break; }
      }
    }
    kayitlar.push({
      zamanISO, tur: 'log', kodAdi, ajanId,
      detay: detayKes((k.tur ? '[' + k.tur + '] ' : '') + String(k.metin || '')),
      kaynakDosya: yol,
    });
  }
  return { kayitlar, atlanan };
}

// Birlesik log: 4 kaynak tek dizide (en yeni once) + saat penceresi + tavan.
// saat: null (pencere yok) | 1|6|24|168 (saat cinsinden server-side pencere).
export function logBirlesik({ kiraLogYolu, defterYolu, handoffDir, deneyLogYolu, esleme, saat = null, simdiMs, tavan = 200 }) {
  const simdi = Number.isFinite(simdiMs) ? simdiMs : Date.now();
  const parcalar = [
    kiraLogKayitlari(kiraLogYolu),
    defterLogKayitlari(defterYolu, esleme || new Map()),
    handoffDogumKayitlari(handoffDir),
    deneyLogKayitlari(deneyLogYolu, esleme || new Map()),
  ];
  let tum = []; let atlanan = 0;
  for (const p of parcalar) { tum = tum.concat(p.kayitlar); atlanan += p.atlanan; }
  const esikMs = typeof saat === 'number' && saat > 0 ? simdi - saat * 3600000 : null;
  const pencere = esikMs === null ? tum : tum.filter((k) => {
    const ms = Date.parse(k.zamanISO);
    return Number.isFinite(ms) && ms >= esikMs;
  });
  pencere.sort((a, b) => Date.parse(b.zamanISO) - Date.parse(a.zamanISO));
  const t = Number.isFinite(tavan) && tavan > 0 ? Math.floor(tavan) : 200;
  return { kayitlar: pencere.slice(0, t), atlanan, penceredeToplam: pencere.length, tavan: t };
}

// STEERING-7: Paseo agents deposu taramasi — dizin = workspace/cwd (boli isaretleri tireye
// cevrilmis), her <agentId>.json bir ajan kaydi. SALT-OKUR; server ucu HER ISTEGTE diskten
// okur (bayat onbellek YOK). DIKKAT: kayit.config.systemPrompt YANITA ASLA GIRMEZ — yalniz
// sayim alani cikar (ajandaki sozlesme metni panelin isi degil; sizma testi sabitlenmistir).
// Diskte ajan kaydi OLMAYAN dizin listede gorunmez: boyle workspace'te ajan hic dogmamis
// (daemon kayit defteri diskte kapali) — bu bir olcum siniridir, hata degil.
// Bozuk JSON dosyalar ATLANIR + sayilir (mevcut tolerans deseni).
const BILINEN_DURUMLAR = ['running', 'idle', 'error', 'closed'];

// FAZ-G (PANEL-ANA-1, 2026-11-03): Paseo workspace kayit defteri — SALT-OKUR BASLIK birlesimi.
// Kaynak: join(paseoEv, 'projects', 'workspaces.json') (test fixture'i ayni PASEO_EV duzeniyle
// ezilebilir). Eslesme anahtari: cwd -> dash cevirimi ([\\/:]+ tek tire — server.js ORDU_DIZIN_ADI
// deseni AYNEN) = agents/<dizin> adi. Ayni cwd'de BIRDEN FAZLA workspace olabilir (olculdu:
// D:\Vibecode\ordu icin 6 kayit) -> secim: archivedAt bos (aktif) + updatedAt en yeni.
// title bos/null -> baslik YOK (UI'da dashed yol durust yedek — uydurma baslik YOK, E10).
// Kayit defteri BOZUK/OKUNAMAZSA -> tarama DEGIL, yalniz basliklar bos kalir (fail-closed ayri).
// Baslik kararsiz KULLANICI verisidir: yanitta tasinir, UI'da esc() ile akitalir (etiket deseni).
function workspaceBasliklari(paseoEv) {
  const harita = new Map(); // dash-dizin -> baslik
  let ham;
  try { ham = JSON.parse(readFileSync(join(String(paseoEv), 'projects', 'workspaces.json'), 'utf8')); } catch { return harita; }
  if (!Array.isArray(ham)) return harita; // beklenmedik sekil -> bos harita (fail-closed ayri)
  const aday = new Map(); // dash-dizin -> { baslik, ms }
  for (const w of ham) {
    if (!w || typeof w !== 'object' || typeof w.cwd !== 'string' || !w.cwd.trim()) continue;
    if (w.archivedAt) continue; // arsivli kayit baslik tasimaz
    const ms = typeof w.updatedAt === 'string' && Number.isFinite(Date.parse(w.updatedAt)) ? Date.parse(w.updatedAt) : -Infinity;
    const mevcut = aday.get(w.cwd);
    if (mevcut === undefined || ms >= mevcut.ms) aday.set(w.cwd, { ms, baslik: typeof w.title === 'string' && w.title.trim() ? w.title : null });
  }
  for (const [cwd, v] of aday) {
    if (v.baslik !== null) harita.set(cwd.replace(/[\\/:]+/g, '-'), v.baslik);
  }
  return harita;
}

export function projelerTara(paseoEv, secenekler = {}) {
  const kok = join(String(paseoEv), 'agents');
  const basliklar = workspaceBasliklari(paseoEv); // FAZ-G: workspaces.json basliklari (salt-okur)
  const projeler = []; let atlanan = 0;
  let dizinler = [];
  try { dizinler = readdirSync(kok); } catch { return { projeler: [], atlanan: 0 }; }
  const orduDizinAdi = secenekler && typeof secenekler.orduDizinAdi === 'string' ? secenekler.orduDizinAdi : null;
  for (const d of dizinler.slice().sort()) {
    const projeYolu = join(kok, d);
    let st; try { st = statSync(projeYolu); } catch { continue; }
    if (!st.isDirectory()) continue;
    let dosyalar = [];
    try { dosyalar = readdirSync(projeYolu); } catch { continue; }
    const ajanlar = [];
    let klasorCwd = null; // FAZ-Q: GERÇEK klasör adının kaynağı — ajan kaydının cwd alanı (dash-bölme YASAK: klasör adının kendisi tireli olabilir); İLK dolu olan yeter — aynı dizindeki kayıtlar aynı yola işaret eder
    for (const f of dosyalar) {
      if (!f.endsWith('.json')) continue;
      let k; try { k = JSON.parse(readFileSync(join(projeYolu, f), 'utf8')); } catch { atlanan++; continue; }
      if (!k || typeof k !== 'object' || typeof k.id !== 'string' || !k.id.trim()) { atlanan++; continue; }
      if (klasorCwd === null && typeof k.cwd === 'string' && k.cwd.trim()) klasorCwd = k.cwd.trim();
      ajanlar.push({
        ajanKimligi: k.id, // TAM kimlik — Composer gönderim hedefi (whitelist) ağaç/kart kısa önek değil bunu kullanır
        ajanId: kisaAjanId(k.id),
        lastStatus: typeof k.lastStatus === 'string' && k.lastStatus.trim() ? k.lastStatus : null,
        sonEtkinlikISO: typeof k.lastActivityAt === 'string' && Number.isFinite(Date.parse(k.lastActivityAt)) ? k.lastActivityAt : null,
        provider: typeof k.provider === 'string' && k.provider.trim() ? k.provider : null,
        etiket: typeof k.title === 'string' && k.title.trim() ? k.title : null, // ham değer — UI'da esc() ile (kararsız alan)
      });
    }
    if (ajanlar.length === 0) continue; // ajani hic dogmamis workspace bu kaynakta gorunmez
    const durumSayilari = { running: 0, idle: 0, error: 0, closed: 0, diger: 0 };
    const saglayicilar = {};
    let sonMs = -Infinity; let sonEtkinlikISO = null;
    for (const a of ajanlar) {
      durumSayilari[BILINEN_DURUMLAR.includes(a.lastStatus) ? a.lastStatus : 'diger'] += 1;
      const p = a.provider || 'bilinmiyor';
      saglayicilar[p] = (saglayicilar[p] || 0) + 1;
      const ms = a.sonEtkinlikISO !== null ? Date.parse(a.sonEtkinlikISO) : NaN;
      if (Number.isFinite(ms) && ms > sonMs) { sonMs = ms; sonEtkinlikISO = a.sonEtkinlikISO; }
    }
    const sirali = ajanlar.slice().sort((a, b) => {
      const am = a.sonEtkinlikISO !== null ? Date.parse(a.sonEtkinlikISO) : -Infinity;
      const bm = b.sonEtkinlikISO !== null ? Date.parse(b.sonEtkinlikISO) : -Infinity;
      return bm - am;
    });
    projeler.push({
      dizin: d,
      projeAdi: d, // dizin basename'i — ajan title'lari kararsiz (mojibake dahil), kullanilmaz
      baslik: basliklar.has(d) ? basliklar.get(d) : null, // FAZ-G: workspaces.json TAM basligi; YOK = null (UI'da dashed yol durust yedek; kararsiz alan — UI'da esc() ile)
      klasorAdi: klasorCwd === null ? null : (klasorCwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || null), // FAZ-Q (kullanıcı «sadece klasör adlarını yaz»): GERÇEK klasör adı — cwd basename'i (son \ veya / sonrası segment; son ayraçlar temizlenir; boş = null). Dash-bölme YASAK: 'woo-block' klasörü TEK segment'tir, 'block' DEĞİL
      ajanSayisi: ajanlar.length,
      ajanlar, // TAM liste (FAZ-A): her kayıt ajanKimligi + kısa önek + durum + etkinlik + sağlayıcı + etiket — Composer hedef seçiminin veri kaynağı
      sonEtkinlikISO,
      durumSayilari,
      saglayicilar,
      sonAjanlar: sirali.slice(0, 5).map((a) => ({ ajanId: a.ajanId, lastStatus: a.lastStatus, sonEtkinlikISO: a.sonEtkinlikISO })),
      orduMu: orduDizinAdi !== null && d === orduDizinAdi,
    });
  }
  return { projeler, atlanan };
}
