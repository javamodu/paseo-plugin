// ordu-metrik.test.mjs — M1 hermetik testleri: KURMAY hareket defteri (append-only JSONL)
// kayit + ozet katmani. Temp dizin; GERCEK deftere / 4377'ye ASLA dokunulmaz.
import test from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hareketKaydet, metrikOzet } from "./ordu-metrik.mjs";

test("75- hareketKaydet: 2 kayit -> 2 append-only satir, zamanISO BURADA eklenir, hedef trim'lenir", () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-metrik-1-"));
  try {
    const yol = join(d, "alt", "hareket-defteri.jsonl"); // ust dizin YOK — mkdir ile dogmali
    const k1 = hareketKaydet(yol, { tur: "mudahale", hedef: "  ajan-1  ", sonuc: "ok", sureMs: 12.4 });
    assert.equal(k1.hedef, "ajan-1", "hedef trim yazilir");
    assert.ok(k1.zamanISO && !Number.isNaN(Date.parse(k1.zamanISO)), "zamanISO gecerli ISO");
    assert.equal(k1.sureMs, 12, "sureMs yuvarlanir");
    hareketKaydet(yol, { tur: "spawn-talebi", hedef: "proje-9", sonuc: "hata", detay: "denendi" });
    const satirlar = readFileSync(yol, "utf8").trim().split("\n");
    assert.equal(satirlar.length, 2, "append-only: eski satir bozulmaz, 2 satir");
    assert.equal(JSON.parse(satirlar[0]).hedef, "ajan-1", "ilk kayit yerinde durur");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("76- metrikOzet: defter YOK -> durust SIFIR ozet (hata DEGIL — hareket olmadı)", () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-metrik-2-"));
  try {
    const o = metrikOzet(join(d, "yok.jsonl"));
    assert.equal(o.toplam, 0); assert.equal(o.bozukSatir, 0); assert.equal(o.sonHareketISO, null);
    assert.deepEqual(o.turler, {});
    assert.equal(o.son24s.toplam, 0); assert.equal(o.son24s.ok, 0); assert.equal(o.son24s.hata, 0);
    assert.equal(o.son24s.ortSureMs, null);
    assert.ok(o.olcumAniISO, "pencere referansi (olcumAniISO) doner");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("77- metrikOzet: kirilim — 2 ok (sureMs'li) + 1 hata baska tur; son24s tam, ortSureMs ortalamasi", () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-metrik-3-"));
  try {
    const yol = join(d, "h.jsonl");
    hareketKaydet(yol, { tur: "mudahale", hedef: "a1", sonuc: "ok", sureMs: 100 });
    hareketKaydet(yol, { tur: "mudahale", hedef: "a2", sonuc: "ok", sureMs: 200 });
    const son = hareketKaydet(yol, { tur: "spawn-talebi", hedef: "p1", sonuc: "hata", detay: "x" });
    const o = metrikOzet(yol);
    assert.equal(o.toplam, 3);
    assert.equal(o.turler.mudahale.toplam, 2); assert.equal(o.turler.mudahale.ok, 2); assert.equal(o.turler.mudahale.hata, 0);
    assert.equal(o.turler["spawn-talebi"].toplam, 1); assert.equal(o.turler["spawn-talebi"].hata, 1);
    assert.equal(o.turler.mudahale.sonZamanISO, o.turler.mudahale.sonZamanISO); // dolu string
    assert.ok(o.turler["spawn-talebi"].sonZamanISO && o.turler.mudahale.sonZamanISO, "tur basina son zaman dolu");
    assert.equal(o.sonHareketISO, son.zamanISO, "genel son hareket = son yazilan");
    assert.equal(o.son24s.toplam, 3); assert.equal(o.son24s.ok, 2); assert.equal(o.son24s.hata, 1);
    assert.equal(o.son24s.ortSureMs, 150, "ortSureMs = (100+200)/2 — sureMs'siz kayit ortalamaya girmez");
    assert.equal(o.bozukSatir, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("78- metrikOzet: bozuk satir atlanir + SAYILIR; 24s penceresi DISI eski kayit toplamda sayilir", () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-metrik-4-"));
  try {
    const yol = join(d, "h.jsonl");
    const eski = new Date(Date.now() - 86_400_000 * 3).toISOString();
    writeFileSync(yol, "cop satir\n" + JSON.stringify({ tur: "mudahale", hedef: "eski", sonuc: "ok", zamanISO: eski }) + "\n" + JSON.stringify({ tur: "mudahale" }) + "\n", "utf8");
    const k = hareketKaydet(yol, { tur: "mudahale", hedef: "yeni", sonuc: "hata" });
    const o = metrikOzet(yol);
    assert.equal(o.bozukSatir, 2, "cop satir + zamanISO'suz kayit -> 2 bozuk");
    assert.equal(o.toplam, 2, "gecerli 2 kayit (eski + yeni)");
    assert.equal(o.son24s.toplam, 1, "eski kayit 24s penceresinin DISINDA");
    assert.equal(o.son24s.hata, 1);
    assert.equal(o.sonHareketISO, k.zamanISO, "eski kayit son hareket DEGIL");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("79- hareketKaydet: gecersiz hareket RED — defter YAZILMAZ (fail-closed)", () => {
  const d = mkdtempSync(join(tmpdir(), "paseo-metrik-5-"));
  try {
    const yol = join(d, "h.jsonl");
    for (const kotu of [{ tur: "bilinmeyen", hedef: "x", sonuc: "ok" }, { tur: "mudahale", hedef: "  ", sonuc: "ok" }, { tur: "mudahale", hedef: "x", sonuc: "belirsiz" }, { tur: "mudahale", hedef: "x", sonuc: "ok", sureMs: "hizli" }, null]) {
      assert.throws(() => hareketKaydet(yol, kotu), /hareket/, "gecersiz hareket firlatir: " + JSON.stringify(kotu));
    }
    assert.ok(!existsSync(yol), "RED'lenen hareket defter SATIRI birakmaz");
  } finally { rmSync(d, { recursive: true, force: true }); }
});
