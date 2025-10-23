# SOVO-proto - System zarządzania zmianami lokatorskimi

System do składania i zarządzania wnioskami o zmiany lokatorskie w apartamentach.

## 📋 Wymagania

- **Node.js** 18.x lub nowszy
- **npm** 8.x lub nowszy
- **Konto Supabase** (darmowe na https://supabase.com)

## 🚀 Instalacja i uruchomienie

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/twoj-username/SOVO-proto.git
cd SOVO-proto
```

### 2. Zainstaluj zależności

```bash
npm install
```

### 3. Skonfiguruj Supabase

#### 3.1. Utwórz projekt w Supabase

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Kliknij **"New Project"**
3. Wypełnij dane:
   - **Project name**: SOVO-proto (lub dowolna nazwa)
   - **Database Password**: Wygeneruj i ZAPISZ bezpieczne hasło
   - **Region**: Wybierz najbliższy (np. Europe Central)
4. Kliknij **"Create new project"** i poczekaj ~2 minuty

#### 3.2. Uruchom migrację bazy danych

1. W Supabase Dashboard przejdź do **SQL Editor**
2. Kliknij **"New query"**
3. Skopiuj i wklej zawartość pliku `supabase/migrations/001_initial_schema.sql`
4. Kliknij **"Run"** (lub Ctrl+Enter)

Powinno się pojawić: ✅ Success. No rows returned

#### 3.3. Pobierz klucze API

1. W Supabase Dashboard przejdź do **Settings** → **API**
2. Skopiuj:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon public** key (długi token zaczynający się od `eyJ...`)

### 4. Utwórz plik .env

Skopiuj przykładowy plik i uzupełnij danymi z Supabase:

```bash
cp .env.example .env
```

Edytuj plik `.env` i wklej swoje dane:

```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=twoj-anon-key-tutaj
```

**⚠️ WAŻNE**: Nigdy nie commituj pliku `.env` do repozytorium!

### 5. Uruchom aplikację

#### Tryb deweloperski (z hot reload):

```bash
npm run dev
```

Aplikacja będzie dostępna na: **http://localhost:3000**

#### Tryb produkcyjny:

```bash
npm run build
npm start
```

## 📁 Struktura projektu

```
SOVO-proto/
├── src/
│   ├── app.module.ts           # Główny moduł aplikacji
│   ├── changes/                # Moduł wniosków o zmiany
│   │   ├── changes.controller.ts
│   │   ├── changes.service.ts
│   │   ├── requests.service.ts  # Serwis bazy danych (Supabase)
│   │   ├── dashboard.controller.ts
│   │   └── price-list.ts        # Cennik zmian
│   ├── supabase/               # Integracja z Supabase
│   │   ├── supabase.service.ts
│   │   └── supabase.module.ts
│   └── common/
│       └── types.ts            # Typy TypeScript
├── views/                      # Szablony EJS
│   ├── wniosek.ejs            # Formularz wniosku
│   ├── cennik.ejs             # Cennik
│   └── dashboard/             # Dashboard działu technicznego
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Schema bazy danych
├── uploads/                    # Załączone pliki (tworzone automatycznie)
├── .env.example               # Przykład konfiguracji
└── SUPABASE_MIGRATION.md      # Szczegółowa dokumentacja migracji
```

## 🔧 Dostępne komendy

```bash
npm run dev        # Uruchom w trybie deweloperskim z hot reload
npm run build      # Zbuduj do produkcji
npm start          # Uruchom wersję produkcyjną
```

## 🌐 Główne funkcje

### Dla klientów:
- **Formularz wniosku** (`/wniosek`): Składanie wniosków o zmiany z automatyczną wyceną
- **Cennik** (`/cennik`): Przegląd cennika zmian lokatorskich
- **Orientacyjna wycena**: Live wycena podczas wypełniania formularza
- **Dropdown z cennikiem**: Wybór pozycji z cennika według branży
- **Opcja "Inne"**: Możliwość wpisania własnego opisu dla pozycji niestandardowych

### Dla działu technicznego:
- **Dashboard** (`/dashboard`): Zarządzanie wszystkimi wnioskami
- **Szczegóły wniosku**: Pełny widok z możliwością edycji
- **Analiza techniczna**: Wpisywanie analiz dla pozycji wymagających wyceny ręcznej
- **Edycja wyceny**: Ręczna zmiana cen jednostkowych
- **Wysyłka kosztorysu**: Akceptacja i wysyłka finalnego kosztorysu do klienta (z potwierdzeniem)
- **Statusy**: Zarządzanie statusem wniosku (nowy/w trakcie/zaakceptowany/odrzucony)

## 📊 Baza danych

### Tabele w Supabase:

**change_requests** - Główna tabela wniosków:
- Dane klienta (imię, email, telefon, adres)
- Status wniosku
- Wycena (subtotal, VAT, total)
- Załączniki
- Timestamps

**change_items** - Pozycje zmian w wnioskach:
- Powiązanie z wnioskiem (request_id)
- Pomieszczenie, branża
- Kod z cennika / opis
- Jednostka, ilość, cena
- Analiza techniczna

## 🔐 Bezpieczeństwo

### Row Level Security (RLS)

Domyślnie polityki są ustawione na "allow all" dla testowania.

**⚠️ Przed wdrożeniem produkcyjnym:**
1. Dodaj autentykację użytkowników
2. Ogranicz polityki RLS zgodnie z rolami
3. Zobacz szczegóły w: `SUPABASE_MIGRATION.md`

## 🐛 Troubleshooting

### Błąd: "Missing Supabase environment variables"

**Rozwiązanie:**
- Sprawdź czy plik `.env` istnieje w głównym katalogu
- Upewnij się że zmienne są poprawnie ustawione
- Restart serwera: `npm run dev`

### Błąd: "Failed to save request"

**Rozwiązanie:**
- Sprawdź czy migration SQL została wykonana w Supabase
- Zweryfikuj połączenie w Supabase Dashboard → Table Editor
- Sprawdź czy tabele `change_requests` i `change_items` istnieją

### Port 3000 jest zajęty

**Rozwiązanie:**
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 🚀 Wdrożenie na Vercel

### Automatyczne wdrożenie z GitHub

1. **Zaloguj się do [Vercel](https://vercel.com)**
2. Kliknij **"Add New Project"**
3. Zaimportuj swoje repozytorium z GitHub
4. **Skonfiguruj zmienne środowiskowe:**
   - Przejdź do **Settings** → **Environment Variables**
   - Dodaj:
     - `SUPABASE_URL` → twój URL z Supabase
     - `SUPABASE_ANON_KEY` → twój anon key z Supabase
5. Kliknij **"Deploy"**

### Ręczne wdrożenie (CLI)

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Zaloguj się
vercel login

# Zbuduj projekt
npm run build

# Deploy
vercel --prod
```

Podczas pierwszego deploya Vercel zapyta o zmienne środowiskowe - wklej swoje klucze Supabase.

### ⚠️ Ważne uwagi dla Vercel:

**Przechowywanie plików (uploads/):**
- Vercel ma **read-only filesystem** - pliki uploadowane przez użytkowników NIE będą zachowane między deploymentami
- **Rozwiązania:**
  1. **Supabase Storage** (zalecane) - przechowuj pliki bezpośrednio w Supabase
  2. **Vercel Blob Storage** - płatna usługa Vercel
  3. **AWS S3, Cloudinary** - zewnętrzne storage

Zobacz dokumentację Supabase Storage: https://supabase.com/docs/guides/storage

## 📚 Dokumentacja

- **SUPABASE_MIGRATION.md** - Szczegółowa instrukcja migracji i konfiguracji Supabase
- **CLAUDE.md** - Dokumentacja dla AI (struktura projektu, zasady developmentu)
- **vercel.json** - Konfiguracja Vercel deployment

## 🔄 Historia wersji

### v0.3 (aktualna)
- ✅ Migracja z JSON do Supabase PostgreSQL
- ✅ Dropdown z cennikiem według branży
- ✅ Automatyczne pobieranie jednostek z cennika
- ✅ Branża "Naniesienie zmian" z pozycją dokumentacji
- ✅ Pole "Analiza techniczna" dla Działu Technicznego
- ✅ System wysyłki kosztorysu z potwierdzeniem
- ✅ Pełna integracja z Supabase

### v0.2
- Formularz z automatyczną wyceną według cennika
- Panel "Orientacyjna wycena" (live)
- Pozycje "Do analizy Działu Technicznego"
- Upload plików (PDF/JPG/PNG)
- Dashboard dla Działu Technicznego
