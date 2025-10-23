# Migracja do Supabase - Instrukcja krok po kroku

## 1. Konfiguracja Supabase

### Krok 1: Utwórz projekt w Supabase

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Kliknij "New Project"
3. Wybierz organizację i wprowadź dane projektu:
   - **Project name**: SOVO-proto (lub dowolna nazwa)
   - **Database Password**: Wygeneruj i zapisz bezpieczne hasło
   - **Region**: Wybierz najbliższy region (np. Europe Central)
4. Kliknij "Create new project" i poczekaj ~2 minuty na inicjalizację

### Krok 2: Pobierz dane dostępowe

1. W Supabase Dashboard przejdź do **Settings** → **API**
2. Skopiuj:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon public** key (długi token zaczynający się od `eyJ...`)

### Krok 3: Skonfiguruj zmienne środowiskowe

1. Utwórz plik `.env` w głównym katalogu projektu:

```bash
cp .env.example .env
```

2. Edytuj plik `.env` i wklej swoje dane:

```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=twoj-anon-key
```

**WAŻNE**: Nigdy nie commituj pliku `.env` do repozytorium!

## 2. Uruchomienie migracji bazy danych

### Krok 1: Wykonaj SQL schema w Supabase

1. W Supabase Dashboard przejdź do **SQL Editor**
2. Kliknij "New query"
3. Skopiuj i wklej zawartość pliku `supabase/migrations/001_initial_schema.sql`
4. Kliknij "Run" (lub użyj Ctrl+Enter)

Powinny zostać utworzone:
- ✅ Tabela `change_requests`
- ✅ Tabela `change_items`
- ✅ Indeksy dla wydajności
- ✅ Polityki Row Level Security (RLS)
- ✅ Trigger dla automatycznej aktualizacji `updated_at`

### Krok 2: Weryfikacja tabel

Przejdź do **Table Editor** w Supabase Dashboard i sprawdź czy widzisz:
- `change_requests`
- `change_items`

## 3. Migracja istniejących danych (opcjonalnie)

Jeśli masz już dane w `data/requests.json`, możesz je zmigrować:

### Opcja A: Ręczna migracja przez SQL

1. Otwórz plik `data/requests.json`
2. Skonwertuj dane do SQL INSERT statements
3. Uruchom w SQL Editor

### Opcja B: Skrypt migracyjny (do stworzenia)

Możesz stworzyć skrypt Node.js, który:
1. Czyta `data/requests.json`
2. Używa Supabase client do wstawienia danych
3. Mapuje stare pola na nowe

**Przykład skryptu:**

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function migrate() {
  const data = JSON.parse(fs.readFileSync('./data/requests.json', 'utf-8'));

  for (const request of data) {
    // Insert request
    const { data: req, error: reqError } = await supabase
      .from('change_requests')
      .insert({
        id: request.id,
        buyer_name: request.buyerName,
        unit_number: request.unitNumber,
        email: request.email,
        phone: request.phone,
        address_street: request.addressStreet,
        address_zip: request.addressZip,
        address_city: request.addressCity,
        status: request.status,
        submitted_at: request.submittedAt,
        updated_at: request.updatedAt,
        estimated_cost: request.estimatedCost,
        attachments: request.attachments,
        notes: request.notes,
      });

    if (reqError) {
      console.error('Error inserting request:', reqError);
      continue;
    }

    // Insert items
    if (request.items && request.items.length > 0) {
      const items = request.items.map(item => ({
        request_id: request.id,
        room: item.room,
        branch: item.branch,
        code: item.code,
        description: item.description,
        unit: item.unit,
        qty: item.qty,
        unit_price: item.unitPrice,
        technical_analysis: item.technicalAnalysis,
      }));

      const { error: itemsError } = await supabase
        .from('change_items')
        .insert(items);

      if (itemsError) {
        console.error('Error inserting items:', itemsError);
      }
    }
  }

  console.log('Migration completed!');
}

