// A2 (graf v6; OTONOMİ MERDİVENİ AŞAMA 2/L3): REPLAN MOTORU.
// (1) DRIFT% ölçer — V4 taramasının kalıcılaşması: plans/PLAN.md §18 "tek takip
//     yüzeyi" ↔ plans/kabul.csv çapraz-referans; bayat hücre ADIYLA görünür
//     (V4-01: P1-9 "CANLI KANIT YOK" iken K13-01 PASS sınıfı kökten kapanır).
// (2) Sapma ölçer — hedef ([insan] eşik onayı: eşiği KOD TAŞIMAZ, çağıran verir;
//     varsayılan YOK → tetikleme dürüst kapalı) ↔ gerçek (kabul.csv'den sayım)
//     + defter run istatistikleri (bağlam; DRIFT'in iş ayağı).
// (3) Replan tetikleyicisi — eşik aşımı/bayat satır → TASLAK (veri; "LLM turu"
//     DIŞARIDADIR — core LLM içermez, taslağı yorumlamak manager'ın işi) →
//     [insan] kapısı: onay metni sürtünmesi (B01 CLEAR_STOP deseni) + aktör
//     'insan:cli' zorunlu (EK-2: ajan/proxy aktörü RED) → onaylanınca §18 durum
//     hücreleri tazelenir. ONAYSIZ PLAN DEĞİŞMEZ (tasarım kararı — sürü kendi
//     hedefini kaydıramaz).
// R6: yeni tablo / command.kind / event.type YOK. Kalıcılık: replan.jsonl
// append-only (notify.ts deseni — fsync + son-satır onarımı, orta satır bozuksa
// RED), yol dirname(dbPath)/replan.jsonl (pano sonra oradan okuyabilir).
// §18 tazeleme MD-ezmez: yalnız Durum hücresi değişir; hücresi eşleşmeyen
// satıra DOKUNULMAZ + raporda görünür (sessiz atlama yok).
import {
  existsSync, mkdirSync, readFileSync,
  openSync, writeSync, fsyncSync, ftruncateSync, closeSync, renameSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export const REPLAN_ONAY_METNI = 'REPLAN ONAYLIYORUM'; // insan sürtünmesi (B01 deseni)

// kabul.csv durum kümeleri (saglik.ps1 ile aynı sınıflar; yazım varyantı dahil)
const YESIL = new Set(['PASS', 'GECTI', 'GECTI_HERMETIC', 'GECTI_HERMETIK', 'GECTI_CANLI']);
const TANINAN = new Set([...YESIL, 'FAIL', 'NOT_RUN', 'KISMEN']);

export interface KabulSatiri { id: string; durum: string }
export interface KabulDefteri { satirlar: KabulSatiri[]; atlanan: number; ev: string }

export class ReplanError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.name = 'ReplanError'; this.code = code; }
}
const red = (code: string, msg: string): never => { throw new ReplanError(code, msg); };

// ---- kabul.csv okuma (salt-okur; CRLF + kaniT içi virgül tolere — yalnız ilk 4 alan) ----
export function kabulOku(ev: string): KabulDefteri {
  if (!existsSync(ev)) red('kabul-yok', `kabul defteri yok: ${ev} (ölçüm koşmaz — sessiz 0 YOK)`);
  const ham = readFileSync(ev, 'utf8');
  const satirlar: KabulSatiri[] = [];
  let atlanan = 0;
  for (const satir of ham.split(/\r?\n/)) {
    if (satir.trim() === '' || satir.startsWith('id,')) continue;
    const alan = satir.split(',');
    const id = (alan[0] ?? '').trim();
    const durum = (alan[3] ?? '').trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id) || !TANINAN.has(durum)) { atlanan++; continue; }
    satirlar.push({ id, durum });
  }
  if (satirlar.length === 0) red('kabul-bos', `kabul defterinde geçerli satır yok: ${ev}`);
  return { satirlar, atlanan, ev };
}

