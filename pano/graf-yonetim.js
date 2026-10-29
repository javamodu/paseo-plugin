// G9-ÇEKİRDEK DENAYI (KAPI K9 — dar kapsam test, 2026-10-29) — graf ici yonetim isleyisinin saf cekirdegi.
// Kalp: dugum sec -> ajanlari GEREKCELI filtrele -> ata -> versiyon+diff -> onay.
// DISIPLIN: disk YAZMAZ (server.js donmus — POST uclari K8 onayina bagli); saf fonksiyon; fail-closed (RED = Error).
// Kaynak sema: plans/gorev-grafigi-2026-10-26.json (ajanKadrosu/roller/yetkiMatrisi/gorevler) — gercek veri testte okunur.
// MIRAS VARSAYIMI: daraltma-only — alt kapsam ust izni asla GENISLETEMEZ (grants.ts 'buyutemez katman-a' ruhu).
// DOKUMAN VARSAYIMI: KUME — ajan birden fazla dokuman okur (ANAYASA + AGENTS + tasarim + rol.md); okuma sirasi genelden dara.

export const KAPSAM_SIRASI = ['sistem', 'proje', 'graf', 'gorev', 'ajan'];

// dizin onek kurali: 'core/src' izni ['core/'] kapsamindadir; 'plans/roller' ['plans/'] kapsaminda.
export function dizinKapsaminda(yol, izinliOnekler) {
  if (typeof yol !== 'string' || !Array.isArray(izinliOnekler) || izinliOnekler.length === 0) return false;
  const s = String(yol).replace(/\\/g, '/').replace(/\/+$/, '') + '/';
  return izinliOnekler.some((p) => {
    const o = String(p).replace(/\\/g, '/').replace(/\/+$/, '') + '/';
    return s === o || s.startsWith(o);
  });
}

function altKume(alt, ust) {
  const u = new Set(ust || []);
  return (alt || []).every((x) => u.has(x));
}

// MIRAS COZUMU — zincir: [{kapsam:'sistem'|'proje'|'graf'|'gorev'|'ajan', izin:{dizin,komutlar,rate,yetki}}...]
// Siralar SIRADA olmali (sistem once). Alt kapsam yalniz DARALTIR: genisletme girisi RED (fail-closed).
export function izCoz(zincir) {
  if (!Array.isArray(zincir) || zincir.length === 0) {
    throw new Error('G9 RED: miras zinciri bos — sistem tabani zorunlu');
  }
  let taban = null;
  for (const halka of zincir) {
    if (!KAPSAM_SIRASI.includes(halka.kapsam)) {
      throw new Error('G9 RED: bilinmeyen kapsam: ' + halka.kapsam);
    }
    if (taban && KAPSAM_SIRASI.indexOf(halka.kapsam) < KAPSAM_SIRASI.indexOf(taban.kapsam)) {
      throw new Error('G9 RED: zincir sirasi bozuk — ' + taban.kapsam + ' sonrasi ' + halka.kapsam + ' olamaz');
    }
    const izin = halka.izin || {};
    if (taban === null) {
      taban = {
        kapsam: halka.kapsam,
        dizin: [...(izin.dizin || [])],
        komutlar: [...(izin.komutlar || [])],
        rate: izin.rate,
        yetki: [...(izin.yetki || [])],
      };
      continue;
    }
    // daraltma-only denetimi
    if (!altKume(izin.komutlar, taban.komutlar)) {
      throw new Error('G9 RED: genisletme-komut — ' + halka.kapsam + ' ustte olmayan komut ekleyemez');
    }
    if ((izin.dizin || []).some((d) => !dizinKapsaminda(d, taban.dizin))) {
      throw new Error('G9 RED: genisletme-dizin — ' + halka.kapsam + ' izin disi dizin ekleyemez: ' + izin.dizin.join(','));
    }
    if (typeof izin.rate === 'number' && typeof taban.rate === 'number' && izin.rate > taban.rate) {
      throw new Error('G9 RED: genisletme-rate — tavan buyuyemez (' + taban.rate + ' -> ' + izin.rate + ')');
    }
    if (!altKume(izin.yetki, taban.yetki)) {
      throw new Error('G9 RED: genisletme-yetki — ' + halka.kapsam + ' ustte olmayan yetki ekleyemez');
    }
    // daraltma uygula: belirtilmeyen alan ustte kalir; belirtilen dar hali yazar
    if (izin.dizin) taban = { ...taban, dizin: [...izin.dizin] };
    if (izin.komutlar) taban = { ...taban, komutlar: [...izin.komutlar] };
    if (typeof izin.rate === 'number') taban = { ...taban, rate: izin.rate };
    if (izin.yetki) taban = { ...taban, yetki: [...izin.yetki] };
  }
  return taban;
}

