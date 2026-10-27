// A3 defter.ts — ortak jsonl yardımcıları (KUYRUK-PLAN §A3 ara kararı: BU DALGADA
// doğar, kural.ts tüketir; notify/lessons/replan'in özel kopyalarından göç sonraki
// mekanik dalgada — 'red' fabrikası ENJEKTE edilir ki mevcut testlerin hata-sınıfı/
// kod sözleşmesi kırılmasın: notify.test 'code()', lessons.test 'kodIle' asercyonları).
import {
  existsSync, readFileSync,
  openSync, writeSync, fsyncSync, ftruncateSync, closeSync,
} from 'node:fs';

export type Red = (code: string, msg: string) => never;

// append-only jsonl yükleyici: SON satır bozuksa onarılır (crash'te yarım yazma),
// ORTA satır bozuksa RED (sessiz onarım veri kaybı gizler — a2 ders notu: replan'ın
// kendi testlerinde bu kol delikti; A3 kural.jsonl için kapatır).
export function jsonlYukle<T>(path: string, red: Red, etiket: string): T[] {
  if (!existsSync(path)) return [];
  const buf = readFileSync(path);
  const satirlar: { start: number; text: string }[] = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0a) { satirlar.push({ start, text: buf.subarray(start, i).toString('utf8') }); start = i + 1; }
  }
  if (start < buf.length) satirlar.push({ start, text: buf.subarray(start).toString('utf8') });
  const out: T[] = [];
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    if (s.text.trim() === '') continue;
    try { out.push(JSON.parse(s.text) as T); }
    catch {
      if (i === satirlar.length - 1) {
        const fd = openSync(path, 'r+');
        try { ftruncateSync(fd, s.start); fsyncSync(fd); } finally { closeSync(fd); }
      } else red('bozuk-kayit', `${etiket} ortasinda bozuk satir (${i + 1}); yalniz son satir onarilabilir`);
    }
  }
  return out;
}

// fsync'li append: crash anında yarım satır ancak SON satır olabilir (tail-repair kapsaması).
export function jsonlEkle<T>(path: string, kayit: T): void {
  const fd = openSync(path, 'a');
  try { writeSync(fd, JSON.stringify(kayit) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
}