// ---- PLAN.md §18 satırları + kabul-id eşlemesi ----
export interface Plan18Satiri { satirId: string; kabulIdler: string[]; eskiDurum: string; satirNo: number }

// "K12-01/02" → K12-01, K12-02; "M26/M31" → M26, M31; "F6-A/B/C" → F6-A, F6-B, F6-C
function kabulIdAc(grup: string): string[] {
  const parcalar = grup.split('/');
  const out = [parcalar[0]];
  for (let i = 1; i < parcalar.length; i++) {
    const p = parcalar[i];
    if (/^[A-Z]/.test(p)) out.push(p); // tam id (M31)
    else {
      const ilk = parcalar[0];
      const kes = ilk.lastIndexOf('-');
      if (kes < 0) continue;
      out.push(ilk.slice(0, kes + 1) + p); // sonek (02 → K12-02)
    }
  }
  return out;
}

export function plan18Oku(md: string): Plan18Satiri[] {
  const out: Plan18Satiri[] = [];
  const satirlar = md.split(/\r?\n/);
  for (let i = 0; i < satirlar.length; i++) {
    const m = /^\|\s*(P[0-9]-[0-9]+)\s*\|/.exec(satirlar[i]);
    if (!m) continue;
    const hucre = satirlar[i].split('|');
    if (hucre.length !== 8) continue; // 6 kolon: ['', id, açıklama, kod, kabul, kanıt, durum, '']
    const kabulKolon = (hucre[4] ?? '').trim();
    const idAday = /\b[A-Z]{1,2}[0-9][0-9A-Za-z-]*(?:\/[0-9A-Za-z-]+)*\b/g;
    const idler: string[] = [];
    for (const g of kabulKolon.match(idAday) ?? []) idler.push(...kabulIdAc(g));
    out.push({ satirId: m[1], kabulIdler: idler, eskiDurum: (hucre[6] ?? '').trim(), satirNo: i });
  }
  return out;
}

// ---- (1) DRIFT% ölçer — §18 ↔ kabul tutarlılığı (V4 tanımının kodlaşması) ----
export interface BayatHucre { satirId: string; kabulId: string; kabulDurum: string; eskiDurum: string }
export interface DriftOlcumu {
  taranan: number; tutarli: number; bayat: number; driftYuzde: number;
  bayatHucreler: BayatHucre[]; eslesenYok: string[];
}

const KAPALI_ISARET = /kapandi|GECTI|PASS/i;

export function olcDrift(md: string, kabul: KabulDefteri): DriftOlcumu {
  const durumById = new Map(kabul.satirlar.map((s) => [s.id, s.durum]));
  const bayatHucreler: BayatHucre[] = [];
  const eslesenYok: string[] = [];
  let taranan = 0, tutarli = 0;
  for (const satir of plan18Oku(md)) {
    const yesilIdler = satir.kabulIdler.filter((id) => YESIL.has(durumById.get(id) ?? ''));
    const eslesen = satir.kabulIdler.filter((id) => durumById.has(id));
    if (eslesen.length === 0) { eslesenYok.push(satir.satirId); continue; } // ölçüm dışı — dürüst listelenir
    taranan++;
    if (yesilIdler.length === 0) { tutarli++; continue; } // dürüst kırmızı: §18 açık + kabul de açık
    if (KAPALI_ISARET.test(satir.eskiDurum)) { tutarli++; continue; } // kapanış zaten işlenmiş
    for (const kabulId of yesilIdler)
      bayatHucreler.push({ satirId: satir.satirId, kabulId, kabulDurum: durumById.get(kabulId)!, eskiDurum: satir.eskiDurum });
  }
  const driftYuzde = taranan === 0 ? 0 : Math.round((tutarli / taranan) * 1000) / 10;
  return { taranan, tutarli, bayat: bayatHucreler.length, driftYuzde, bayatHucreler, eslesenYok };
}

