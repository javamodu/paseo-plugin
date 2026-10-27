// A3 — deneyim→kural derleyicisi hermetik testleri (K-0051 kararları kodlanmış:
// hedef AGENTS.md, ilk toplu onay <=5, sentez ajan turu). DERSLER.md:47 kuralı:
// test cwd'si asla gerçek repo olmaz — kural.jsonl + hedef .md YAZAN testler
// mkdtemp kullanır; kuralSayaci'ya yalnız temp dosyaları verilir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  KURAL_ONAY_METNI, KURAL_PARTI_UST, KuralError,
  derslerOku, kuralSayaci, esikOku, adayUret, adayAnahtari,
  openKuralDefteri, kuralOnayla, kuralYolu, eslesenTaslak,
} from '../src/kural.ts';

const g = () => mkdtempSync(join(tmpdir(), 'a3-kural-'));
const kodIle = (e: unknown, kod: string) => e instanceof KuralError && e.code === kod;

// sayaç fixture'ı: KURAL_SAYAC_DOSYALARI üç dosyası + hedefler.json (esik 40/80)
function sayacKur(kok: string, o: { anayasa?: number; agents?: number; rehber?: number; hedefler?: object } = {}) {
  const { anayasa = 0, agents = 0, rehber = 0, hedefler } = o;
  mkdirSync(join(kok, 'sozlesme'), { recursive: true });
  const liste = (n: number) => Array.from({ length: n }, (_, i) => `- saglik kural ${i}`).join('\n') + (n ? '\n' : '');
  writeFileSync(join(kok, 'ANAYASA.md'), liste(anayasa));
  writeFileSync(join(kok, 'AGENTS.md'), '# AGENTS\n\n' + liste(agents));
  writeFileSync(join(kok, 'sozlesme', 'PASEO-VERIMLILIK-REHBERI-v2.1.md'), liste(rehber));
  writeFileSync(join(kok, 'hedefler.json'), JSON.stringify({ aktifHedefler: { kuralSariEsik: 40, kuralKirmiziEsik: 80, ...hedefler } }));
}

// taslak fixture'ı: DERSLER maddeleri -> adaylar -> kural.jsonl'e taslak (a2 deseni: defter tmp'de)
function taslakKur(kok: string, dersMetinleri: string[]) {
  const derslerEv = join(kok, 'DERSLER.md');
  writeFileSync(derslerEv, '# DERSLER\n\n' + dersMetinleri.map((m, i) => `- 2026-10-2${i + 1} · ders: ${m}`).join('\n') + '\n');
  const tarama = derslerOku(derslerEv);
  const sayac = kuralSayaci(kok);
  const sonuc = adayUret(tarama, sayac.dosyaBasi.flatMap((d) => d.satirlar), Math.max(dersMetinleri.length, 1));
  const dbPath = join(kok, 'data', 'ordu.sqlite');
  const defter = openKuralDefteri(dbPath);
  const t = {
    id: 'krl-test' + Math.random().toString(16).slice(2, 6), at: '2026-10-27T00:00:00.000Z', tip: 'TASLAK' as const,
    sayac: sayac.toplam, esik: 80, adaylar: sonuc.adaylar, dusenler: sonuc.dusenler, kalan: sonuc.kalan,
  };
  defter.taslakKaydet(t);
  return { defter, taslak: t, dbPath };
}

// ---- derslerOku ----

test('A3 derslerOku: (tarihsiz)+tarihli maddeler ayristirilir; "-"siz anomali ADIYLA listelenir (sessiz atlama yok)', () => {
  const kok = g();
  const ev = join(kok, 'DERSLER.md');
  writeFileSync(ev, [
    '# DERSLER', '',
    '- (tarihsiz) birinci ders',
    '- 2026-10-12 · ikinci ders',
    '- (tarihsiz) 2026-10-14: hibrit ders',
    '2026-10-12 · tire-siz anomali',
    '| tablo satiri |',
    'paragraf metni',
    '<!-- html yorumu -->',
    '- 2026-10-13 · Üç ders birden: (1) birinci alt ders (2) ikinci alt ders (3) ucuncu alt ders',
    '- 2026-10-14 · isaretsiz tuzak numaralandirma (1) tek (2) kalir',
    '',
  ].join('\n'));
  const t = derslerOku(ev);
  assert.equal(t.maddeler.length, 6); // tablo + paragraf + yorum madde degil
  assert.equal(t.anomaliler.length, 1);
  assert.equal(t.anomaliler[0].satirNo, 6);
  assert.equal(t.altDersler.length, 8); // 5 tek-alt madde + 1 isaretsiz-coklu(tek kalin) ... 4 tek + 3 alt + 1 tek = 8
  assert.equal(t.maddeler[1].tarihli, true);
  assert.equal(t.maddeler[0].tarihli, false);
  assert.equal(t.maddeler[2].tarihli, false); // hibrit: siniflandirma ONEKLE (gövde-tarihi sınıf bozmaz)
  const coklu = t.maddeler[4];
  assert.equal(coklu.hamMetin.includes('Üç ders birden'), true);
  const cokluAlt = t.altDersler.filter((a) => a.satirNo === 10);
  assert.equal(cokluAlt.length, 3);
  assert.equal(cokluAlt[0].hamMetin, 'birinci alt ders');
});