// DOKUMAN KUMESI — kapsamlar: {sistem:[...], proje:[...], graf:[...]} -> {sira, cakisma}
// Okuma sirasi: ANAYASA.md her zaman basta, sonra sistem -> proje -> graf (genelden dara).
// Ayni ad farkli kapsamda: DAR olan kazanir; cakisma listesine yazilir (seffaf).
export function dokumanCoz(kapsamlar) {
  const ANAYASA = 'ANAYASA.md';
  const katman = [];
  const ekle = (ad, kapsam) => {
    if (!ad) return;
    const varOlan = katman.find((k) => k.ad === ad);
    if (varOlan) {
      if (KAPSAM_SIRASI.indexOf(kapsam) > KAPSAM_SIRASI.indexOf(varOlan.kapsam)) {
        katman.push({ ad, kapsam, kazanir: true });
        varOlan.kazanir = false;
        katman.cakisma = katman.cakisma || [];
        katman.cakisma.push({ ad, kazanan: kapsam, kaybeden: varOlan.kapsam });
      }
      return;
    }
    katman.push({ ad, kapsam, kazanir: true });
  };
  ekle(ANAYASA, 'sistem');
  for (const d of kapsamlar.sistem || []) if (d !== ANAYASA) ekle(d, 'sistem');
  for (const d of kapsamlar.proje || []) ekle(d, 'proje');
  for (const d of kapsamlar.graf || []) ekle(d, 'graf');
  return { sira: katman.filter((k) => k.kazanir).map((k) => k.ad), cakisma: katman.cakisma || [] };
}

// ATAMA UYGUNLUK METRIGI — gorev: {id, rol:'MANAGER+TESTER', dizin:'core/ + ...'}, ajan: ORNEK envanter kaydi.
// Donus: {uygun, puan, elenen:[{neden, detay}]} — eleme GEREKCELI (kalbin 'ajanlari nasil sectik' cevabi).
export function uygunluk(gorev, ajan) {
  const elenen = [];
  if (ajan.durum !== 'aktif') elenen.push({ neden: 'pasif', detay: 'ajan durumu: ' + ajan.durum });
  const gerekenRoller = String(gorev.rol || '').split('+').map((s) => s.trim()).filter(Boolean);
  const eksik = gerekenRoller.filter((r) => !(ajan.roller || []).includes(r));
  if (eksik.length > 0) elenen.push({ neden: 'rol-eksik', detay: 'gerekli ' + eksik.join('+') });
  const izinli = (ajan.izin && ajan.izin.dizin) || [];
  const dizinParca = String(gorev.dizin || '').split('+').map((s) => s.trim()).filter(Boolean);
  const yasakDizin = dizinParca.filter((p) => !dizinKapsaminda(p, izinli));
  if (yasakDizin.length > 0) elenen.push({ neden: 'dizin-yasak', detay: yasakDizin.join(' , ') });
  const esZamanli = (ajan.limit && ajan.limit.esZamanli) || 1;
  if ((ajan.dolu || 0) >= esZamanli) elenen.push({ neden: 'limit-dolu', detay: ajan.dolu + '/' + esZamanli });
  return { uygun: elenen.length === 0, puan: elenen.length === 0 ? esZamanli - (ajan.dolu || 0) : 0, elenen };
}

// ATANABILIRLER — goreve kim uygun: uygunlar puan sirali + elenenler gerekceli (G9 yuzunun veri cekirdegi).
export function atanabilirler(gorev, ajanlar) {
  const sonuc = (ajanlar || []).map((a) => ({ ajan: a.ad, ...uygunluk(gorev, a) }));
  return {
    uygunlar: sonuc.filter((s) => s.uygun).sort((x, y) => y.puan - x.puan),
    elenenler: sonuc.filter((s) => !s.uygun),
  };
}

// ATAMA TASLAGI — her degisiklik VERSIYON olarak kalir + diff ile tasinir; onay TASLAK'tir (kalici YOK).
// actor yalniz 'insan:web' (admin on yuzden duzenler — K-0055 katman a'da kalem admin'indir).
export function atamaTaslakla(gorevId, ajanId, onceki, actor, tarih) {
  if (actor !== 'insan:web') throw new Error('G9 RED: taslak actirici insan:web olmali (vekil/ajan olmaz): ' + actor);
  if (!tarih) throw new Error('G9 RED: tarih zorunlu (olcumsuz kayit yasak)');
  const surum = onceki ? (onceki.surum || 0) + 1 : 1;
  const diff = onceki
    ? onceki.ajanId === ajanId
      ? { alan: 'yok', eski: null, yeni: null }
      : { alan: 'ajanId', eski: onceki.ajanId, yeni: ajanId }
    : { alan: 'ajanId', eski: null, yeni: ajanId };
  return { gorevId, ajanId, surum, diff, onay: 'TASLAK', acan: actor, tarih };
}

// ONAY DISIPLINI — yonetim yazisi katmani: 'ai-manager' ya da 'insan:web' onaylar; vekil/ajan RED (buyutemez).
// RED gerekceli olmali. TASLAK olmayan kayit onaylanamaz (fail-closed).
export function onayla(taslak, actor, retGerekce) {
  if (taslak.onay !== 'TASLAK') throw new Error('G9 RED: taslak-degil — yalniz TASLAK onaylanir/red edilir');
  if (actor !== 'ai-manager' && actor !== 'insan:web') {
    throw new Error('G9 RED: yetkisiz-onayci (buyutemez): ' + actor);
  }
  if (retGerekce !== undefined) {
    if (!retGerekce || !String(retGerekce).trim()) throw new Error('G9 RED: red gerekcesiz olmaz');
    return { ...taslak, onay: 'RED', retGerekce: String(retGerekce), onaylayan: actor };
  }
  return { ...taslak, onay: 'ONAYLI', onaylayan: actor };
}
