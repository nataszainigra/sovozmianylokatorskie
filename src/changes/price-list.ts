// Typy
export interface PriceListItem {
  title: string;
  unit: string;
  price: number;
}

// Minimalny cennik (przykładowe, rozszerzalne)
export const PRICE_LIST: Record<string, PriceListItem> = {
  // ROBOTY BUDOWLANE
  'RB-001': { title: 'Ścianka działowa gips 8 cm – wykonanie', unit: 'm2', price: 240 },
  'RB-002': { title: 'Likwidacja ścianki gips 8 cm (z otworem)', unit: 'm2', price: 140 },
  'RB-003': { title: 'Ścianka działowa gips 10 cm – wykonanie', unit: 'm2', price: 260 },
  'RB-004': { title: 'Likwidacja ścianki gips 10 cm (z otworem)', unit: 'm2', price: 160 },
  'RB-005': { title: 'Ścianka silikat 12 cm – wykonanie', unit: 'm2', price: 280 },
  'RB-006': { title: 'Likwidacja ściany silikat 18/24 cm', unit: 'm2', price: 180 },
  'RB-007': { title: 'Tynk gipsowy + gruntowanie', unit: 'm2', price: 70 },
  'RB-008': { title: 'Szpachlowanie', unit: 'm2', price: 40 },
  'RB-009': { title: 'Usunięcie warstw posadzkowych', unit: 'm2', price: 90 },
  'RB-010': { title: 'Uzupełnienie warstw posadzkowych', unit: 'm2', price: 150 },
  'RB-011': { title: 'Wypełnienie bruzd w tynku', unit: 'mb', price: 40 },

  // ELEKTRYKA
  'EL-001': { title: 'Dodatkowy wypust oświetleniowy (z wyłącznikiem)', unit: 'szt.', price: 250 },
  'EL-002': { title: 'Dodatkowy wyłącznik do istniejącego wypustu', unit: 'szt.', price: 170 },
  'EL-003': { title: 'Dodatkowe gniazdo elektryczne', unit: 'szt.', price: 220 },
  'EL-004': { title: 'Dodatkowy wypust trójfazowy', unit: 'szt.', price: 250 },
  'EL-005': { title: 'Gniazdo telefoniczne/RTV/INT', unit: 'szt.', price: 250 },
  'EL-006': { title: 'Gniazdo antenowe', unit: 'szt.', price: 250 },
  'EL-007': { title: 'Dodatkowy obwód elektryczny z zabezpieczeniem', unit: 'szt.', price: 700 },
  'EL-008': { title: 'Demontaż punktu elektrycznego (po rob.)', unit: 'kpl.', price: 120 },
  'EL-009': { title: 'Przesunięcie punktu do 3 m (po rob.)', unit: 'szt.', price: 230 },
  'EL-010': { title: 'Bruzdowanie', unit: 'mb', price: 50 },

  // SANITARNE
  'SA-001': { title: 'Dodatkowy punkt wod-kan (do 5 m od pionu)', unit: 'kpl.', price: 700 },
  'SA-002': { title: 'Nowe podejście do grzejnika', unit: 'kpl.', price: 500 },
  'SA-003': { title: 'Demontaż punktu wod-kan/CO (po rob.)', unit: 'kpl.', price: 200 },
  'SA-004': { title: 'Dodatkowy punkt wentylacji bytowej', unit: 'kpl.', price: 700 },
  'SA-005': { title: 'Przesunięcie wod-kan/CO/went. do 3 m (po rob.)', unit: 'kpl.', price: 400 },
  'SA-006': { title: 'Bruzdowanie (sanitarne)', unit: 'mb', price: 50 },

  // DOKUMENTACJA
  'DO-001': { title: 'Naniesienie zmian na dokumentację powykonawczą', unit: 'szt.', price: 1000 }
};

// Mapowanie branż na kody cennika
export const BRANCH_TO_CODES: Record<string, string[]> = {
  'Architektura': ['RB-001', 'RB-002', 'RB-003', 'RB-004', 'RB-005', 'RB-006', 'RB-007', 'RB-008', 'RB-009', 'RB-010', 'RB-011'],
  'Konstrukcja': ['RB-001', 'RB-002', 'RB-003', 'RB-004', 'RB-005', 'RB-006', 'RB-011'],
  'Instalacje elektryczne i teletechniczne': ['EL-001', 'EL-002', 'EL-003', 'EL-004', 'EL-005', 'EL-006', 'EL-007', 'EL-008', 'EL-009', 'EL-010'],
  'Instalacja wod-kan': ['SA-001', 'SA-003', 'SA-005', 'SA-006'],
  'Instalacja CO': ['SA-002', 'SA-003', 'SA-005', 'SA-006'],
  'Instalacja wentylacji': ['SA-004', 'SA-005', 'SA-006'],
  'Naniesienie zmian': ['DO-001']
};

// Funkcja pomocnicza do pobrania pozycji cennika dla branży
export function getPriceListForBranch(branch: string): Array<{ code: string; item: PriceListItem }> {
  const codes = BRANCH_TO_CODES[branch] || [];
  return codes.map(code => ({
    code,
    item: PRICE_LIST[code]
  })).filter(entry => entry.item);
}