test('A3 derslerOku fail-closed: dosya yok RED; yalniz-baslik dosya RED (sessiz 0 yok)', () => {
  const kok = g();
  assert.throws(() => derslerOku(join(kok, 'YOK.md')), (e) => kodIle(e, 'dersler-yok'));
  const ev = join(kok, 'BOS.md');
  writeFileSync(ev, '# DERSLER\n');
  assert.throws(() => derslerOku(ev), (e) => kodIle(e, 'dersler-bos'));
});

// ---- kuralSayaci (saglik §5b ikizi) ----

test('A3 kuralSayaci: saglik §5b ikizi — "- " VE "N. " sayilir; tablo/paragraf/-x/--- sayilmaz; BOM soyulur; dosya-basi dokulur', () => {
  const kok = g();
  mkdirSync(join(kok, 'sozlesme'), { recursive: true });
  writeFileSync(join(kok, 'ANAYASA.md'), '﻿- a\n  - girintili b\n1. numarali\n10. on numarali\n-x bosluksuz\n| tablo |\n---\nparagraf\n');
  writeFileSync(join(kok, 'AGENTS.md'), '# AGENTS\n\n- [ ] checklist\n');
  writeFileSync(join(kok, 'sozlesme', 'PASEO-VERIMLILIK-REHBERI-v2.1.md'), '- r1\n2. r2\n');
  const s = kuralSayaci(kok);
  assert.equal(s.dosyaBasi[0].sayi, 4); // - a, girintili, 1., 10. (BOM soyulmazsa 0 olurdu)
  assert.equal(s.dosyaBasi[1].sayi, 1); // checklist isareti sayilir (\s sonrasi)
  assert.equal(s.dosyaBasi[2].sayi, 2);
  assert.equal(s.toplam, 7);
  assert.equal(s.dosyaBasi[0].satirlar.length, 4); // eslesen satirlar DONER (adayUret mevcut havuzu)
});

test('A3 kuralSayaci fail-closed: sayilan dosya tum alternatifleriyle eksikse RED; Find-First alternatifi bulunur', () => {
  const kok = g();
  mkdirSync(join(kok, 'sozlesme'), { recursive: true });
  writeFileSync(join(kok, 'ANAYASA.md'), '- a\n');
  writeFileSync(join(kok, 'CLAUDE.md'), '- c\n'); // AGENTS.md YOK -> Find-First CLAUDE.md'yi bulur (saglik semantigi)
  writeFileSync(join(kok, 'sozlesme', 'PASEO-VERIMLILIK-REHBERI-v2.1.md'), '- r\n');
  const s = kuralSayaci(kok);
  assert.equal(s.toplam, 3);
  assert.equal(s.dosyaBasi[1].yol.endsWith('CLAUDE.md'), true);
  // tum REHBER alternatifleri eksik -> drift alarm RED (saglik sessiz dusuyor, ikiz dusMEZ)
  const kok2 = g();
  writeFileSync(join(kok2, 'ANAYASA.md'), '- a\n');
  writeFileSync(join(kok2, 'AGENTS.md'), '- b\n');
  assert.throws(() => kuralSayaci(kok2), (e) => kodIle(e, 'sayac-dosya-yok'));
});

// ---- adayUret ----

