// D-3 OZ YAZIM CEKIRDEGI (dar-dene dalgasi 2026-10-30; K8'in yazim bacagi — server.js'e POST baglanmasi ayri insan kapisi: K-0055 ADR).
// Ne yapar: ONAYLI atama taslagini KALICI append-only deftere (atamalar.jsonl) yazar + geri okur + gorev->ajan haritasini dondurur.
// DISIPLIN: yalniz ONAYLI kayit iner (TASLAK/RED fail-closed); append-only (eski satir bozulmaz);
// idempotans (ayni gorev+surum imzasi ikinci kez yazilmaz — cop kayit yok); fsync ile disk (notify.ts deseni).
// INSAN KAPISI: graf-yonetim.js'te (atamaTaslakla acan yalniz insan:web; onayla vekil/ajan RED) — bu modul onayli kaydi diske tasir, onay URETMEZ.
import { appendFileSync, closeSync, existsSync, fsyncSync, openSync, readFileSync } from 'node:fs';

const imza = (k) => k.gorevId + '#' + k.surum;

// Defter satirlarini oku — bozuk satir atlanir + sayilir (durust; sessiz yutma yok).
export function atamaOku(yol) {
  if (!existsSync(yol)) return { kayitlar: [], bozuk: 0 };
  const satirlar = readFileSync(yol, 'utf8').replace(/^﻿/, '').split('\n').filter((s) => s.trim());
  const kayitlar = [];
  let bozuk = 0;
  for (const s of satirlar) {
    try { kayitlar.push(JSON.parse(s)); } catch { bozuk++; }
  }
  return { kayitlar, bozuk };
}

// ONAYLI kaydi kalici deftere inder. Kayit: onay==='ONAYLI' + onaylayan('insan:web'|'ai-manager') + gecerli tarih zorunlu.
export function atamaYaz(kayit, yol) {
  if (!kayit || typeof kayit !== 'object') throw new Error('D3 RED: kayit nesnesi gerekli');
  if (kayit.onay !== 'ONAYLI') {
    throw new Error('D3 RED: yalniz ONAYLI kayit diske iner (TASLAK/RED yazilmaz): ' + String(kayit.onay));
  }
  if (kayit.onaylayan !== 'insan:web' && kayit.onaylayan !== 'ai-manager') {
    throw new Error('D3 RED: onaylayan yalniz insan:web ya da ai-manager (buyutemez): ' + String(kayit.onaylayan));
  }
  if (typeof kayit.gorevId !== 'string' || !kayit.gorevId.trim() ||
      typeof kayit.ajanId !== 'string' || !kayit.ajanId.trim() ||
      !Number.isInteger(kayit.surum) || kayit.surum < 1 ||
      typeof kayit.tarih !== 'string' || !Number.isFinite(Date.parse(kayit.tarih))) {
    throw new Error('D3 RED: kayit eksik/gecersiz alan (gorevId/ajanId/surum>=1/tarih zorunlu)');
  }
  const { kayitlar } = atamaOku(yol);
  if (kayitlar.some((k) => imza(k) === imza(kayit))) {
    return { yazildi: false, mevcut: true, imza: imza(kayit), toplam: kayitlar.length };
  }
  const fd = openSync(yol, 'a');
  try {
    appendFileSync(fd, JSON.stringify(kayit) + '\n');
    fsyncSync(fd);
  } finally { closeSync(fd); }
  return { yazildi: true, mevcut: false, imza: imza(kayit), toplam: kayitlar.length + 1 };
}

// Gorev -> son ONAYLI atama haritasi (buyuk surum kazanir — v15 graf tazelemesinin okuma yuzu).
export function atamaDurum(yol) {
  const { kayitlar, bozuk } = atamaOku(yol);
  const harita = new Map();
  for (const k of kayitlar) {
    const mevcut = harita.get(k.gorevId);
    if (!mevcut || (k.surum || 0) > (mevcut.surum || 0)) harita.set(k.gorevId, k);
  }
  return { harita: Object.fromEntries(harita), bozuk };
}