migrate();
```

## 4. Testowanie

### Krok 1: Uruchom aplikację

```bash
npm run dev
```

Aplikacja powinna uruchomić się bez błędów.

### Krok 2: Testuj funkcjonalności

1. **Złóż nowy wniosek** przez formularz `/wniosek`
2. **Sprawdź dashboard** `/dashboard` - czy wniosek się pojawił
3. **Edytuj wycenę** - dodaj analizę techniczną
4. **Zmień status** wniosku
5. **Wyślij kosztorys** do klienta

### Krok 3: Weryfikacja w Supabase

Po każdej operacji sprawdź w **Table Editor**:
- Czy dane się zapisały
- Czy relacje między tabelami działają (`change_requests` ↔ `change_items`)
- Czy timestamps (`created_at`, `updated_at`) są poprawne

## 5. Struktura bazy danych

### Tabela: `change_requests`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | TEXT (PK) | Unikalny ID wniosku |
| `buyer_name` | TEXT | Imię i nazwisko kupującego |
| `unit_number` | TEXT | Numer lokalu |
| `email` | TEXT | Email |
| `phone` | TEXT | Telefon (opcjonalny) |
| `address_street` | TEXT | Ulica i numer |
| `address_zip` | TEXT | Kod pocztowy |
| `address_city` | TEXT | Miejscowość |
| `status` | TEXT | Status: nowy/w trakcie/zaakceptowany/odrzucony |
| `notes` | TEXT | Notatki działu technicznego |
| `submitted_at` | TIMESTAMPTZ | Data złożenia |
| `updated_at` | TIMESTAMPTZ | Data ostatniej aktualizacji |
| `estimated_cost` | JSONB | Wycena (subtotal, vat, total, manualCount) |
| `attachments` | TEXT[] | Tablica nazw plików |
| `created_at` | TIMESTAMPTZ | Data utworzenia rekordu |

### Tabela: `change_items`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | SERIAL (PK) | Auto-increment ID |
| `request_id` | TEXT (FK) | Referencja do `change_requests.id` |
| `room` | TEXT | Pomieszczenie |
| `branch` | TEXT | Branża |
| `code` | TEXT | Kod z cennika (opcjonalny) |
| `description` | TEXT | Opis zmiany |
| `unit` | TEXT | Jednostka (m2, szt., kpl., mb) |
| `qty` | INTEGER | Ilość |
| `unit_price` | DECIMAL(10,2) | Cena jednostkowa |
| `technical_analysis` | TEXT | Analiza działu technicznego |
| `created_at` | TIMESTAMPTZ | Data utworzenia |

## 6. Bezpieczeństwo (Row Level Security)

Obecnie polityki RLS ustawione są na "allow all" dla łatwego testowania:

```sql
CREATE POLICY "Allow all operations on change_requests" ON change_requests
  FOR ALL USING (true) WITH CHECK (true);
```

### Po wdrożeniu - zalecenia:

1. **Dodaj autentykację użytkowników** (Supabase Auth)
2. **Ogranicz dostęp:**
   - Klienci: mogą czytać tylko swoje wnioski
   - Dział techniczny: pełny dostęp

**Przykład polityki dla klientów:**

```sql
-- Tylko właściciel może czytać swoje wnioski
CREATE POLICY "Users can read own requests" ON change_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Tylko dział techniczny może edytować
CREATE POLICY "Staff can update requests" ON change_requests
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'staff');
```

## 7. Backup i monitoring

### Automatic backups

Supabase automatycznie tworzy backup bazy danych:
- **Free plan**: codzienne backupy przez 7 dni
- **Pro plan**: point-in-time recovery

### Monitoring

W Supabase Dashboard:
- **Database** → **Reports** - statystyki użycia
- **Logs** - logi SQL queries
- **API** - metryki API calls

## 8. Troubleshooting

### Problem: "Missing Supabase environment variables"

**Rozwiązanie:**
- Sprawdź czy plik `.env` istnieje
- Zweryfikuj czy zmienne są poprawnie ustawione
- Restart serwera: `npm run dev`

### Problem: "Failed to save request: ... violates foreign key constraint"

**Rozwiązanie:**
- Sprawdź czy tabele zostały utworzone poprawnie
- Uruchom ponownie migration SQL

### Problem: "Row Level Security policy violation"

**Rozwiązanie:**
- Sprawdź czy polityki RLS są poprawnie ustawione
- Użyj **SQL Editor** by zobaczyć aktualne polityki:

```sql
SELECT * FROM pg_policies WHERE tablename = 'change_requests';
```

## 9. Koszty i limity

### Free Plan (Supabase):
- ✅ 500 MB przestrzeni bazodanowej
- ✅ 2 GB transfer miesięcznie
- ✅ Do 50,000 monthly active users
- ✅ Wystarczy dla małych/średnich projektów

### Upgrade do Pro ($25/miesiąc):
- 8 GB przestrzeni
- 50 GB transfer
- Point-in-time recovery
- Własna domena

## 10. Kolejne kroki

Po udanej migracji:

1. ✅ Usuń stary kod JSON storage (opcjonalnie, zachowaj jako backup)
2. ✅ Dodaj indeksy dla często używanych zapytań
3. ✅ Skonfiguruj autentykację użytkowników
4. ✅ Ogranicz polityki RLS
5. ✅ Skonfiguruj email notifications (Supabase Edge Functions)
6. ✅ Dodaj full-text search dla wniosków

---

## Pomoc i wsparcie

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues
