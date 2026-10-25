// D3 / M18 — AKIL YÜRÜTME MAKBUZU (reasoning receipt). "Makbuzsuz rapor → kabul yok."
// ÇEKİRDEĞİ KORUR: kapalı komut/olay SETİNE yeni kind EKLEMEZ, şemaya kolon EKLEMEZ
// (evidence tablosunda serbest JSON yok — bu yüzden makbuz bir DIŞ JSON sözleşmesidir
// ve TESLİM-İSTEME yazma yolunda ZORUNLU doğrulanır; sync-baseline bozulmaz).
// İlke: makbuz KENDİ KENDİNE İDDİA değil, DONMUŞ adaya ve GERÇEK PASS kanıtlara bağlı
// olmalı; en az bir reddedilmiş alternatif (muhakeme, assertion değil) taşımalı.
import { Type, type Static } from '@sinclair/typebox';
import { Ajv } from 'ajv';

const id = Type.String({ minLength: 1, maxLength: 128 });
const hex64 = Type.String({ pattern: '^[a-f0-9]{64}$' });
const txt = (max = 2000) => Type.String({ minLength: 1, maxLength: max });

export const ReasoningReceiptSchema = Type.Object(
  {
    nodeId: id,
    candidateHash: hex64,               // hangi DONMUŞ adayı açıklıyor
    decision: txt(512),                 // seçilen yaklaşım
    rationale: txt(),                   // neden bu
    // muhakeme = en az bir reddedilmiş alternatif; boş Liste RED (assertion değil).
    alternatives: Type.Array(
      Type.Object({ option: txt(512), whyRejected: txt() }, { additionalProperties: false }),
      { minItems: 1 },
    ),
    // kanıt bağları: gerçek evidence satırlarının id'si; en az biri zorunlu (kanıtsız iddia RED).
    evidenceRefs: Type.Array(id, { minItems: 1 }),
    confidence: Type.Union([Type.Literal('LOW'), Type.Literal('MEDIUM'), Type.Literal('HIGH')]),
    // dürüstlük: doğrulanamayanlar boş olabilir ama YALANLAMAK için değil; burada serbest.
    unresolved: Type.Array(txt(512), { default: [] }),
  },
  { additionalProperties: false },
);

export type ReasoningReceipt = Static<typeof ReasoningReceiptSchema>;

const ajv = new Ajv({ allErrors: true, strict: false });
const v = ajv.compile(ReasoningReceiptSchema);

export function validateReasoningReceipt(p: unknown): { ok: boolean; errors: string[] } {
  const ok = v(p);
  return { ok: !!ok, errors: (v.errors ?? []).map((e) => `${e.instancePath || '/'}: ${e.message}`) };
}

// Şema zorunluluğu (fail-closed). DB bağlamı denetimi supervisor.requireDeliverableReceipt'te.
export function requireReasoningReceipt(p: unknown): ReasoningReceipt {
  const r = validateReasoningReceipt(p);
  if (!r.ok) throw new Error('reasoning receipt geçersiz (M18): ' + r.errors.join('; '));
  return p as ReasoningReceipt;
}

// test/seed kolaylığı: şema-cazip makbuz (aday/kanıt bağları gerçek DB denetiminde doğrulanır).
export function sampleReceipt(candidateHash: string, nodeId = 'n1', over: Partial<ReasoningReceipt> = {}): ReasoningReceipt {
  return {
    nodeId,
    candidateHash,
    decision: 'Y',
    rationale: 'en dusuk riskli ve kanitli secim',
    alternatives: [{ option: 'X', whyRejected: 'kanit eksik' }],
    evidenceRefs: ['ev-1'],
    confidence: 'HIGH',
    unresolved: [],
    ...over,
  };
}
