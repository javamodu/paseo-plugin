# 02 - Paseo Plugin API Tam Haritası

Kaynaklar (11 Eki 2026): `plugins.md` (quickstart), `plugins/reference.md`, `plugins/publishing.md`, `plugins/migration.md` (hepsi indirildi).
Plugin = tek daemon'a kurulan TypeScript projesi. Girişler: `index.client.tsx` (uygulama, `PluginClientContext`) ve `index.server.ts` (daemon alt süreci, `PluginServerContext`); en az biri zorunlu. İkisi de default-export `contribute(ctx)` + cleanup fonksiyonu döndürür. Modüller `client/`, `server/`, `shared/` altında yaşar; sınır ihlali (client'tan `node:` importu vb.) derleme hatasıdır. SDK, React, React Native, TanStack Query ve Zod runtime'da host tarafından sağlanır.

## 1. Manifest: `paseo-plugin.json`

```json
{
  "id": "sozlesme",
  "name": "Ajan Sözleşmesi",
  "description": "Her ajana altın kuralları enjekte eder",
  "requirements": { "paseo": ">=0.8.0" },
  "build": [["npm", "run", "build"]]
}
```

| Alan | Zorunlu | Not |
| --- | --- | --- |
| `id` | Evet | Varsayılan kurulum ID'si; küçük harfle başlar, küçük harf/rakam/tire |
| `name`, `description`, `icon`, `media` | Hayır | Registry/ayarlar görünümü; Paseo 0.11.0+ ister |
| `requirements.paseo` | Hayır | Semver aralığı; yazılmazsa `<0.8.0` sayılır ve 0.8+ daemon reddeder |
| `build` | Hayır | Kurulum/güncellemede çalışan argv listeleri (Git kaynakları için) |

Bilinmeyen üst alanlar yok sayılır; `requirements` içinde bilinmeyen anahtar reddedilir. Yollar manifest'e göre yazılır, `/` ile, `..` içermeden.

## 2. Her yeni ajana metin enjeksiyonu (sözleşmenin kalbi)

Tek doğru kapı: `server.before("agent.create")` — config içindeki `systemPrompt` düzenlenebilir:

```ts
// index.server.ts
import type { PluginServerContext } from "@getpaseo/plugin/server";
import { readFileSync } from "node:fs";

const SOZLESME = readFileSync(new URL("./server/sozlesme.md", import.meta.url), "utf8");

export default function contribute(server: PluginServerContext) {
  server.before("agent.create", ({ request }) => ({
    ...request,
    config: {
      ...request.config,
      systemPrompt: [SOZLESME, request.config.systemPrompt].filter(Boolean).join("\n\n"),
    },
  }));
  return () => {};
}
```

- Callback imzası: `({ request }, { paseo, signal }) => yeniRequest | undefined` (async olabilir). `undefined` = dokunma.
- Düzenlenebilir config alanları: `provider`, `model`, `modeId`, `thinkingOptionId`, `featureValues`, `title`, `systemPrompt`, `providerOptions`, `mcpServers`, `toolPolicy`. `cwd` değiştirilemez; `env` ayrıca düzenlenebilir.
- Sıralama: agent.create hook'ları (plugin ID sırası, plugin içinde kayıt sırası) → varsayılanlar + provider doğrulaması → launch config türetilir (Paseo araçları + daemon promptu) → agent.session_open hook'ları (sadece env) → `PASEO_AGENT_ID`/`PASEO_AGENT_CWD` set edilir → oturum açılır ve agent config'i KAYDEDİLİR.
- Otomatik deep-merge YOK; spread ile birleştir. Hata fırlatmak / geçersiz veri dönmek oluşturmayı iptal eder. Hook timeout: 30 sn.
- `agent.session_open` create/resume/refresh/import'ta çalışır ama SADECE `env` düzenler; sözleşme metni için uygun değil.

## 3. Tur sonu otomatik dürtme (turn follow-up) — VAR

```ts
server.on("agent.turn_ended", async (event, { paseo }) => {
  if (event.outcome.kind === "canceled") return;
  // event.timeline: tam anlık görüntü (readonly AgentTimelineItem[]); metin birden çok item'a yayılabilir
  await paseo.agents.ref(event.agent.id).send("Sözleşme hatırlatması: ...");
});
```

