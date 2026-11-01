// BAKIM GP-1 (2026-11-01) — pano/iskelet.html GD-003 esc disiplini testleri (node --test).
// Desen: kapsul-tuval.test.mjs kaynak-pin deseni (kaynak okunamazsa vakalar ADIYLA kırmızıya
// düşer — fail-closed). İKİ katman pin: (1) kaynak — esc() imzası kapsul-tuval.html:1012 ile
// BİREBİR + innerHTML'e giren TÜM dinamik değerler esc'li + HAM interpolasyon kalıntısı YOK;
// (2) davranış — esc() kaynaktan çıkarılıp node:vm'de ÇALIŞTIRILIR; değerlerin HTML entity'ye
// dönüştüğü KANITLANIR (kaynaktan pin — haricyeni eşlenik değil).
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

let SRC = "";
try {
  SRC = readFileSync(new URL("./iskelet.html", import.meta.url), "utf8");
} catch {
  SRC = ""; // kaynak okunamazsa tüm vakalar kendi adlarıyla kırmızıya düşer
}
const ok = (msg, cond, detay) => assert.ok(cond, "KAYNAKTA YOK — " + msg + (detay ? " (" + detay + ")" : ""));

// kapsul-tuval.html:1012'deki esc() imzası — BİREBİR (kopya değil eşlenik; tek satır).
const ESC_SATIRI = 'function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }';

test("GD-003-1: esc() tanımı kapsul-tuval.html:1012 imzasıyla BİREBİR aynı satır", () => {
  ok("esc() tanımı (imza + replace zinciri aynen)", SRC.includes(ESC_SATIRI));
  ok("esc çağrısı en az 6 yerde (tüm dinamik yüzler)", (SRC.match(/esc\(/g) || []).length >= 6);
});

test("GD-003-2: esc DAVRANIŞI — kaynaktan çıkarılıp çalışır; değerler HTML entity'ye dönüşür", () => {
  const m = SRC.match(/function esc\(s\) \{[^\r\n]*\}/);
  ok("esc fonksiyonu kaynakta tek satır bulundu", !!m);
  const esc = vm.runInNewContext("(" + m[0] + ")");
  // XSS vektörü payloads (GD-003 bulgu senaryosu: kardeş repo verisi 4377 origin'inde)
  assert.equal(esc("<img src=x onerror=alert(1)>"), "&lt;img src=x onerror=alert(1)&gt;");
  assert.equal(esc('"><svg onload=alert(1)>'), "&quot;&gt;&lt;svg onload=alert(1)&gt;");
  assert.equal(esc('" onmouseover="x'), "&quot; onmouseover=&quot;x");
  assert.equal(esc("a & <b>"), "a &amp; &lt;b&gt;");
  // String zorlaması — sayı/null da güvenli geçer (kutu sayıları, boş alanlar)
  assert.equal(esc(123), "123");
  assert.equal(esc(null), "null");
  assert.equal(esc(undefined), "undefined");
  // çıktıda CANLI etiket/attribute kapanı kalması imkânsız
  const cikti = esc("<script>alert(1)</script> \" x");
  assert.ok(!cikti.includes("<") && !cikti.includes(">") && !cikti.includes('"'), "çıktıda canlı tag/tırnak kaldı");
});

test("GD-003-3: innerHTML'e giren TÜM dinamik değerler esc'lenir (repo adı · kart başlığı · kutular · modlar · son damga · üretim · hata)", () => {
  ok("repo seçenekleri esc(r) — kardeş repo DİZİN adı (XSS vektörü)", SRC.includes('">" + esc(r) + "</option>"'));
  ok("kutu değerleri esc içinden (b + s ikisi de)", SRC.includes('"<div class=\'kutu\'><b>" + esc(b) + "</b><span>" + esc(s) + "</span></div>"'));
  ok("kart başlığı esc(v.ad)", SRC.includes('"<div class=\'kart\'><h3>" + esc(v.ad) + "</h3>'));
  ok("mod adları esc(m) — kardeş repo TELEMETRİ mod adı (XSS vektörü)", SRC.includes('esc(m) + " ×"'));
  ok("son damga esc(v.sonDamga) — kardeş repo STATE_BOARD satırı (XSS vektörü)", SRC.includes('Son damga: " + esc(v.sonDamga)'));
  ok("üretim damgası + TTL esc ile", SRC.includes('esc(v.uretim) + " · TTL " + esc(v.ttlSn)'));
  ok("rota hata yüzü esc(e.message)", SRC.includes('Hata: " + esc(e.message)'));
});

test("GD-003-4: HAM (esc'siz) interpolasyon kalıntısı YOK — eski açık desen söküldü", () => {
  ok("ham option interpolasyonu kalktı", !SRC.includes('">" + r + "</option>"'));
  ok("ham kutu interpolasyonu kalktı", !SRC.includes('"<b>" + b + "</b><span>" + s + "</span>"'));
  ok("ham kart başlığı kalktı", !SRC.includes('"<h3>" + v.ad + "</h3>"'));
  ok("ham mod adı kalktı", !SRC.includes('m + " ×"'));
  ok("ham son damga kalktı", !SRC.includes('v.sonDamga + "</p>"'));
  ok("ham hata mesajı kalktı", !SRC.includes('e.message + "</p>"'));
  ok("innerHTML atamalarının hiçbirinde ham + v. interpolasyonu kalmadı", !/\+ v\.[a-zA-Z]+ \+/.test(SRC));
});