test('A3 adayUret: sha256 icerik-dedup — birebir ayni alt-ders ikinci kez aday DUSMEZ', () => {
  const kok = g();
  const ev = join(kok, 'DERSLER.md');
  writeFileSync(ev, '# DERSLER\n\n- 2026-10-12 · ayni ders metni\n- (tarihsiz) ayni ders metni\n');
  // iki farkli oncu ayni anahtara iner (havuz-agnostik normalizasyon) ama ham metinler farkli
  const t = derslerOku(ev);
  const r = adayUret(t, [], 3);
  assert.equal(r.adaylar.length, 1);
  assert.equal(r.dusenler.length, 1);
  assert.equal(r.dusenler[0].sebep, 'tekrar');
  assert.equal(r.adaylar[0].anahtar, adayAnahtari('ayni ders metni'));
});

test('A3 adayUret: hedef havuzda ZATEN VAR olan kural aday olmaz (cakisan dusurulur + durust listelenir)', () => {
  const kok = g();
  const ev = join(kok, 'DERSLER.md');
  writeFileSync(ev, '# DERSLER\n\n- 2026-10-12 · mevcut kural cumlesi\n- 2026-10-13 · yeni kural cumlesi\n');
  const t = derslerOku(ev);
  const r = adayUret(t, ['- mevcut kural cumlesi'], 3);
  assert.equal(r.adaylar.length, 1);
  assert.equal(r.adaylar[0].hamMetin.includes('yeni kural cumlesi'), true);
  assert.equal(r.dusenler.length, 1);
  assert.equal(r.dusenler[0].sebep, 'cakisan');
});

test('A3 adayUret: tur basina <=3 aday; fazlasi "kalan" olarak durust listelenir', () => {
  const kok = g();
  const ev = join(kok, 'DERSLER.md');
  writeFileSync(ev, '# DERSLER\n\n' + [1, 2, 3, 4, 5].map((i) => `- 2026-10-12 · besinci tur dersi ${i}`).join('\n') + '\n');
  const t = derslerOku(ev);
  const r = adayUret(t, [], 3);
  assert.equal(r.adaylar.length, 3);
  assert.equal(r.kalan, 2);
  assert.equal(r.dusenler.length, 0);
});

test('A3 B4 hibrit govde-tarihi: "(tarihsiz) 2026-10-14: X" anahtar uzayinda tarihsiz X ile eslenir — cakisan dusme + inen satir temiz (denetci bulgusu)', () => {
  assert.equal(adayAnahtari('- (tarihsiz) 2026-10-14: ayni ders'), adayAnahtari('- 2026-10-20 · ayni ders'));
  assert.equal(adayAnahtari('- (tarihsiz) 2026-10-14: ayni ders'), adayAnahtari('- ayni ders'));
  const kok = g();
  const ev = join(kok, 'DERSLER.md');
  writeFileSync(ev, '# DERSLER\n\n- (tarihsiz) 2026-10-14: hibrit ders metni\n');
  const r = adayUret(derslerOku(ev), ['- hibrit ders metni'], 3); // mevcut kural hibrit maddenin govdesi
  assert.equal(r.adaylar.length, 0);
  assert.equal(r.dusenler[0].sebep, 'cakisan');
  // inen satir da AYNI on-ek desenini soyar: hibrit tarih kural metnine sizmaz
  const kok2 = g();
  sayacKur(kok2, { anayasa: 5, agents: 3, rehber: 5 });
  const defter = openKuralDefteri(join(kok2, 'data', 'ordu.sqlite'));
  defter.taslakKaydet({ id: 'krl-hibrit', at: '2026-10-27T00:00:00.000Z', tip: 'TASLAK' as const, sayac: 13, esik: 80,
    adaylar: [{ anahtar: adayAnahtari('- (tarihsiz) 2026-10-14: hibrit inen dersi'), kaynakSatir: 1, altDersIndex: 0, hamMetin: '- (tarihsiz) 2026-10-14: hibrit inen dersi' }],
    dusenler: [], kalan: 0 });
  kuralOnayla({ defter, taslakId: 'krl-hibrit', confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv: join(kok2, 'AGENTS.md'), kok: kok2 });
  assert.equal(readFileSync(join(kok2, 'AGENTS.md'), 'utf8').includes('- hibrit inen dersi (A3 K-0051'), true);
});

// ---- tavan kilidi ----