// ---- (2) Sapma ölçer — hedef ↔ gerçek + defter bağlamı ----
export interface SapmaOlcumu {
  yesil: number; toplam: number; gercekYuzde: number; hedefYuzde: number | null;
  sapmaYuzde: number | null; esik: number | null; asim: boolean | null;
  defter: { runsDurum: Record<string, number>; attemptSayisi: number };
}

export function olcSapma(db: DatabaseSync, kabul: KabulDefteri, o: { hedefYuzde?: number; esik?: number }): SapmaOlcumu {
  const yesil = kabul.satirlar.filter((s) => YESIL.has(s.durum)).length;
  const toplam = kabul.satirlar.length;
  const gercekYuzde = Math.round((yesil / toplam) * 1000) / 10;
  const hedefYuzde = o.hedefYuzde ?? null;
  const esik = o.esik ?? null;
  const sapmaYuzde = hedefYuzde === null ? null : Math.round((hedefYuzde - gercekYuzde) * 10) / 10;
  const runsDurum: Record<string, number> = {};
  for (const r of db.prepare('SELECT state, COUNT(*) AS c FROM runs GROUP BY state').all() as any[])
    runsDurum[r.state] = r.c;
  const attemptSayisi = (db.prepare('SELECT COUNT(*) AS c FROM attempts').get() as any).c;
  return { yesil, toplam, gercekYuzde, hedefYuzde, sapmaYuzde, esik, asim: esik === null || sapmaYuzde === null ? null : sapmaYuzde > esik, defter: { runsDurum, attemptSayisi } };
}

// ---- (3) Replan taslağı (veri; LLM turu DIŞARIDA) ----
export interface ReplanOneri { satirId: string; eskiDurum: string; yeniDurum: string; kabulId: string }
export interface ReplanTaslagi {
  id: string; at: string; tip: 'TASLAK';
  tetik: 'sapma-esik-asimi' | 'drift-bayat-satir' | 'sapma-esik-asimi+drift-bayat-satir' | 'tetiklenmedi';
  sapma: SapmaOlcumu; drift: DriftOlcumu; oneriler: ReplanOneri[];
}

export function replanTaslagi(sapma: SapmaOlcumu, drift: DriftOlcumu, now: () => Date = () => new Date()): ReplanTaslagi {
  // Bir §18 satırının Durum hücresi TEK'tir: aynı satıra düşen çok kabul kanıtı
  // TEK öneride birleşir (P2-10/K13-03+K13-04 deseni — hücre başına ayrı yazma yarış yaratmaz).
  const satirGrup = new Map<string, BayatHucre[]>();
  for (const b of drift.bayatHucreler) {
    const mevcut = satirGrup.get(b.satirId) ?? [];
    mevcut.push(b);
    satirGrup.set(b.satirId, mevcut);
  }
  const oneriler: ReplanOneri[] = [...satirGrup.entries()].map(([satirId, hucreler]) => ({
    satirId,
    eskiDurum: hucreler[0].eskiDurum,
    kabulId: hucreler.map((h) => h.kabulId).join('+'),
    yeniDurum: `kapandi -> ${hucreler[0].kabulDurum} (kabul.csv ${hucreler.map((h) => h.kabulId).join(', ')}; replan tazeleme ${now().toISOString().slice(0, 10)})`,
  }));
  const asim = sapma.asim === true;
  const bayat = drift.bayat > 0;
  const tetik: ReplanTaslagi['tetik'] = asim && bayat ? 'sapma-esik-asimi+drift-bayat-satir' : asim ? 'sapma-esik-asimi' : bayat ? 'drift-bayat-satir' : 'tetiklenmedi';
  return { id: 'rpl-' + randomUUID().slice(0, 8), at: now().toISOString(), tip: 'TASLAK', tetik, sapma, drift, oneriler };
}

