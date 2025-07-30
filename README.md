# SAM Frontend - Subcontractor Administration Management

SAM (Subcontractor Administration Management) is a comprehensive React-based frontend application for managing construction projects, subcontractors, BOQs (Bill of Quantities), IPCs (Interim Payment Certificates), and related administrative tasks.

## Features

- **Dashboard Analytics**: Project statistics, revenue tracking, and performance metrics
- **Subcontractor Management**: Complete CRUD operations for subcontractor data
- **BOQ Management**: Bill of Quantities creation, editing, and tracking
- **IPC Database**: Interim Payment Certificate management and progress tracking
- **Contract Management**: Contract database with full lifecycle tracking
- **Budget Management**: Budget BOQs with detailed financial oversight
- **Administrative Tools**: User management, cost codes, currencies, trades, units, and templates
- **File Management**: Excel preview, PDF viewing, and file upload capabilities
- **Authentication**: Secure login/logout with token-based authentication
- **Responsive Design**: Built with DaisyUI and Tailwind CSS

## How to run

### Using NPM

1. Install dependencies

```
npm install
```

2. Run the dev server

```
npm run dev
```

3. Or build and preview:

```
npm run build
npm run preview
```

### Using Yarn

1. Install dependencies

```
yarn
```

2. Run the dev server

```
yarn dev
```

3. Or build and preview:

```
yarn build
yarn preview
```

### Using Bun

1. Install dependencies

```
bun i
```

2. Run the dev server

```
bun run dev
```

3. Or build and preview:

```
bun run build
bun run preview
```

Note: It is compatible with all 3 major package managers (NPM, Yarn & Bun)
We recommended using bun for faster deps installation

## Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: DaisyUI + Tailwind CSS
- **State Management**: React Context API
- **Authentication**: Microsoft Authentication Library (MSAL)
- **HTTP Client**: Custom API service with fetch
- **Charts**: ApexCharts
- **File Handling**: FilePond
- **Icons**: Iconify

### Project Structure
```
src/
├── api/                    # API configuration and requests
├── components/             # Reusable UI components
│   ├── daisyui/           # DaisyUI component wrappers
│   ├── forms/             # Form-specific components
│   └── Table/             # Data table components
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── pages/                 # Page components
│   ├── admin/             # Admin dashboard pages
│   │   ├── dashboards/    # Dashboard modules
│   │   ├── adminTools/    # Administrative tools
│   │   └── ui/            # UI component demos
│   └── auth/              # Authentication pages
├── router/                # React Router configuration
├── styles/                # CSS and styling files
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

### Backend Integration
- **API Base URL**: `https://samback.karamentreprises.com/api/`
- **Authentication**: Bearer token-based authentication
- **Error Handling**: Comprehensive HTTP status code handling with user-friendly messages
- **Security**: Input validation, unauthorized access protection, and safe redirects

### Key Modules

#### Dashboard Modules
- **IPCs Database**: `/admin/dashboards/IPCs-database` - Interim Payment Certificate management
- **Budget BOQs**: `/admin/dashboards/budget-boqs` - Budget Bill of Quantities
- **Subcontractor BOQs**: `/admin/dashboards/subcontractors-BOQs` - Subcontractor-specific BOQs
- **Contracts Database**: `/admin/dashboards/contracts-database` - Contract management
- **Deductions Database**: `/admin/dashboards/deductions-database` - Deduction tracking
- **Reports**: `/admin/dashboards/reports` - Analytics and reporting

#### Administrative Tools
- **Users**: User management and permissions
- **Subcontractors**: Subcontractor database management
- **Projects**: Project setup and configuration
- **Cost Codes**: Cost classification system
- **Currencies**: Multi-currency support
- **Trades**: Trade/craft management
- **Units**: Measurement units configuration
- **Templates**: Document and form templates

### Custom Hooks
- `use-local-storage.ts`: Local storage management
- `use-permissions.ts`: User permission handling
- `use-toast.ts`: Toast notification system
- Module-specific hooks for data fetching and state management

### Security Features
- Token-based authentication with automatic renewal
- Protected routes with permission checks
- Input sanitization and validation
- Secure API communication with error handling
- Safe navigation and redirect handling
