# 07 - GitHub Çok-Ajan Orkestrasyon Repoları + Pitbull Desenleri

Kaynak (11 Eki 2026): GitHub API (star/fork/son push) + repo README'leri. Referans noktaları: sst/opencode 212.7k, modelcontextprotocol/servers 91.1k, cline/cline 70.2k, Aider-AI/aider 49.5k.

## 1. Framework tablosu (star sırasıyla)

| Repo | Star | Durum | Çekirdek desen | Çalınacak şey |
|---|---|---|---|---|
| microsoft/autogen | 61.4k | ⚠️ MAINTENANCE MODE (Nisan 2026'dan beri push yok; halef: Microsoft Agent Framework) | Magentic-One: Orchestrator ajan, specialist'lere devreder, ledger tutar | Ledger (defter) deseni: orkestratör ne yapıldığını yapısal kayda yazar |
| crewAIInc/crewAI | 59.6k | Aktif | Role/goal/backstory'li agent; Crew (otonom ekip) vs Flow (deterministik akış) ayrımı | "Otonomi mi determinizm mi" ayrımını görev başına seçmek |
| langchain-ai/langgraph | 43.1k | Aktif | Durum makinesi grafı; node=adım, edge=geçiş; checkpoint ile kesintiden devam | Checkpoint: uzun işte ara durum diske → crash sonrası devam |
| openai/openai-agents-python | 30.0k | Aktif | Hafif SDK: Agent + handoff (ajanlar arası devir) + guardrail (girdi/çıktı bekçisi) | Handoff'un açık nesne olması; guardrail'i ucuz modele vermek |
| huggingface/smolagents | 29.8k | Aktif | CodeAgent: ajan eylemleri kod olarak yazar, tool JSON yerine Python çağırır | Kod-olarak-eylem: daha az roundtrip |

## 2. Pitbull-persistence / watchdog desenleri (çerçevelerden damıtılmış)

| Desen | Ne yapar | Paseo karşılığı |
|---|---|---|
| Ledger/plan defteri | Orkestratör her adımda "gerçekler + yapılanlar + sıradaki" defterini günceller; takılınca defterden yeni plan kurar (magentic) | Sözleşme: her turda STATE dosyasını güncelle kuralı; plugin turn_ended'da denetler |
| Checkpoint/resume | Durum her node'da diske; crash'te son checkpoint'ten devam (langgraph) | Heartbeat + handoff briefing; workspace arşiv/restore |
| Guardrail katmanı | Girdi/çıktı doğrulaması ayrı (ucuz) modelde (openai-agents) | permission_requested hook'u + kural motoru |
| Crew/Flow ayrımı | Serbest ekip koordinasyonu mu, deterministik adım mı; göreve göre seç (crewai) | Hub workflow (deterministik) vs çok-ajan MCP serbestliği |
| Deadline | Kaçak ajanı öldür | Paseo'da hazır: `max_runtime`, `idle_timeout`, schedule `--max-runs` |

## 3. Dürüst not

Bu framework'ler Paseo'nun çözmeye çalıştığı sorunun FARKLI katmanında: onlar uygulama-içi ajan kütüphanesi, Paseo ise ajanları saran orkestratör. Kod çalınmaz, DESEN çalınır. AutoGen'in maintenance mode'a düşmesi ayrı ders: 61k star bile bakım garantisi değil — bağımlılık seçerken son push tarihine bak.

## ÖZET

1. En değerli çalıntı magentic'in ledger deseni: orkestratörün "gerçekler/yapılanlar/sıradaki" defteri tutması — Paseo'da sözleşme kuralı + plugin denetimiyle sıfır koda yakın uygulanır, pitbull-persistence'ın beyni budur.
2. Star sırası: autogen 61k (artık bakımsız), crewai 60k, langgraph 43k, openai-agents 30k, smolagents 30k; popülerlik ≠ sürdürülebilirlik, AutoGen bunun kanıtı.
3. Langgraph checkpoint'i Paseo'da heartbeat+handoff ile karşılanıyor; ek kütüphane gerekmiyor, gereken tek şey STATE dosyasını zorunlu kılan disiplin.
4. CrewAI'nin Crew/Flow ayrımı Paseo'da "MCP serbest orkestrasyon" vs "Hub workflow deterministik adımlar" olarak zaten mevcut — sözleşmeye "görev tipine göre yol seç" kuralı eklenmeli.
5. Kod-olarak-eylem (smolagents) ve guardrail'i ucuz modele verme (openai-agents) token tasarrufu sağlar; ikincisi Paseo'da permission hook'unu ucuz modelle çalıştırma fikrine dönüşür (plugin RPC üzerinden).
