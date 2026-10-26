// K12-12 (R8, plan §24): GÖRÜNMEYEN ALT-AJAN DİSPATCH REDDİ — 5 şart.
// dispatchNode bu kapıdan geçer: her şart AYRI denetlenir, eksik olan ADIYLA kırmızı
// (fail-closed; hata mesajı hangi şatın düştüğünü söyler). Şartlar (plan §24):
//   (1) kimlik+ana görev   — node BU run'ın planında tanımlı (attempt kimlik zinciri çözümlenebilir)
//   (2) yetki bağı          — dispatch yetkisi bu runa bağlı KABUL edilmiş komut
//   (3) kullanım ölçümü     — tokens>0 ve run bütçesi ölçülebilir (usage_unknown=0)
//   (4) yaşam durumu uzlaştırma — node çözümlenmemiş UNKNOWN rezervasyon taşımaz
//   (5) iptal+sahiplik      — runda doğrulanmamış iptal talebi varken yeni sahip doğmaz
// Kapı mevcut çekirdek mekanizmalarının bileşimidir — YENİ defter gücü/kind YOK (R6).
import type { DatabaseSync } from 'node:sqlite';
import { GateError } from './store.ts';

export function assertAltAjanGorunur(db: DatabaseSync, i: { runId: string; nodeId: string; commandId: string; tokens: number }) {
  // (1) kimlik+ana görev: görünmeyin alt ajan = kimliği ana göreve bağlanamayan ajan
  const node = db.prepare('SELECT id FROM nodes WHERE run_id=? AND id=?').get(i.runId, i.nodeId);
  if (!node) {
    throw new GateError(`R8 sart 1 (kimlik+ana gorev): node '${i.nodeId}' run '${i.runId}' planinda tanimli degil — gorunmeyen alt ajan dispatch RED`);
  }
  // (2) yetki bağı: dispatch ancak runun KABUL edilmiş komutundan yetki alır
  const cmd = db.prepare("SELECT 1 FROM commands WHERE id=? AND run_id=? AND status='ACCEPTED' LIMIT 1").get(i.commandId, i.runId);
  if (!cmd) {
    throw new GateError(`R8 sart 2 (yetki bagi): komut '${i.commandId}' bu runa bagli KABUL komutu degil — dispatch yetki bagi YOK`);
  }
  // (3) kullanım ölçümü: ölçümsüz kullanım kabul edilmez (unknown_budget tetiği 001'de zaten RED)
  if (!(i.tokens > 0)) {
    throw new GateError('R8 sart 3 (kullanim olcumu): tokens>0 zorunlu — olcumusuz kullanim dispatch RED');
  }
  const run = db.prepare('SELECT usage_unknown FROM runs WHERE id=?').get(i.runId) as any;
  if (run?.usage_unknown) {
    // SLOT/ölçülemeyen-nested kapanışının ÖNCEKİ adı (001 tetiği 'unknown_budget' hâlâ derin yedek)
    throw new GateError('R8 sart 3 (kullanim olcumu): run butcesi olculemiyor (usage_unknown=1; unknown_budget) — dispatch RED');
  }
  // (4) yaşam durumu uzlaştırma: çözümlenmemiş UNKNOWN önce reconcile edilir (A08; kör çift iş YOK)
  const unk = db.prepare(
    "SELECT 1 FROM reservations r JOIN attempts a ON a.id=r.attempt_id WHERE a.run_id=? AND a.node_id=? AND r.state='UNKNOWN' LIMIT 1",
  ).get(i.runId, i.nodeId);
  if (unk) {
    throw new GateError(`R8 sart 4 (yasam durumu uzlastirma): node '${i.nodeId}' cozumlenmemis UNKNOWN rezervasyon tasiyor — once reconcile, sonra dispatch`);
  }
  // (5) iptal+sahiplik: iptal talebi doğrulanmadan yeni sahiplik doğmaz (revokeGrant deseni)
  const cancelIstendi = !!db.prepare("SELECT 1 FROM events WHERE run_id=? AND type='CANCEL_REQUESTED' LIMIT 1").get(i.runId);
  const cancelTeyitli = !!db.prepare("SELECT 1 FROM events WHERE run_id=? AND type='CANCEL_CONFIRMED' LIMIT 1").get(i.runId);
  if (cancelIstendi && !cancelTeyitli) {
    throw new GateError(`R8 sart 5 (iptal+sahiplik): run '${i.runId}' icin iptal talebi dogrulanmamis (CANCEL_REQUESTED var, CANCEL_CONFIRMED yok) — yeni sahiplik RED`);
  }
}