- `outcome`: `completed` | `failed { error }` | `canceled { reason }`. Bu, ajana yeni mesaj gönderir ve yeni tur başlatır.
- Kalıcı eşleşme sonsuz döngü yapar: ajan başına sayaç/cooldown tut. Ekler (attachments) ve tool etkileri tekrar oynatılmaz.
- Resmî helper örneği: plugin-examples/lifecycle-actions → `server/inspect.ts` (`latestOutputText`, `shellCommand`).

## 4. Permission otomasyonu

```ts
server.on("agent.permission_requested", async (event, { paseo }) => {
  const agent = paseo.agents.ref(event.agent.id);
  if (/\brm\s+-rf\b/.test(shellCommand(event.request) ?? "")) {
    await agent.respondToPermission({
      requestId: event.request.id,
      response: { behavior: "deny", message: "Altın kural: recursive silme yasak." },
    });
  }
});
```

- `event.request` = SDK `AgentPermissionRequest`; `kind`: `tool | plan | question | mode | other`.
- Cevaplamazsan istek kullanıcıya düşer. İzin istemek turu bitirmez. Çözülmüş isteğe cevap SDK hatası verir. `response`: `{ behavior: "allow" }` veya `{ behavior: "deny", message? }`.

## 5. Slash command + composer pill + workspace panel (minimal)

```tsx
// index.client.tsx
export default function contribute(client: PluginClientContext) {
  client.addSlashCommand({
    name: "sozlesme", description: "Sözleşmeyi göster", argumentHint: "[bolum]",
    context: "agent",
    async onSubmit({ args, agent, rpc, openPanel }) {
      await rpc(sozlesmeGoster, { agentId: agent.id, bolum: args });
      openPanel("sozlesme");
    },
  });
  const pill = client.addComposerPill({
    id: "devir", workspaceId, agentId,
    button: { title: "Devir", icon: "Repeat", label: "Devir",
      behavior: { kind: "action", onPress() { /* RPC ile devir promptu gönder */ } } },
  });
  client.addWorkspacePanel({
    id: "sozlesme", title: "Sözleşme", icon: "ScrollText", context: "agent",
    locations: ["workspace", "explorer"], Component: SozlesmePanel,
  });
  return () => { pill.remove(); };
}
```

- Pill her zaman ikon + `label` (yoksa `title`) gösterir, chevron göstermez; `{ update, remove }` handle'ı döner. Tek bir ajanın composer'ına hedeflenir.
- Panel: `id`/`title`/`icon` zorunlu; `context`: `"workspace" | "agent"`; `locations`: `"workspace"` ve/veya `"explorer"`. Bileşen `PluginAgentPanelProps` (`theme`, `layout`, `workspaceId`, `agentId`) alır; `useWorkspace`/`useAgent` ile cache'ten okur.
- Komut önceliği: built-in > plugin (katalog sırası) > provider. Composer'da ek varken komut çalışmaz; `/sozlesme ...` metni ajana asla gönderilmez.

## 6. Server RPC ↔ client bileşeni

Tek Zod sözleşmesi `shared/` altında, iki taraf da onu import eder:

```ts
// shared/sozlesme.ts
import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";
export const sozlesmeGoster = defineRpc({
  name: "sozlesme.goster",
  input: z.object({ agentId: z.string(), bolum: z.string() }),
  output: z.object({ metin: z.string() }),
});
// index.server.ts:  server.handle(sozlesmeGoster, async ({ agentId, bolum }) => ({ metin: "..." }));
// client tarafı:    const calistir = useRpc(sozlesmeGoster); await calistir({ agentId, bolum: "" });
```

- RPC adı küçük harfle başlar; harf/rakam/nokta/tire/alt çizgi. Girdi ve çıktı İKİ tarafta da Zod ile doğrulanır; uyuşmazlık reddedilir.
- Handler daemon alt sürecinde Node API kullanır, `{ paseo }` SDK bağlantısına sahiptir. Client'ta `useRpc` tipli async fonksiyon döner; istek durumu için TanStack Query kullan.

## 7. Lifecycle hook'ları (hepsi index.server.ts'te)

Event'ler `server.on(name, cb)`; cb `(event, { paseo, signal })` alır, `void | Promise<void>` döner:

