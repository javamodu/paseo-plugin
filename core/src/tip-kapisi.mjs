#!/usr/bin/env node
// v8 hız paketi madde 3b (düzeltmeli): UCUZ STATİK TİP KAPISI — B8 sınıfı ("arayüze metod
// eklendi, eski fake/launcher taşımıyor") tam süit yakılmadan SAKİYELER içinde kırmızı
// düşer (ölçüm: tsc --noEmit 51 hatayla B8 deseninin ~10 açık örneğini ilk koşumda buldu).
// RATCHET: hata sayısı BILINEN_BORC taban çizgisini AŞARSA kapı kırmızı (+N yeni tip
// hatası); eşit/altıysa yeşil + dürüst borç raporu (azaldıysa taban çizgisi düşürülmeli
// — ayrı commit'te, sessiz değil). Borç sıfırlanınca ratchet 0'a kilitlenir.
// Fail-closed: tsc kendisi çöker/askıda kalırsa ve hata sayısı 0 görünüyorsa kapı
// İNFAZ EDİLEMEDİ sayılır → exit 1 (sessiz yeşil yok).
// Bugünkü ölçüm (R): 51 hata = 6 src + 45 test — latent tip-borcu; süit 461/461 yeşil,
// hiçbiri canlı patlama değil. Borç-düşürme AYRI dalgadır (v8 kaydı bekleyen madde).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BILINEN_BORC = 25; // v9-06/e: 36->25 (dalga B: f3-live/f5-parallel/k13 sahte launcher)
const TSC = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
const TAVAN_MS = 120_000;

const t0 = Date.now();
const r = spawnSync(process.execPath, [TSC, '--noEmit'], { encoding: 'utf8', timeout: TAVAN_MS });
const cikti = (r.stdout ?? '') + (r.stderr ?? '');
const hata = (cikti.match(/error TS/g) ?? []).length;
const yeni = hata - BILINEN_BORC;
const rapor = {
  kapisi: 'tip', hata, bilinenBorc: BILINEN_BORC, yeni,
  sureMs: Date.now() - t0,
  tsc: r.status,
};

if (r.status === null || (r.status !== 0 && hata === 0)) {
  // tsc çalışmadı/askıda — ölçüm yok, yeşil yok (fail-closed)
  console.error(JSON.stringify({ ...rapor, sonuc: 'KAPI-INFAZ-EDILEMEDI', cikti: cikti.slice(0, 400) }));
  process.exit(1);
}

console.log(JSON.stringify({
  ...rapor,
  sonuc: yeni > 0 ? 'YENI-TIP-HATASI' : 'GECTI',
  not: yeni > 0
    ? `+${yeni} yeni tip hatasi — B8 sinifi (arayuz sozlesmesi degisti, tasiyici guncellenmedi); tam suiti yakmadan duzelt`
    : (hata < BILINEN_BORC
      ? `borc ${BILINEN_BORC}->${hata} dustu — BILINEN_BORC sabitini ayri commit'te dusur (ratchet)`
      : `bilinen borc ${BILINEN_BORC} (ayni) — borc-sifirlama ayri dalga`),
}));

if (yeni > 0) process.exit(1);
