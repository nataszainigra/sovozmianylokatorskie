# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SOVO-proto is a NestJS-based web application for managing tenant change requests (zmiany lokatorskie) in apartments. The system provides automatic cost estimation based on a predefined price list and allows users to submit change requests with file attachments.

## Development Commands

**Start development server with hot reload:**
```bash
npm run dev
# Application runs on http://localhost:3000
```

**Build for production:**
```bash
npm run build
```

**Start production server:**
```bash
npm start
```

## Architecture

### Technology Stack
- **Framework**: NestJS 10.x with TypeScript
- **View Engine**: EJS templates
- **Styling**: Tailwind CSS (via CDN)
- **File Upload**: Multer (15MB limit, up to 10 files)
- **File Storage**: Local filesystem (`uploads/` directory)

### Module Structure

The application follows NestJS modular architecture:

- **AppModule** (`src/app.module.ts`): Root module that imports ChangesModule
- **ChangesModule** (`src/changes/changes.module.ts`): Core business logic module for handling change requests

### Key Components

**ChangesService** (`src/changes/changes.service.ts`)
- Central business logic for price estimation and request processing
- `mapItem()`: Maps change items to price list entries, handles code normalization and keyword matching
- `estimate()`: Calculates subtotal, VAT (23%), and total cost; identifies items requiring manual analysis
- `guessCode()`: Keyword-based fallback mapping when user doesn't provide price list codes
- Accepts both user-provided codes (EL-003 format) and performs automatic matching via keywords

**Price List** (`src/changes/price-list.ts`)
- Static price database with code-based lookup
- Codes follow pattern: `{CATEGORY}-{NUMBER}` (e.g., EL-003, RB-001, SA-002)
- Categories:
  - `RB-*`: Construction work (Roboty Budowlane)
  - `EL-*`: Electrical installations (Elektryka)
  - `SA-*`: Plumbing/heating/ventilation (Sanitarne)
  - `DO-*`: Documentation
- Each entry contains: title, unit (m2/szt./mb/kpl.), price

**ChangesController** (`src/changes/changes.controller.ts`)
- `GET /`: Landing page
- `GET /wniosek`: Change request form
- `POST /api/estimate`: Live price estimation endpoint (used by frontend for real-time calculations)
- `POST /wniosek/podsumowanie`: Form submission with file uploads, saves to JSON storage, renders summary page
- `GET /cennik`: Price list display

**RequestsService** (`src/changes/requests.service.ts`)
- Manages persistent storage of submitted requests using JSON files
- Storage location: `data/requests.json`
- `saveRequest()`: Saves new request with auto-generated ID and timestamp
- `getAllRequests()`: Returns all requests sorted by submission date (newest first)
- `getRequestById()`: Retrieves single request by ID
- `updateRequestStatus()`: Updates request status and notes
- `updateRequestItems()`: Updates request items and recalculates estimate
- `getStats()`: Returns aggregated statistics by status

**DashboardController** (`src/changes/dashboard.controller.ts`)
- Technical department dashboard for managing submitted requests
- `GET /dashboard`: List view with filtering and statistics
- `GET /dashboard/request/:id`: Detailed view of single request
- `POST /dashboard/request/:id/status`: Update request status and notes
- `POST /dashboard/request/:id/items`: Update items with manual pricing adjustments

### Type Definitions

See `src/common/types.ts` for core interfaces:
- **ChangeItem**: Individual change request item with room, branch, code, description, unit, quantity
- **ChangeRequest**: Complete request with buyer info, contact details, correspondence address, items array, attachments
- **RequestStatus**: Status type: 'nowy' | 'w trakcie' | 'zaakceptowany' | 'odrzucony'
- **SavedRequest**: Extends ChangeRequest with id, status, timestamps, estimatedCost, and notes

### View Templates

Located in `views/`:
- `index.ejs`: Homepage with links to form, price list, and dashboard
- `wniosek.ejs`: Main change request form with dynamic item builder and live estimation
- `podsumowanie.ejs`: Summary page after submission
- `cennik.ejs`: Price list display
- `partials/`: Reusable EJS components
- `dashboard/index.ejs`: Technical department dashboard - list of all requests with filtering and stats
- `dashboard/detail.ejs`: Request detail view with status management and manual price editing

### Data Storage

**Request Data Storage**
- **Location**: `data/requests.json`
- **Format**: JSON array of SavedRequest objects
- **Auto-created**: Directory and file created automatically on first save
- **Sorting**: Requests returned sorted by submission date (newest first)

**File Upload Configuration**
- **Location**: `./uploads/` directory
- **Naming**: `{timestamp}-{random}.{ext}`
- **Allowed types**: PDF, JPG, PNG
- **Size limit**: 15MB per file
- **Max files**: 10 per request

## Important Development Notes

### Dashboard Features

The technical department dashboard (`/dashboard`) provides:
1. **Request List View**: All submitted requests with status filtering and statistics
2. **Status Management**: Track requests through workflow (nowy → w trakcie → zaakceptowany/odrzucony)
3. **Manual Price Editing**: Adjust unit prices for items requiring technical analysis
4. **Real-time Recalculation**: Estimate updates automatically when items are modified
5. **Client Information**: Full buyer details and correspondence address
6. **Attachment Access**: Direct links to uploaded files

### Price Estimation Logic

The system has two modes for price calculation:
1. **Automatic**: User provides code or system matches via keywords → price auto-calculated
2. **Manual**: No matching code/keywords → marked as "Do analizy Działu Technicznego" (requires technical department analysis)

Items marked for manual analysis show with orange background in dashboard and can have custom prices entered.

When adding new price list items or keyword mappings, update both:
- `PRICE_LIST` in `src/changes/price-list.ts`
- `guessCode()` function in `src/changes/changes.service.ts`

### Code Normalization

Price list codes are case-insensitive (EL-003 = el-003) and normalized to uppercase format via `normalizeCode()`.

### Request Workflow

1. Client submits request via `/wniosek` form
2. Request saved to `data/requests.json` with status 'nowy'
3. Technical department reviews in dashboard at `/dashboard`
4. Status updated through workflow: nowy → w trakcie → zaakceptowany/odrzucony
5. Manual pricing applied to items requiring analysis
6. Estimate recalculated with final pricing

### Path Aliases

TypeScript is configured with `@/*` alias mapping to `src/*` directory.
