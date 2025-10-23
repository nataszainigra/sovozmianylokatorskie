# Vercel Deployment - Quick Setup Guide

## ✅ Co zostało zrobione:

### 1. Supabase Storage zamiast lokalnego folderu uploads/
- ✅ Pliki są teraz uploadowane bezpośrednio do Supabase Storage
- ✅ Endpoint `/uploads/:filename` działa (proxy do Supabase)
- ✅ Kompatybilne z Vercel (brak zapisu na dysk)

### 2. Konfiguracja Vercel
- ✅ `vercel.json` - routing i build configuration
- ✅ `.gitignore` - zignorowano folder `.vercel`

## 🚀 Kroki do deploymentu:

### Krok 1: Utwórz bucket w Supabase

**WAŻNE**: Musisz to zrobić przed pierwszym wdrożeniem!

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Storage** (ikona folderu w menu)
4. Kliknij **"Create a new bucket"**
5. Nazwa bucket: `request-attachments`
6. **Public bucket**: ✅ **ZAZNACZ** (żeby pliki były dostępne przez URL)
7. Kliknij **"Create bucket"**

### Krok 2: Commit i push na GitHub

```bash
git add .
git commit -m "Add Vercel deployment with Supabase Storage"
git push
```

### Krok 3: Deploy na Vercel

#### Opcja A: Przez stronę Vercel (zalecane)

1. Idź na [vercel.com](https://vercel.com)
2. Zaloguj się przez GitHub
3. Kliknij **"Add New Project"**
4. Wybierz repo: `sovozmianylokatorskie`
5. **Environment Variables** - dodaj:
   ```
   SUPABASE_URL=https://twoj-projekt.supabase.co
   SUPABASE_ANON_KEY=twoj-anon-key
   ```
6. Kliknij **"Deploy"**

#### Opcja B: Przez CLI

```bash
# Zainstaluj Vercel CLI (jednorazowo)
npm i -g vercel

# Deploy
vercel --prod
```

### Krok 4: Testuj aplikację

Po wdrożeniu sprawdź:

1. **Homepage**: `https://twoja-domena.vercel.app`
2. **Formularz**: Wypełnij i dodaj pliki
3. **Dashboard**: Sprawdź czy wniosek się pojawił
4. **Pliki**: Kliknij na załącznik - powinien się otworzyć

## 🔧 Troubleshooting

### Błąd: "Bucket 'request-attachments' not found"

**Rozwiązanie:**
- Upewnij się że bucket został utworzony w Supabase Storage
- Nazwa musi być dokładnie: `request-attachments`

### Błąd: "Cannot access file"

**Rozwiązanie:**
- Sprawdź czy bucket jest **public** w Supabase
- Przejdź do Storage → request-attachments → Settings
- Upewnij się że **Public bucket** jest zaznaczone

### Błąd: "Missing environment variables"

**Rozwiązanie:**
- W Vercel Dashboard → Settings → Environment Variables
- Dodaj `SUPABASE_URL` i `SUPABASE_ANON_KEY`
- Redeploy aplikację

### Pliki nie ładują się w dashboard

**Rozwiązanie:**
1. Sprawdź w Supabase Storage → request-attachments czy pliki tam są
2. Otwórz DevTools (F12) i sprawdź czy są błędy w Console
3. Sprawdź czy URL do pliku jest poprawny: `/uploads/nazwa-pliku`

## 📊 Monitoring uploadów

### W Supabase Dashboard:

1. **Storage** → **request-attachments** - zobacz wszystkie uploaded pliki
2. **Storage** → **Usage** - monitoruj przestrzeń dyskową
3. **Storage** → **Policies** - zarządzaj dostępem

### Free plan Supabase:
- ✅ 1 GB przestrzeni Storage
- ✅ 2 GB transfer miesięcznie
- Wystarczy dla większości małych/średnich projektów

## 🔄 Struktura plików w Storage

Pliki są zapisywane w formacie:
```
request-attachments/
  └── {timestamp}-{random}-{originalname}
```

Przykład:
```
1698345678901-x7k3m9-karta-lokalu.pdf
```

## 🎯 Następne kroki (opcjonalnie)

### 1. Organizacja plików w foldery

Możesz organizować pliki według wniosków:

```typescript
// Zamiast:
const filePath = fileName;

// Użyj:
const filePath = `${requestId}/${fileName}`;
```

### 2. Automatyczne usuwanie starych plików

Ustaw lifecycle policy w Supabase aby automatycznie usuwać pliki starsze niż X dni.

### 3. Dodaj progress bar dla uploadów

W formularzu możesz pokazywać progress uploadu dużych plików.

---

## ✅ Checklist przed deploymentem:

- [ ] Bucket `request-attachments` utworzony w Supabase
- [ ] Bucket ustawiony jako **public**
- [ ] Zmienne środowiskowe dodane w Vercel
- [ ] Kod commitowany i pushowany na GitHub
- [ ] Aplikacja przetestowana lokalnie

Wszystko gotowe! 🎉
