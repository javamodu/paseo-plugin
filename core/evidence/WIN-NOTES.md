# Windows'ta npm çağırma + .cmd shim probe notu (ordu-v3 devir notu)

- Bu makinede sandbox'lı PowerShell `npm` (npm.ps1) "Could not determine Node.js
  install directory" ile çöküyor; çalışan yol: `node.exe …\npm-cli.js <args>`.
- `paseo` bir `.cmd` shim (`~\.local\bin\paseo.cmd`): Node `execFileSync`'e
  görünmez (ENOENT); probe shell-fallback ile bulur → **0.11.2, daemon erişilebilir**.
- Node 24.18 type-stripping: `.ts` testleri build'siz `node --test` ile koşuyor;
  `package.json "type":"module"` gerekli (yoksa MODULE_TYPELESS uyarısı).
- Type-stripping **erasable-syntax-only**: `constructor(private x)` parameter
  property dosya yüklemesini patlatır → açık alan + atama yaz (dispatcher.test.ts).
- `node --test test/` dizin argümanı Windows'ta MODULE_NOT_FOUND veriyor; dosya
  yollarını tek tek ver.
