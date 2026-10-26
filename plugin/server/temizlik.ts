// K-0025 (A2-1): agent.closed tek noktadan tum ajan-state temizligini yurutur.
// v0.23 (BDG tekillestirme): 9 modulun ayri ajanTemizle export'lari yerine tek kayit defteri —
// modul kendi temizligini temizlikKaydet ile kaydeder; yeni modul eklendiginde temizlik.ts'in
// import listesi guncellenmez (liste unutma hata sinifi ortadan kalkar). Moduller tek yon import
// eder (temizlik.ts hicbir modulu import ETMEZ — dongu yok).
const temizleyiciler: Array<(agentId: string) => void> = [];

export function temizlikKaydet(temizleyici: (agentId: string) => void): void {
  temizleyiciler.push(temizleyici);
}

export function ajanTemizleHepsi(agentId: string): void {
  for (const temizleyici of temizleyiciler) temizleyici(agentId);
}