test('A3 tavan kilidi: sayac+aday > 80 -> derleyici DURUR, hedef dosya DOKUNULMAZ', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 30, agents: 10, rehber: 38 }); // 78
  const { defter, taslak } = taslakKur(kok, ['tavan dersi a', 'tavan dersi b', 'tavan dersi c']); // 78+3=81
  const hedefEv = join(kok, 'AGENTS.md');
  const ham = readFileSync(hedefEv, 'utf8');
  assert.throws(() => kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok }), (e) => kodIle(e, 'tavan-asimi'));
  assert.equal(readFileSync(hedefEv, 'utf8'), ham, 'RED aninda hedef dosya DOKUNULMADI');
});

test('A3 tavan sinir semantigi: 77+3=80 GECER (saglik "-gt 80" ile birebir), 81 RED', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 30, agents: 10, rehber: 37 }); // 77
  const { defter, taslak } = taslakKur(kok, ['sinir dersi a', 'sinir dersi b', 'sinir dersi c']); // 77+3=80
  const hedefEv = join(kok, 'AGENTS.md');
  const r = kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok });
  assert.equal(r.status, 'ONAYLANDI');
  assert.equal(r.yeniSayac, 80);
  assert.equal(kuralSayaci(kok).toplam, 80); // diskten taze — ayri havuza yazilmadi (drift yok)
});

// ---- [insan] kapisI (replanOnayla:276-293 birebir sira) ----

test('A3 [insan] kapisI: yanlis onay metni RED + ajan:proxy aktor RED (EK-2); her RED aninda hedef dosya DOKUNULMADI', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 5, agents: 3, rehber: 5 });
  const { defter, taslak } = taslakKur(kok, ['kapi dersi']);
  const hedefEv = join(kok, 'AGENTS.md');
  const ham = readFileSync(hedefEv, 'utf8');
  assert.throws(() => kuralOnayla({ defter, taslakId: taslak.id, confirm: 'onayliyorum', actor: 'insan:cli', hedefEv, kok }), (e) => kodIle(e, 'onay-metni'));
  assert.equal(readFileSync(hedefEv, 'utf8'), ham);
  assert.throws(() => kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'ajan:proxy', hedefEv, kok }), (e) => kodIle(e, 'aktor-red'));
  assert.equal(readFileSync(hedefEv, 'utf8'), ham, 'EK-2 RED aninda da dokunulmadi');
});

test('A3 kapi negatifleri: olmayan taslakId RED; adaysiz taslak RED', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 5, agents: 3, rehber: 5 });
  const { defter, taslak } = taslakKur(kok, ['kapi dersi']);
  const hedefEv = join(kok, 'AGENTS.md');
  assert.throws(() => kuralOnayla({ defter, taslakId: 'krl-yok', confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok }), (e) => kodIle(e, 'taslak-yok'));
  const bos = { ...taslak, id: 'krl-bos', adaylar: [] };
  defter.taslakKaydet(bos);
  assert.throws(() => kuralOnayla({ defter, taslakId: 'krl-bos', confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok }), (e) => kodIle(e, 'aday-yok'));
  // parti kapisi: 6 adayli taslak RED (K-0051 karar 2 — ilk toplu onay <=5)
  const alti = { ...taslak, id: 'krl-alti', adaylar: [1, 2, 3, 4, 5, 6].map((i) => ({ anahtar: 'k' + i, kaynakSatir: i, altDersIndex: 0, hamMetin: 'alti dersi ' + i })) };
  defter.taslakKaydet(alti);
  assert.throws(() => kuralOnayla({ defter, taslakId: 'krl-alti', confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok }), (e) => kodIle(e, 'parti-ust'));
});

test('A3 onayli toplu uygulama: N aday TEK KURALLARI ONAYLIYORUM ile iner; sayac eski+N tazelenir; ikinci onay idempotent RED', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 30, agents: 10, rehber: 30 }); // 70
  const { defter, taslak } = taslakKur(kok, ['toplu dersi a', 'toplu dersi b', 'toplu dersi c']);
  const hedefEv = join(kok, 'AGENTS.md');
  const eski = kuralSayaci(kok).toplam;
  const r = kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok });
  assert.equal(r.status, 'ONAYLANDI');
  assert.equal(r.uygulanan, 3);
  assert.equal(kuralSayaci(kok).toplam, eski + 3); // sayac eski+N — DISK'TEN (ayri havuz drift yok)
  const yeni = readFileSync(hedefEv, 'utf8').split(/\r?\n/);
  assert.equal(yeni.filter((l) => l.includes('A3 K-0051; kaynak DERSLER satır')).length, 3); // kaynak satir referansi tasinir
  assert.equal(yeni.filter((l) => /^- /.test(l) && l.includes('saglik kural')).length, 10); // eski satirlar duruyor
  assert.throws(() => kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok }), (e) => kodIle(e, 'onaylandi-zaten'));
  assert.equal(defter.onaylar().length, 1);
});

