// OTODEV-1 PARÇA 3 — DEVRİR TAVANLARI (kaynak: plans/OTODEV-OTOMATIK-DEVIR-PLANI-2026-11-01.md; sentez koşul 3): eşzamanlı ajan ≤3+1 · CPU eşiği >%85 · 429 geri çekilme · istek/dk tavanı ~20; fail-closed — tavanlar BRIEF'TE DEĞİL KODDA zorlanır, ölçüm sayısı gelmezse RED (varsayılan uydurma YOK).
import { existsSync, readFileSync } from 'node:fs';

// --- eşikler (env — çağrı anında çözülür; geçersiz env ATILIR, sessiz varsayılan YOK) ----

function sayiCoz(envAd, varsayilan) {
  const e = process.env[envAd];
  if (e === undefined || e === '') return varsayilan;
  const n = Number(e);
  if (!Number.isFinite(n)) throw new Error('RED: ' + envAd + ' sayı olmak zorunda: ' + String(e));
  return n;
}

// 3 iş ajanı + 1 eşzamanlı nöbet (plan koşul 3 — '≤3(+1)'); CPU eşiği %85 (sentez koşulu 3:
// '>%85 bekle' — spawn tavanı); istek/dk tavanı ~20 (sentez '~20 istek/dk' sürü hızı freni).
const tavanEszamanliCoz = () => sayiCoz('ORDU_DEVIR_TAVAN', 4);
const cpuEsikCoz = () => sayiCoz('ORDU_DEVIR_CPU', 85);
const istekDkTavanCoz = () => sayiCoz('ORDU_DEVIR_ISTEK', 20);
const GERI_CEKILME_429 = 2; // 10 dk'da >=2 429 → geri çekilme (plan: '429'da 10-15 dk geri çekilme')

// --- tavan kontrol (saf fonksiyon — dosya/ağ erişimi YOK) -----------------------------

// TAVAN KONTROL: {ok, redler}. RED kuralları:
//   eszamanliAjan > tavan (varsayılan 4) → 'tavan-eszamanli-RED'
//   cpuYuzde >= eşik (varsayılan 85)     → 'cpu-esik-RED'
//   hata429Son10dk >= 2                  → '429-geri-cekilme-RED'
//   istekDk > tavan (varsayılan 20)      → 'istek-dk-tavan-RED'
// Sayı YOK/tanımsız/tipi sayı değil → o alanın '-gecersiz-RED' satırı (fail-closed —
// ölçümsüz alan tahminle DOLDURULMAZ; kırmızı kalır). Ölçüm kaynağı değil, yalnız KURAL buradadır.
export function tavanKontrol({ eszamanliAjan, cpuYuzde, hata429Son10dk, istekDk } = {}) {
  const redler = [];
  const sayiMi = (v) => typeof v === 'number' && Number.isFinite(v);
  if (!sayiMi(eszamanliAjan)) redler.push('eszamanliAjan-gecersiz-RED');
  else if (eszamanliAjan > tavanEszamanliCoz()) redler.push('tavan-eszamanli-RED');
  if (!sayiMi(cpuYuzde)) redler.push('cpuYuzde-gecersiz-RED');
  else if (cpuYuzde >= cpuEsikCoz()) redler.push('cpu-esik-RED');
  if (!sayiMi(hata429Son10dk)) redler.push('hata429Son10dk-gecersiz-RED');
  else if (hata429Son10dk >= GERI_CEKILME_429) redler.push('429-geri-cekilme-RED');
  if (!sayiMi(istekDk)) redler.push('istekDk-gecersiz-RED');
  else if (istekDk > istekDkTavanCoz()) redler.push('istek-dk-tavan-RED');
  return { ok: redler.length === 0, redler };
}

// --- dosyadan okuma bacağı (integration — hermetik testte fixture ile) ----------------

// JSON durum dosyası {eszamanliAjan, cpuYuzde, hata429Son10dk, istekDk} → tavanKontrol. Dosya yok/bozuk
// → RED (fail-closed: 'ölçüm yok' varsayılanla kapatılmaz); alanı eksik dosya → o alanın
// gecersiz-RED'i tavanKontrol'e aynen taşınır. Okuma-dışı HİÇBİR yan etkisi yoktur (saf).
export function tavanDosyadanOku(yol) {
  if (!existsSync(yol)) return { ok: false, redler: ['durum-dosyasi-yok-RED'] };
  let d = null;
  try { d = JSON.parse(readFileSync(yol, 'utf8').replace(/^﻿/, '')); } catch { /* bozuk JSON → aşağıda RED */ }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, redler: ['durum-dosyasi-bozuk-RED'] };
  return tavanKontrol({ eszamanliAjan: d.eszamanliAjan, cpuYuzde: d.cpuYuzde, hata429Son10dk: d.hata429Son10dk, istekDk: d.istekDk });
}
