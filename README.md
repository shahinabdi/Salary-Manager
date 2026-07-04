# 💰 Salary Management System

A comprehensive web application for managing and tracking salary, benefits, and financial data with advanced reporting and visualization features.

![Salary Manager](https://img.shields.io/badge/React-18.3.1-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.8-purple?style=flat&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-teal?style=flat&logo=tailwindcss)

## ✨ Features

### 📊 Data Management
- **Multi-Category Entries**: Manage salary, bonus, overtime, and benefits separately
- **Monthly Tracking**: Track worked vs not-worked months
- **Smart Validation**: Ensures data integrity with comprehensive validation rules
- **Local Storage**: Automatic data persistence without server dependency

### 📈 Advanced Statistics
- **Comprehensive Analytics**: Total income, averages, worked months analysis
- **Transport Tracking**: Simple checkbox system for transport benefits
- **Performance Indicators**: Key metrics and financial insights
- **Year-over-Year Comparison**: Track financial progress across years

### 🖨️ Professional Reporting
- **Print-Optimized Layout**: Beautiful formatted reports for printing
- **Save as PDF**: Browser-native PDF generation
- **Save as Image**: High-quality PNG export using html2canvas
- **Executive Summary**: Comprehensive yearly financial overview

### 🎨 User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Clean interface with Tailwind CSS styling
- **Dark/Light Theme Support**: Adaptive interface design
- **Accessibility**: Screen reader friendly and keyboard navigable

### 🔧 Advanced Features
- **Data Import/Export**: JSON-based backup and restore functionality
- **Search & Filter**: Advanced filtering options for data analysis
- **Month Status Calendar**: Visual overview of the entire year
- **Error Boundaries**: Robust error handling and user feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shahinabdi/Salary-Manager.git
   cd Salary-Manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🔐 Vercel Login System (Serverless API)

This project now includes a Vercel-compatible login backend using serverless functions in `api/`.

### API Endpoints

- `POST /api/login`: Validates email + password and sets an HttpOnly JWT cookie
- `GET /api/me`: Returns the currently logged-in user from the auth cookie
- `POST /api/logout`: Clears the auth cookie

### Required Environment Variables

Add these in Vercel Project Settings → Environment Variables:

```bash
POSTGRES_URL=postgres://...
JWT_SECRET=use-a-long-random-secret-value
```

`DATABASE_URL` is also supported as an alternative to `POSTGRES_URL`.

### Database Schema

Run the schema from:

```bash
database/schema.sql
```

You can manually insert users after generating a bcrypt hash:

```bash
node -e "const b=require('bcryptjs'); b.hash('YourStrongPassword123!', 12).then(console.log)"
```

Then insert the resulting hash into `users.password_hash`.

### Frontend Fetch Examples

```ts
// Login (sets HttpOnly cookie)
await fetch('/api/login', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   credentials: 'include',
   body: JSON.stringify({ email, password })
});

// Current user
await fetch('/api/me', {
   method: 'GET',
   credentials: 'include'
});
```

Implemented files:

- `api/_lib/db.ts` (Postgres connection)
- `api/_lib/auth.ts` (JWT + HttpOnly cookie helpers)
- `api/_lib/withAuth.ts` (auth middleware)
- `api/login.ts` and `api/me.ts` (+ optional `api/logout.ts`)
- `src/components/LoginPage.tsx` + `src/lib/authApi.ts`

## 📱 Usage Guide

### Adding Entry Data
1. Click **"Add Entry"** button
2. Select month and category (Salary/Bonus/Overtime/Benefits)
3. Fill in required financial information
4. Use transport checkbox to indicate transport benefits
5. Add optional notes for record keeping

### Generating Reports
1. Click **"Print Report"** button
2. Review the comprehensive yearly report
3. Choose export option:
   - **Print**: Direct printing with optimized layout
   - **PDF**: Save using browser's "Save as PDF" feature
   - **Image**: Download high-quality PNG file

### Data Management
- **Import**: Upload JSON backup files to restore data
- **Export**: Download complete data backup
- **Filter**: Use advanced filters to analyze specific periods
- **Search**: Find entries by notes, amounts, or dates

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | Frontend framework |
| **TypeScript** | 5.5.3 | Type safety and development experience |
| **Vite** | 5.4.8 | Build tool and development server |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **Lucide React** | 0.344.0 | Modern icon library |
| **html2canvas** | latest | Image generation for reports |

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── DataForm.tsx    # Entry creation/editing form
│   ├── DataTable.tsx   # Data display table
│   ├── Statistics.tsx  # Financial analytics
│   ├── PrintView.tsx   # Print-optimized layout
│   ├── PrintModal.tsx  # Print management modal
│   └── ...             # Other components
├── hooks/              # Custom React hooks
│   └── useDataManagement.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── helpers.ts
└── App.tsx            # Main application component
```

## 🎯 Key Components

### Data Types
- **SalaryEntry**: Monthly salary with Swile payments and transport tracking
- **OtherEntry**: Bonus, overtime, and benefits entries
- **Statistics**: Comprehensive financial analytics
- **Filters**: Advanced search and filtering options

### Core Features
- **Local Storage Persistence**: Automatic data saving
- **Type-Safe Operations**: Full TypeScript coverage
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Comprehensive user feedback

## 📊 Report Features

### Executive Summary
- Total income across all categories
- Monthly averages for worked periods
- Transport coverage analysis
- Key performance indicators

### Monthly Breakdown
- Detailed month-by-month analysis
- Salary, Swile, and benefit tracking
- Transport status indicators
- Category-wise totals

### Year Overview
- Visual calendar showing work status
- Completion tracking
- Financial highlights
- Trend analysis

## 🔒 Data Privacy

- **Local Storage Only**: All data stays on your device
- **No Server Communication**: Complete offline functionality
- **Export Control**: You control all data exports
- **Privacy First**: No tracking or analytics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run build`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Connect With Me

- **GitHub**: [@shahinabdi](https://github.com/shahinabdi)
- **LinkedIn**: [shahinabdi](https://linkedin.com/in/shahinabdi)

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first approach
- Lucide for the beautiful icons
- Vite for the lightning-fast development experience

---

<div align="center">

**Built with ❤️ by [Shahin Abdi](https://github.com/shahinabdi)**

⭐ Star this repo if you find it helpful!

</div>