test('A3 B1 cift-uygulama kilidi: onay aninda GUNCEL havuzla yeniden dedup — ortusen ikinci taslak RED bayat-taslak, ders metni hedefte IKIZLENMEZ (denetci bulgusu)', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 5, agents: 3, rehber: 5 });
  const { defter, taslak } = taslakKur(kok, ['ortusen dersi a', 'ortusen dersi b']);
  // ayni olcum penceresinde dogmus IKINCI taslak (ilk onaydan ONCE; cokme penceresi ayni kok):
  const ikinci = { ...taslak, id: 'krl-ikinci' };
  defter.taslakKaydet(ikinci);
  const hedefEv = join(kok, 'AGENTS.md');
  kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok });
  assert.throws(() => kuralOnayla({ defter, taslakId: 'krl-ikinci', confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok }), (e) => kodIle(e, 'bayat-taslak'));
  const sonSatirlar = readFileSync(hedefEv, 'utf8').split(/\r?\n/);
  assert.equal(sonSatirlar.filter((l) => l.includes('ortusen dersi a')).length, 1, 'ders metni hedefte BIR KEZ (ikizleme yok)');
  assert.equal(sonSatirlar.filter((l) => l.includes('ortusen dersi b')).length, 1);
  assert.equal(defter.onaylar().length, 1); // ikinci onay kayda inmedi (fail-closed)
});

test('A3 B6 provenans capasi: sentez INIS sonrasi ham-anahtar eslesmez — kaynak-satir capasi adayi cakisan DUSURUR; elle ikinci taslak bayat-taslak RED (uretim bulgusu: onay sonrasi aday 3 donuyordu)', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 5, agents: 3, rehber: 5 });
  const hedefEv = join(kok, 'AGENTS.md');
  const { defter, taslak } = taslakKur(kok, ['provenans dersi']);
  const aday = taslak.adaylar[0];
  const kaynakSatir = aday.kaynakSatir;
  // sentez: metni KOKTEN farkli yaz (anahtar-hash eslesmesi IMKANSIZ — uretim senaryosu birebir)
  defter.sentezKaydet(taslak.id, aday.anahtar.slice(0, 12), 'Tamamen baska sozcuklerle yeniden yazilmis sentez kural metni.', 'ajan:llm');
  kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok });
  assert.equal(readFileSync(hedefEv, 'utf8').includes('Tamamen baska sozcuklerle'), true); // sentez metni indi
  // 1) yeniden OLCUM: inen sentez satiri havuzda — aday DONMEMELI (capa dusurur)
  const sayac2 = kuralSayaci(kok);
  const tarama2 = derslerOku(join(kok, 'DERSLER.md'));
  const r2 = adayUret(tarama2, sayac2.dosyaBasi.flatMap((d) => d.satirlar), 3);
  assert.equal(r2.adaylar.length, 0, 'inen sentez kurali aday listesine DONMEZ (provenans capasi)');
  assert.equal(r2.dusenler.some((d) => d.kaynakSatir === kaynakSatir && d.sebep === 'cakisan'), true, 'kaynak satir capasi cakisan dusurdu');
  // 2) B1 kapisi da capa ile yakalar: elle ikinci taslak (ayni kaynak satir) RED
  const ikinci = { ...taslak, id: 'krl-prov2' };
  defter.taslakKaydet(ikinci);
  assert.throws(() => kuralOnayla({ defter, taslakId: 'krl-prov2', confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok }), (e) => kodIle(e, 'bayat-taslak'));
  assert.equal(readFileSync(hedefEv, 'utf8').split(/\r?\n/).filter((l) => l.includes('provenans dersi')).length, 0, 'ham metin HIC inmedi (yalniz sentez metni indi)');
});