// ---- §18 tazeleme (MD-ezmez: yalnız Durum hücresi; eşleşmeyen satıra DOKUNULMAZ) ----
export function plan18Tazele(md: string, oneriler: ReplanOneri[]): { md: string; uygulanan: number; dokunulmayan: string[] } {
  const satirlar = md.split(/\r?\n/);
  const dokunulmayan: string[] = [];
  let uygulanan = 0;
  for (const o of oneriler) {
    const idx = satirlar.findIndex((s) => s.startsWith('| ' + o.satirId + ' ') || s.startsWith('| ' + o.satirId + '\t') || s.replace(/\s+/g, ' ').startsWith('| ' + o.satirId + ' |'));
    if (idx < 0) { dokunulmayan.push(o.satirId + ' (satir bulunamadi)'); continue; }
    const hucre = satirlar[idx].split('|');
    if (hucre.length !== 8) { dokunulmayan.push(o.satirId + ' (kolon yapisu degisik)'); continue; }
    if (hucre[6].trim() !== o.eskiDurum) { dokunulmayan.push(o.satirId + ' (durum hucresi aradagismis — tazeleme kirmizi)'); continue; }
    hucre[6] = ' ' + o.yeniDurum + ' ';
    satirlar[idx] = hucre.join('|');
    uygulanan++;
  }
  return { md: satirlar.join('\n'), uygulanan, dokunulmayan };
}

// ---- kalıcı kayıt: replan.jsonl (notify.ts deseni; fsync + son-satır onarımı) ----
export type ReplanKayit =
  | { event: 'olcum'; at: string; icerikHash: string; sapma: SapmaOlcumu; drift: DriftOlcumu }
  | { event: 'taslak'; at: string; taslak: ReplanTaslagi }
  | { event: 'onay'; at: string; taslakId: string; actor: string; uygulanan: number; dokunulmayan: string[] };

export function replanYolu(dbPath: string): string { return join(dirname(dbPath), 'replan.jsonl'); }

function jsonlYukle(path: string): ReplanKayit[] {
  if (!existsSync(path)) return [];
  const buf = readFileSync(path);
  const satirlar: { start: number; text: string }[] = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0a) { satirlar.push({ start, text: buf.subarray(start, i).toString('utf8') }); start = i + 1; }
  }
  if (start < buf.length) satirlar.push({ start, text: buf.subarray(start).toString('utf8') });
  const out: ReplanKayit[] = [];
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    if (s.text.trim() === '') continue;
    try { out.push(JSON.parse(s.text) as ReplanKayit); }
    catch {
      if (i === satirlar.length - 1) {
        const fd = openSync(path, 'r+');
        try { ftruncateSync(fd, s.start); fsyncSync(fd); } finally { closeSync(fd); }
      } else red('bozuk-kayit', `replan.jsonl ortasında bozuk satır (${i + 1}); yalnız son satır onarılabilir`);
    }
  }
  return out;
}

