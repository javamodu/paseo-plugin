# 08 - Hafıza Sistemleri Karşılaştırması (Paseo local-first gözüyle)

Kaynak (11 Eki 2026): GitHub API + repo README'leri (mem0, letta, basic-memory, claude-mem, mcp-memory-service) + modelcontextprotocol/servers.

## 1. Sistem tablosu (Paseo uyumuna göre sıralı)

| Sistem | Star | Model | Veri nerede? | Paseo'ya uyum |
|---|---|---|---|---|
| basicmachines-co/basic-memory | 4.1k | Düz markdown dosyaları + wikilink knowledge graph; MCP server; insan ve AI aynı dosyaya yazar | Diskte düz metin (local-first) | EN YÜKSEK: felsefe birebir aynı |
| Resmî MCP memory server (modelcontextprotocol/servers içinde) | (repo: 91.1k) | Basit bilgi grafiği: entity/relation/observation, JSON dosyası | Lokal JSON | Yüksek: tak-çalıştır MCP, Paseo provider config'inden geçer |
| thedotmack/claude-mem | 99.5k | Oturum gözlemlerini yakala → AI ile sıkıştır → sonraki oturuma enjekte et; progressive disclosure (token maliyeti görünür katmanlar) | Lokal + kendi worker'ı | Fikir çalınabilir (progressive disclosure); Claude Code hook'una bağlı |
| mem0ai/mem0 | 67.0k | Bellek katmanı; Nisan 2026 algoritması: LoCoMo 92.5 skor, tek-geçiş retrieval (agentic loop YOK), 7K token bütçesi, 0.88s p50 gecikme | Kendi store'u (vector) | MCP ile takılabilir; servis katmanı ekler |
| doobidoo/mcp-memory-service | 2.0k | REST + knowledge graph + otonom konsolidasyon; LangGraph/CrewAI/AutoGen hatları | Lokal | Orta: ek servis |
| letta-ai/letta (ex-MemGPT) | 25.1k | Stateful agent; hafıza bloklarını LLM kendisi düzenler (self-editing memory) | Kendi runtime'ı | Düşük: Paseo'nun yerine geçer, içine girmez; desen ilhamı |

## 2. Vektörlü vs vektörsüz (dosya-tabanlı)

- Vektörlü (mem0, mcp-memory-service): anlamsal geri çağırma güçlü, ama index/store bakımı + "neyin kaydedildiği opak" sorunu var.
- Vektörsüz (basic-memory, Cline Memory Bank, Claude Code MEMORY.md): dosya = tek doğru kaynak; git diff ile hafıza değişimi görünür; `rg` ile aranır; ajan "hangi dosyayı açacağını" haritadan seçer (Aider deseniyle birleşir).
- 2026 konsensüsü (Cursor'un Memories'i kaldırışı + Windsurf'ün "kalıcı bilgi için Rule yaz" tavsiyesi): KALICI bilgi dosyada, GEÇİCİ bilgi oturumda.

## 3. Çalınabilir mekanik tablosu (önem sırasıyla)

| # | Mekanik | Kaynak | Verimlilik etkisi (tahmin) | Kod etkisi | Artı | Eksi |
|---|---|---|---|---|---|---|
| 1 | Düz-markdown hafıza dizini (`memory/`) + her prompt'a ilk N KB enjeksiyon | basic-memory + Claude Code oto-hafıza | "Baştan anlatma" maliyeti sıfırlanır; H1'in kalbi | Düşük: plugin `agent.create` hook'u (02'de kanıtlı) | Git'te diff'lenir, opaklık yok | Dosya düzenleme disiplini ister |
| 2 | Progressive disclosure: özet prompt'ta, detay diskte | claude-mem | Hafıza token maliyeti %50-70 düşer (tahmin) | Düşük: enjeksiyon katmanına boyut limiti | 25KB tavanı gibi somut bütçe | Özet/detay senkron riski |
| 3 | Hafıza yazma tetikleyicileri açık kural ("update memory bank") | Cline | Hafıza güncel kalır | Yok: sözleşme kuralı | Tahmin edilebilir | Manuel tetik unutulabilir → turn_ended watchdog hatırlatır |
| 4 | Tek-geçiş retrieval (agentic loop'suz) | mem0 | Hafıza sorgusu sabit ucuz maliyette | Orta (MCP server kurarsa) | 0.88s / 7K token ölçülmüş | Vector store bağımlılığı |
| 5 | MCP memory server takmak | MCP servers | Sıfır kodla kalıcı grafik hafıza | Düşük: provider MCP config | Hazır araç | Paseo'da provider başına tekrar kurulum |
| 6 | Self-editing hafıza blokları | letta/MemGPT | Teorik olarak en güçlü | Yüksek | LLM kendi hafızasını düzenler | Paseo mimarisine ters; çalma |

## ÖZET

1. Paseo local-first olduğundan doğru temel: basic-memory deseni (düz markdown + git) — H1 hedefinin kalbi; plugin `agent.create` hook'uyla ilk N KB'si her ajana enjekte edilir (02-plugin-api.md ile kanıtlı kapı).
2. claude-mem'in progressive disclosure'i (özet prompt'ta, detay diskte, token maliyeti görünür) hafıza token bütçesinin somut modeli; 25KB tavan gibi kural yazılabilir.
3. Sektör konsensüsü netleşmiş: opak oto-hafıza (Cursor Memories, Windsurf Memories) terk ediliyor; kalıcı bilgi açık dosyada. Paseo planı bu yönde.
4. mem0'in tek-geçiş retrieval'i (agentic loop yok) hafıza sorgusunu ucuz ve öngörülebilir tutar; ileride MCP olarak takılabilir ama v1'de gerekmez.
5. Letta'nın self-editing hafızası güçlü ama Paseo'nun "ajanları dışarıdan orkestre et" modeline ters; sadece "ajan kendi STATE dosyasını günceller" kuralı olarak çalınmalı.