test('A3 B7 olcum idempotansi: ayni aday-anahtar seti icin YENI taslak DOGMAZ — onaysiz es-taslak doner (uretim bulgusu: her olcum kosumu yeni kayit dusuruyordu)', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 5, agents: 3, rehber: 5 });
  const { dbPath } = taslakKur(kok, ['idempotans dersi a', 'idempotans dersi b']);
  const defter = openKuralDefteri(dbPath);
  const tarama = derslerOku(join(kok, 'DERSLER.md'));
  const sayac = kuralSayaci(kok);
  const sonuc = adayUret(tarama, sayac.dosyaBasi.flatMap((d) => d.satirlar), 3);
  const oncekiTaslakSayisi = defter.taslaklar().length;
  const onayli = new Set(defter.onaylar().map((a) => a.taslakId));
  const eslesen = eslesenTaslak(defter.taslaklar(), onayli, sonuc.adaylar);
  assert.ok(eslesen, 'ilk taslak es-taslak olarak bulunur');
  assert.equal(eslesen!.adaylar.length, 2);
  assert.equal(defter.taslaklar().length, oncekiTaslakSayisi, 'kayit sayisi ARTMADI (yenisi dogmadi)');
  // farkli aday seti: eslesme YOK (yeni taslak dogar — CLI yuzunde)
  const farkli = sonuc.adaylar.slice(0, 1);
  assert.equal(eslesenTaslak(defter.taslaklar(), onayli, farkli), undefined, 'kismi set eslesmez');
  // onay sonrasi: B6 capasi adaylari dusurdugunden yeni olcum aday URETMEZ
  kuralOnayla({ defter, taslakId: eslesen!.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv: join(kok, 'AGENTS.md'), kok });
  const sayac2 = kuralSayaci(kok);
  const r2 = adayUret(derslerOku(join(kok, 'DERSLER.md')), sayac2.dosyaBasi.flatMap((d) => d.satirlar), 3);
  assert.equal(r2.adaylar.length, 0);
  const onayli2 = new Set(defter.onaylar().map((a) => a.taslakId));
  assert.equal(eslesenTaslak(defter.taslaklar(), onayli2, r2.adaylar), undefined, 'onayli taslak es-taslak degildir (idempotans onaya karsi)');
});

// ---- hedefEkle ----

test('A3 hedefEkle: MD-ezmez append — mevcut satirlar SATIR-SATIR birebir; yeni kural yalniz sona girer; EOL korunur', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 5, agents: 3, rehber: 5 });
  const hedefEv = join(kok, 'AGENTS.md');
  const orij = '# AGENTS\n\n- eski kural 1\n- eski kural 2\n';
  writeFileSync(hedefEv, orij); // sayac fixture'inin AGENTS.md'si uzerine (kucuk sayaç — onay tavan altında)
  const eskiSatirlar = orij.split('\n');
  const { defter, taslak } = taslakKur(kok, ['ezilmez dersi']);
  const sonuc = kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv, kok });
  assert.equal(sonuc.uygulanan, 1);
  const eskiK = eskiSatirlar.slice(0, -1); // trailing '' cikar (orij '\n' ile bitiyor)
  const sonK = readFileSync(hedefEv, 'utf8').split('\n');
  assert.equal(sonK.length, eskiK.length + 2); // eski satirlar + 1 yeni satir + trailing ''
  for (let i = 0; i < eskiK.length; i++) assert.equal(sonK[i], eskiK[i]); // onceki satirlar birebir
  assert.equal(sonK[eskiK.length].startsWith('- ders: ezilmez dersi (A3 K-0051'), true); // madde oncusu SOYULDU (cift tire yok)
  // CRLF hedefi: eklenecek satir da CRLF tasiyacak (PS >> tuzaği)
  const crlfEv = join(kok, 'CRLF.md');
  writeFileSync(crlfEv, '# CRLF\r\n\r\n- eski crlf\r\n');
  taslakKur(kok, ['crlf dersi']); // ayri taslak defteri ayni kok'te — data/ ayni; taslak id farkli
  const defter2 = openKuralDefteri(join(kok, 'data', 'ordu.sqlite'));
  const t2 = defter2.taslaklar().find((t) => t.adaylar.some((a) => a.hamMetin.includes('crlf dersi')));
  kuralOnayla({ defter: defter2, taslakId: t2!.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv: crlfEv, kok });
  const crlfSonrasi = readFileSync(crlfEv, 'utf8');
  assert.equal(crlfSonrasi.includes('\r\n- ders: crlf dersi (A3 K-0051'), true, 'CRLF hedefe CRLF satir eklendi');
});