function jsonlEkle(path: string, kayit: ReplanKayit): void {
  const fd = openSync(path, 'a');
  try { writeSync(fd, JSON.stringify(kayit) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
}

export interface ReplanDefteri {
  path: string;
  olcumKaydet(sapma: SapmaOlcumu, drift: DriftOlcumu, now?: () => Date): { kaydedildi: boolean; icerikHash: string };
  taslakKaydet(taslak: ReplanTaslagi): void;
  onayKaydet(taslakId: string, actor: string, uygulanan: number, dokunulmayan: string[], now?: () => Date): void;
  taslaklar(): ReplanTaslagi[];
  onaylar(): { taslakId: string; actor: string }[];
}

export function openReplanDefteri(dbPath: string): ReplanDefteri {
  const path = replanYolu(dbPath);
  mkdirSync(dirname(path), { recursive: true });
  const kayitlar = jsonlYukle(path);
  return {
    path,
    olcumKaydet(sapma, drift, now = () => new Date()) {
      const icerikHash = createHash('sha256').update(JSON.stringify([sapma.yesil, sapma.toplam, drift.taranan, drift.tutarli, drift.bayat])).digest('hex');
      const ayni = kayitlar.some((k) => k.event === 'olcum' && k.icerikHash === icerikHash);
      if (!ayni) { // sürekli ölçüm spam'ı önlenir: sayılar değişmedikçe yeni kayıt düşmez
        const k: ReplanKayit = { event: 'olcum', at: now().toISOString(), icerikHash, sapma, drift };
        jsonlEkle(path, k); kayitlar.push(k);
      }
      return { kaydedildi: !ayni, icerikHash };
    },
    taslakKaydet(taslak) { const k: ReplanKayit = { event: 'taslak', at: taslak.at, taslak }; jsonlEkle(path, k); kayitlar.push(k); },
    onayKaydet(taslakId, actor, uygulanan, dokunulmayan, now = () => new Date()) {
      const k: ReplanKayit = { event: 'onay', at: now().toISOString(), taslakId, actor, uygulanan, dokunulmayan };
      jsonlEkle(path, k); kayitlar.push(k);
    },
    taslaklar: () => kayitlar.filter((k): k is Extract<ReplanKayit, { event: 'taslak' }> => k.event === 'taslak').map((k) => k.taslak),
    onaylar: () => kayitlar.filter((k): k is Extract<ReplanKayit, { event: 'onay' }> => k.event === 'onay').map((k) => ({ taslakId: k.taslakId, actor: k.actor })),
  };
}

// ---- [insan] kapısı + §18 uygulama (tek yol: insan CLI yüzü) ----
export function planYaz(ev: string, icerik: string): void { // tmp+fsync+rename (A2-10 kalıbı)
  const tmp = ev + '.tmp-' + Date.now();
  const fd = openSync(tmp, 'w');
  try { writeSync(fd, icerik, 'utf8'); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(tmp, ev);
}

export function replanOnayla(o: {
  defter: ReplanDefteri; taslakId: string; confirm: string; actor: string; planEv: string;
  now?: () => Date;
}): { status: 'ONAYLANDI'; uygulanan: number; dokunulmayan: string[] } {
  if (o.confirm !== REPLAN_ONAY_METNI)
    red('onay-metni', `onay reddedildi: --confirm "${REPLAN_ONAY_METNI}" gerekli (kapı tasarımı — otomatik plan DEĞİŞİMİ onaysız olmaz)`);
  if (o.actor !== 'insan:cli')
    red('aktor-red', `onay reddedildi: aktör '${o.actor}' — onay yalnız insan CLI yüzünden (EK-2: ajan/proxy onaylayamaz)`);
  const taslak = o.defter.taslaklar().find((t) => t.id === o.taslakId);
  if (!taslak) red('taslak-yok', `taslak yok: ${o.taslakId} (önce ölçüm → taslak doğmalı)`);
  if (o.defter.onaylar().some((a) => a.taslakId === o.taslakId))
    red('onaylandi-zaten', `taslak ${o.taslakId} zaten onaylı (idempotent)`);
  if (taslak.oneriler.length === 0)
    red('oneri-yok', `taslak ${o.taslakId} öneri taşımıyor — tazelenecek hücre yok (sapma aşımları §18 hücresi yazmaz)`);
  if (!existsSync(o.planEv)) red('plan-yok', `PLAN.md yok: ${o.planEv}`);
  const taze = plan18Tazele(readFileSync(o.planEv, 'utf8'), taslak.oneriler);
  if (taze.uygulanan === 0)
    red('uygulanamadi', `hiçbir hücre tazelenemedi: ${taze.dokunulmayan.join('; ')}`);
  planYaz(o.planEv, taze.md);
  o.defter.onayKaydet(o.taslakId, o.actor, taze.uygulanan, taze.dokunulmayan, o.now);
  return { status: 'ONAYLANDI', uygulanan: taze.uygulanan, dokunulmayan: taze.dokunulmayan };
}
