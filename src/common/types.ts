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
  comment?: string; // Komentarz dla klienta
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

export type RequestStatus =
  | 'nowy'
  | 'w trakcie'
  | 'zaakceptowany'
  | 'odrzucony'
  | 'oczekuje na akceptację klienta'
  | 'wymaga doprecyzowania';

export type MessageAuthor = 'client' | 'technical_department';

export interface Message {
  id: string;
  author: MessageAuthor;
  authorName: string; // Imię osoby piszącej
  content: string;
  timestamp: string;
  read: boolean; // Czy wiadomość została przeczytana
}

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
  messages?: Message[]; // Wątek korespondencji
  clientToken?: string; // Token do dostępu klienta bez logowania
  quoteSentAt?: string; // Kiedy wysłano kosztorys do klienta
  quoteAcceptedAt?: string; // Kiedy klient zaakceptował
}

