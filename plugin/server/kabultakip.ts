import type { AgentTimelineItem } from "@getpaseo/protocol/agent-types";
import { kabulKaydet, karisiklikKaydet } from "./telemetry";
import { KARISIKLIK_DESENI, RET_DESENI } from "./desenler";
import { temizlikKaydet } from "./temizlik";

export function kullaniciMesajlari(timeline: readonly AgentTimelineItem[]): string[] {
  return timeline.filter((i) => i.type === "user_message").map((i) => (i as { text: string }).text);
}

interface KabulTakipDurumu {
  oncekiEditliCompleted: boolean;
  oncekiCompleted: boolean;
  // A2-9 (v0.23): durtmeli turda timeline'da yeni user mesaji yokken son mesaj ESKI prompttur —
  // eski prompt RET/KARISIKLIK desenine tekrar girip cift kabul sayimi uretiyordu. Prompt kimligi
  // (metin birebiri) degismedikce yeni karar sayilmaz. Bilinen sinir: kullanicinin BIREBIR ayni
  // metni ard arda iki kez gondermesi ikinci kez sayilmaz — desen-temelli (T) metrik icin sinyal
  // degeri de ayni oldugundan kabul edilir.
  sonPrompt: string | null;
}

const takip = new Map<string, KabulTakipDurumu>();

// A2-9: islenen turnId kayitlari (telemetry BK-02 deseninin kabul bacagi —
// ayni turn_ended olayi iki kez teslim edilirse ikinci kayit yazilmaz).
const islenenTurnIdler = new Set<string>();

export function kabulTakipIsle(input: {
  agentId: string;
  cwd: string;
  provider: string;
  turnId: string | null;
  timeline: readonly AgentTimelineItem[];
  completed: boolean;
  editli: boolean;
}): void {
  if (input.turnId !== null) {
    const anahtar = input.agentId + ":" + input.turnId;
    if (islenenTurnIdler.has(anahtar)) return;
    islenenTurnIdler.add(anahtar);
  }
  const state = takip.get(input.agentId) ?? { oncekiEditliCompleted: false, oncekiCompleted: false, sonPrompt: null };
  const mesajlar = kullaniciMesajlari(input.timeline);
  const buTurunPromptu = mesajlar.length > 0 ? mesajlar[mesajlar.length - 1] : "";
  const yeniPromptMu = buTurunPromptu !== "" && buTurunPromptu !== state.sonPrompt;
  if (yeniPromptMu) {
    if (state.oncekiEditliCompleted && mesajlar.length >= 2) {
      const ret = RET_DESENI.test(buTurunPromptu);
      kabulKaydet(input.cwd, input.agentId, input.provider, !ret, "onceki-tur-prompt-deseni(T)");
    }
    if (state.oncekiCompleted && mesajlar.length >= 2 && KARISIKLIK_DESENI.test(buTurunPromptu)) {
      karisiklikKaydet(input.cwd, input.agentId, input.provider, "onceki-tur-prompt-deseni(T)");
    }
    state.sonPrompt = buTurunPromptu;
  }
  state.oncekiCompleted = input.completed;
  state.oncekiEditliCompleted = input.completed && input.editli;
  takip.set(input.agentId, state);
}

// agent.closed: bellek sizintisi onlenir (ajan idsi yeniden dogarsa temiz durumla baslar;
// v0.23: temizlik kayit defteri — index.server'in ajanTemizleHepsi cagrisindan yurur).
temizlikKaydet((agentId) => {
  takip.delete(agentId);
  const onEk = agentId + ":";
  for (const anahtar of islenenTurnIdler) {
    if (anahtar.startsWith(onEk)) islenenTurnIdler.delete(anahtar);
  }
});
