export type Room = 'Kuchnia' | 'Łazienka' | 'Pokój' | 'Sypialnia';
export type Branch =
  | 'Architektura'
  | 'Konstrukcja'
  | 'Instalacje elektryczne i teletechniczne'
  | 'Instalacja wod-kan'
  | 'Instalacja CO'
  | 'Instalacja wentylacji'
  | 'Naniesienie zmian';

export interface ChangeItem {
  room: Room;
  branch: Branch;
  code: string;
  description: string;
  unit: 'szt.' | 'm2' | 'mb' | 'kpl.' | '';
  qty: number;
  unitPrice?: number;
  technicalAnalysis?: string;
}

export interface ChangeRequest {
  buyerName: string;
  unitNumber: string;
  email: string;
  phone?: string;
  addressStreet?: string; // Ulica i numer
  addressZip?: string;    // Kod pocztowy
  addressCity?: string;   // Miejscowość
  items: ChangeItem[];
  attachments?: string[];
}

export type RequestStatus = 'nowy' | 'w trakcie' | 'zaakceptowany' | 'odrzucony';

export interface SavedRequest extends ChangeRequest {
  id: string;
  status: RequestStatus;
  submittedAt: string;
  updatedAt?: string;
  estimatedCost?: {
    subtotal: number;
    vat: number;
    total: number;
    manualCount: number;
  };
  notes?: string;
}