test('A3 hedefEkle yazim disciplini: tmp+fsync+rename — tmp kalintisi 0', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 5, agents: 3, rehber: 5 });
  const { defter, taslak } = taslakKur(kok, ['tmp dersi']);
  kuralOnayla({ defter, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv: join(kok, 'AGENTS.md'), kok });
  const kalinti = readdirSync(kok).filter((f) => f.includes('.tmp-'));
  assert.equal(kalinti.length, 0);
  assert.equal(existsSync(join(kok, 'data', 'kural.jsonl')), true); // defter diske indi
});

// ---- kural.jsonl kalıcılığı ----

test('A3 kural.jsonl: tarama icerikHash idempotent; yeniden acilis replay; sentez overlay (ajan:llm) onay metnine iner', () => {
  const kok = g();
  sayacKur(kok, { anayasa: 5, agents: 3, rehber: 5 });
  const { taslak, dbPath } = taslakKur(kok, ['replay dersi a', 'replay dersi b']);
  const d1 = openKuralDefteri(dbPath);
  const k1 = d1.taramaKaydet({ maddeSayisi: 2, altDersSayisi: 2, adaySayisi: 2, sayac: 13 });
  assert.equal(k1.kaydedildi, true);
  const k2 = d1.taramaKaydet({ maddeSayisi: 2, altDersSayisi: 2, adaySayisi: 2, sayac: 13 });
  assert.equal(k2.kaydedildi, false); // sayilar degismedikce kayit DUSMEZ (spam onlenir)
  // sentez ajan turu: aday metni sikilastirilir (ajan:llm kaydi — onay DEGIL)
  const aday = taslak.adaylar[0];
  d1.sentezKaydet(taslak.id, aday.anahtar.slice(0, 12), 'Tek cümlelik sentez kuralı.', 'ajan:llm');
  const d2 = openKuralDefteri(dbPath); // yeniden acilis: replay + sentez overlay
  const t2 = d2.taslaklar().find((t) => t.id === taslak.id)!;
  assert.equal(t2.adaylar[0].sentezMetin, 'Tek cümlelik sentez kuralı.');
  assert.equal(t2.adaylar[1].sentezMetin, undefined); // sentezsiz aday ham kalir (ADIYLA)
  const r = kuralOnayla({ defter: d2, taslakId: taslak.id, confirm: KURAL_ONAY_METNI, actor: 'insan:cli', hedefEv: join(kok, 'AGENTS.md'), kok });
  assert.equal(r.sentezsiz, 1); // 1 sentezli + 1 ham — onay kaydinda durust
  const son = readFileSync(join(kok, 'AGENTS.md'), 'utf8');
  assert.equal(son.includes('Tek cümlelik sentez kuralı.'), true); // sentez metni indi
  assert.equal(son.includes('replay dersi b (A3 K-0051'), true); // sentezsiz aday ham metinle indi (öncü soyulmuş)
});

test('A3 kural.jsonl tail-repair: bozuk SON satir budanir; ORTA satir bozuksa fail-closed RED', () => {
  const kok = g();
  const dbPath = join(kok, 'data', 'ordu.sqlite');
  mkdirSync(join(kok, 'data'), { recursive: true });
  const p = kuralYolu(dbPath);
  const gecerli = JSON.stringify({ event: 'onay', at: '2026-10-27T00:00:00.000Z', taslakId: 'krl-x', actor: 'insan:cli', uygulanan: 1, yeniSayac: 1, sentezsiz: 0 });
  writeFileSync(p, gecerli + '\n' + 'GARBAGE-yarim-satir'); // son satir yarim (crash semasi)
  const d1 = openKuralDefteri(dbPath);
  assert.equal(d1.onaylar().length, 1); // gecerli kayit yuklendi
  const boyut = statSync(p).size;
  assert.equal(readFileSync(p, 'utf8').includes('GARBAGE'), false, 'son satir budandi');
  assert.equal(boyut, gecerli.length + 1);
  // ORTA satir bozuk -> RED (sessiz onarim veri kaybini gizler)
  writeFileSync(p, 'GARBAGE-orta\n' + gecerli + '\n');
  assert.throws(() => openKuralDefteri(dbPath), (e) => kodIle(e, 'bozuk-kayit'));
});