`agent.created`, `agent.closed`, `agent.turn_started`, `agent.turn_ended`, `agent.permission_requested`, `agent.permission_resolved`, `agent.archived`, `workspace.created`, `workspace.archived`

Before hook'ları `server.before(name, cb)`; değiştirilmiş request veya `undefined` döner:

| Hook | Request alanları | Düzenlenebilir |
| --- | --- | --- |
| `agent.create` | `config`, `env?` | `cwd` hariç public config + `env` |
| `agent.session_open` | `agentId`, `workspaceId`, `provider`, `cwd`, `reason`, `purpose`, `env` | Sadece `env` |
| `workspace.create` | `source`, `title?`, `firstAgentContext` | Tüm istek (ör. directory → worktree) |

Kurallar: event'ler canlı + best-effort (replay/persist/retry yok); event handler hatası loglanır, ana işlem sürer; before hatası işlemi iptal eder; timeout 30 sn (`signal` abort olur); kayıtlar idempotent remover döndürür (`const off = server.on(...); off();`); cleanup async olabilir; reload/disable/remove/shutdown'da Paseo kalan kayıtları, RPC'leri ve alt süreci temizler. Daemon'un özel geçici yardımcı ajanları event üretmez.

## Yayınlama + migrasyon notları

- npm: `npm pkg set name=@kapsam/paket version=1.0.0`, `npm publish --access public`; registry için github.com/getpaseo/plugins'a submission. Git: `paseo plugin add git:owner/repo[:alt/yol] [--ref main]`.
- Yönetim: `paseo plugin install/reload/logs/disable/enable/remove <id>`; kaynak değişikliği `reload` ister, daemon'ı restart ETME.
- 0.7 ve öncesi tek `index.ts` girişli pluginler 0.8+'da yüklenmez → migration.md: dosyaları `client/`/`server/`/`shared/` altına taşı, registration'ları iki entry'ye böl.

## ÖZET

1. Manifest tek dosya: zorunlu tek alan `id`; `requirements.paseo: ">=0.8.0"` yaz, yoksa modern daemon plugin'i reddeder.
2. Sözleşme metni enjeksiyonunun tek doğru kapısı `server.before("agent.create")` → `config.systemPrompt`; config kalıcı kaydedilir, `agent.session_open` sadece env verir.
3. Tur sonu dürtme: `agent.turn_ended` + `paseo.agents.ref(id).send()`; permission otomasyonu: `agent.permission_requested` + `respondToPermission({ behavior: "allow" | "deny" })`.
4. UI üçlüsü client tarafında: `addSlashCommand`, `addComposerPill` (button descriptor), `addWorkspacePanel`; veri client'a `defineRpc` (Zod, `shared/`) + `server.handle` + `useRpc` üçgeniyle akar.
5. Toplam 9 event + 3 before hook; 30 sn timeout, best-effort event'ler, async cleanup; kaynak değişince `paseo plugin reload <id>`.

## Bu sözleşme plugin'i için önerilen mimari

- `server/sozlesme.md`: altın kurallar + %70/%80/%90 bağlam bütçesi + devir töreni + L0-L5 hafıza talimatları tek dosyada; `agent.create` hook'u bunu `systemPrompt` başına enjekte eder (tek gerçek kaynak, sürümlemesi kolay).
- Bağlam bütçesi dürtmeleri: `agent.turn_ended`'da timeline/usage sinyali oku; eşik aşımında `send()` ile "L2'ye yaz / devir hazırla" hatırlat. Sonsuz döngüye karşı `Map<agentId, { sayac, sonGonderim }>` + cooldown.
- Altın kural polisi: `agent.permission_requested`'da komut politikası (`rm -rf` → deny, `git status` → allow); gerisini kullanıcıya bırak.
- Devir töreni: composer pill "Devir" → RPC → server handler'ı devir promptunu `send()` ile yollar; isterse L0-L5 dosyalarının varlığını `node:fs` ile doğrular.
- Hafıza paneli: workspace panel, L0-L5 dosyalarının durumunu server RPC ile okuyup listeler; `/sozlesme [bolum]` slash komutu paneli açar veya ilgili bölümü ajana hatırlatma olarak gönderir.
- Provider bağımsız kal: `systemPrompt` enjeksiyonu her provider'da çalışır; `providerOptions`'a (sandbox_mode vb.) dokunma — sözleşme davranışı prompt katmanında kalsın.
