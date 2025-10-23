import { Injectable } from '@nestjs/common';
import { ChangeItem, ChangeRequest } from '../common/types';
import { PRICE_LIST } from './price-list';

function normalize(s: string) {
  return (s || '').toLowerCase().trim();
}

// Akceptuj el-003 / EL-003 i zwracaj w formacie UPPERCASE
function normalizeCode(s?: string): string | undefined {
  if (!s) return;
  const m = String(s).trim().match(/^([a-zA-Z]{2})-(\d{3})$/i);
  if (!m) return;
  return `${m[1].toUpperCase()}-${m[2]}`;
}

// Mapowanie słów kluczowych -> kod cennika (fallback)
function guessCode(item: ChangeItem): string | undefined {
  const d = normalize(item.description);
  const b = normalize(item.branch as any);

  // ELEKTRYKA
  if (d.includes('gniazdo')) return 'EL-003';
  if (d.includes('wypust') && d.includes('oświet')) return 'EL-001';
  if (d.includes('trójfaz')) return 'EL-004';
  if (d.includes('wyłącznik')) return 'EL-002';
  if (d.includes('anteno')) return 'EL-006';
  if (d.includes('telefon') || d.includes('rtv') || d.includes('int')) return 'EL-005';
  if (d.includes('obwód') || d.includes('zabezpieczen')) return 'EL-007';
  if (d.includes('bruzd') && (b.includes('elek') || b.includes('teletech'))) return 'EL-010';

  // SANITARNE
  if (d.includes('wod') || d.includes('kan') || d.includes('umywalk') || d.includes('zlew') || d.includes('zmywark') || d.includes('pralk')) return 'SA-001';
  if (d.includes('grzejnik')) return 'SA-002';
  if (d.includes('demontaż') && (d.includes('wod') || d.includes('co'))) return 'SA-003';
  if (d.includes('wentylac')) return 'SA-004';
  if (d.includes('przesunię') && (d.includes('wod') || d.includes('co') || d.includes('went'))) return 'SA-005';
  if (d.includes('bruzd') && (b.includes('wod') || b.includes('sanit') || b.includes('co'))) return 'SA-006';

  // ROBOTY BUDOWLANE
  if (d.includes('ściank') && (d.includes('wykona') || d.includes('postawi'))) return 'RB-001';
  if (d.includes('likwid') || d.includes('rozbiór')) return 'RB-002';
  if (d.includes('tynk')) return 'RB-007';
  if (d.includes('szpachl')) return 'RB-008';
  if (d.includes('posadzk') && d.includes('usun')) return 'RB-009';
  if (d.includes('posadzk') && (d.includes('uzup') || d.includes('wylew'))) return 'RB-010';
  if (d.includes('bruzd') && (b.includes('arch') || b.includes('konstr'))) return 'RB-011';

  // Dokumentacja
  if (d.includes('dokumentac')) return 'DO-001';

  return undefined;
}

@Injectable()
export class ChangesService {
  mapItem(i: ChangeItem) {
    const codeFromUser = normalizeCode(i.code);
    const code = codeFromUser || guessCode(i);
    const pl = code ? PRICE_LIST[code] : undefined;

    // Jeśli podano kod – wymuś jednostkę z cennika (żeby nie było np. "szt." przy pozycji m2)
    const unit = code && pl?.unit ? pl.unit : (i.unit || pl?.unit || '');
    const unitPrice = pl?.price; // klient nie podaje ceny
    const title = (code && pl?.title) || i.description || code || '';

const qty = Math.max(1, Math.floor(Number(i.qty) || 0));
    const lineTotal = (unitPrice && qty) ? unitPrice * qty : undefined; // undefined -> do analizy
    const manual = lineTotal === undefined;

    return { ...i, code, title, unit, unitPrice, lineTotal, manual };
  }

  estimate(items: ChangeItem[]) {
    const rows = (items || []).map((i) => this.mapItem(i));
    const priced = rows.filter(r => !r.manual);
    const subtotal = priced.reduce((s, r) => s + (r.lineTotal || 0), 0);
    const vat = Math.round(subtotal * 0.23 * 100) / 100;
    const total = subtotal + vat;
    const manualCount = rows.filter(r => r.manual).length;
    return { rows, subtotal, vat, total, manualCount };
  }

  toRequest(payload: any): ChangeRequest {
    const items: ChangeItem[] = Array.isArray(payload.items)
      ? payload.items
      : JSON.parse(payload.items || '[]');

    return {
      buyerName: payload.buyerName || '',
      unitNumber: payload.unitNumber || '',
      email: payload.email || '',
      phone: payload.phone || '',
      addressStreet: payload.addressStreet || '',
      addressZip: payload.addressZip || '',
      addressCity: payload.addressCity || '',
      items,
      attachments: payload.attachments || [],
    };
  }
}
