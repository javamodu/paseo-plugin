# Kilit ve release
Final ZIP = sabit öneri baseline'ı. APPROVAL.json PENDING; onay otomatik uydurulmaz.
Design approval: karar IDs+manifest SHA+reviewer+timezone ISO timestamp.
`python tools/verify.py` → sonra explicit operator approval → yeni LOCK.json.
Lock label/actor string kimlik doğrulama veya dijital imza değildir.
Baseline değişirse version+diff+impact+human review; manifest'i sessiz yenilemek onay değildir.
Production release: real adapter/environment receipt, ACCEPTANCE.csv required PASS,
lockfile/SBOM, backup/restore, owner ve known limitations.
Paket hash testleri, demo render veya saf fixture tests production kapılarını açmaz.
