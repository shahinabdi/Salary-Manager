# Salary Management System - Complete Architecture

## System Overview Diagram

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: mc
---
flowchart TB
 subgraph subGraph0["🚀 Application Entry"]
        HTML["index.html"]
        MAIN["main.tsx"]
        VITE["Vite Config"]
  end
 subgraph subGraph1["🎯 Core Application"]
        APP["App.tsx<br>Main Application Component"]
        EB["ErrorBoundary.tsx<br>Error Handling"]
  end
 subgraph subGraph2["📊 Data Management Layer"]
        HOOK["useDataManagement.ts<br>Central Data Hook"]
        LOCAL["useLocalStorage.ts<br>Persistence Hook"]
        TYPES["types/index.ts<br>TypeScript Types"]
        HELPERS["utils/helpers.ts<br>Utility Functions"]
  end
 subgraph subGraph3["📝 Forms & Input"]
        FORM["DataForm.tsx<br>Entry Creation/Edit"]
        FILTERS["Filters.tsx<br>Data Filtering"]
        TRANSPORT["TransportDefaultSetting.tsx<br>Default Settings"]
  end
 subgraph subGraph4["📋 Data Display"]
        TABLE["DataTable.tsx<br>Tabular Data View"]
        STATS["Statistics.tsx<br>Analytics Dashboard"]
        MONTH["MonthStatus.tsx<br>Month Overview Cards"]
  end
 subgraph subGraph5["🔧 Utilities"]
        IMPORT["ImportExport.tsx<br>Data I/O Operations"]
        CONFIRM["ConfirmDialog.tsx<br>Action Confirmations"]
        SPINNER["LoadingSpinner.tsx<br>Loading States"]
  end
 subgraph subGraph6["🏗️ UI Components"]
        subGraph3
        subGraph4
        subGraph5
  end
 subgraph subGraph7["📋 Type System"]
        BASE["BaseEntry<br>Common Properties"]
        SALARY["SalaryEntry<br>Salary-specific Data"]
        OTHER["OtherEntry<br>Bonus/Overtime/Benefits"]
        UNION["YearlyData Union<br>SalaryEntry and OtherEntry"]
  end
 subgraph subGraph8["💾 Storage"]
        BROWSER["localStorage<br>Browser Storage"]
        JSON["JSON Export<br>Data Backup"]
  end
 subgraph subGraph9["🗄️ Data Architecture"]
        subGraph7
        subGraph8
  end
    HTML --> MAIN
    MAIN --> APP
    APP --> EB & HOOK
    EB --> FORM & TABLE & STATS & MONTH & FILTERS & TRANSPORT & IMPORT & CONFIRM & SPINNER
    HOOK --> LOCAL & HELPERS
    LOCAL --> BROWSER
    IMPORT --> JSON
    BASE --> SALARY & OTHER
    SALARY --> UNION
    OTHER --> UNION
    UNION --> TYPES
    FORM --> UNION
    TABLE --> UNION
    STATS --> SALARY
    MONTH --> UNION
    FILTERS --> UNION
    VITE --> BUILD["Vite Build<br>Development Server"]
    CSS["Tailwind CSS<br>Styling Framework"] --> APP
     HTML:::entryPoint
     MAIN:::entryPoint
     VITE:::entryPoint
     APP:::core
     EB:::core
     HOOK:::dataLayer
     LOCAL:::dataLayer
     TYPES:::types
     HELPERS:::dataLayer
     FORM:::components
     FILTERS:::components
     TRANSPORT:::components
     TABLE:::components
     STATS:::components
     MONTH:::components
     IMPORT:::components
     CONFIRM:::components
     SPINNER:::components
     BASE:::types
     SALARY:::types
     OTHER:::types
     UNION:::types
     BROWSER:::storage
     JSON:::storage
    classDef entryPoint fill:#e1f5fe
    classDef core fill:#f3e5f5
    classDef dataLayer fill:#e8f5e8
    classDef components fill:#fff3e0
    classDef storage fill:#fce4ec
    classDef types fill:#f1f8e9
```

## Data Flow Architecture

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: mc
---
sequenceDiagram
    participant U as 👤 User
    participant A as App.tsx
    participant H as useDataManagement
    participant L as useLocalStorage
    participant B as Browser Storage
    participant C as Components

    %% Application Initialization
    U->>A: Opens Application
    A->>H: Initialize Data Hook
    H->>L: Request Data Load
    L->>B: Fetch from localStorage
    B-->>L: Return Stored Data
    L-->>H: Parsed YearlyData[]
    H-->>A: Filtered & Sorted Data
    A-->>C: Render Components

    %% Data Creation Flow
    U->>C: Click "Add Entry"
    C->>A: Open DataForm
    U->>C: Fill Form & Submit
    C->>A: Form Data
    A->>H: createItem(data)
    H->>H: Validate Data
    H->>H: Generate ID & Timestamps
    H->>L: saveData(updatedArray)
    L->>B: Store in localStorage
    B-->>L: Confirm Save
    L-->>H: Success Response
    H-->>A: Updated Data
    A-->>C: Re-render with New Data

    %% Data Filtering Flow
    U->>C: Apply Filters
    C->>A: Filter Changes
    A->>H: setFilters(filterOptions)
    H->>H: Filter & Sort Data
    H-->>A: Filtered Results
    A-->>C: Update Display

    %% Statistics Calculation
    H->>H: Calculate Statistics
    Note over H: - Only salary entries for totals<br/>- Only worked months for averages<br/>- Exclude transport from averages
    H-->>A: Statistics Object
    A-->>C: Update Statistics Display
```

## Component Interaction Flow

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: mc
---
flowchart TD
    %% User Actions
    START([User Opens App]) --> LOAD[Load Data from localStorage]
    
    %% Main App Flow
    LOAD --> RENDER[Render Main Interface]
    RENDER --> YEAR[Select Year]
    YEAR --> FILTER[Apply Filters]
    FILTER --> DISPLAY[Display Results]
    
    %% CRUD Operations
    DISPLAY --> ADD{Add New Entry?}
    DISPLAY --> EDIT{Edit Entry?}
    DISPLAY --> DELETE{Delete Entry?}
    DISPLAY --> EXPORT{Export Data?}
    DISPLAY --> IMPORT{Import Data?}
    
    %% Add Entry Flow
    ADD -->|Yes| FORM_OPEN[Open DataForm Modal]
    FORM_OPEN --> CATEGORY{Select Category}
    CATEGORY -->|Salary| SALARY_FORM[Show Full Salary Form]
    CATEGORY -->|Other| OTHER_FORM[Show Simple Amount Form]
    SALARY_FORM --> VALIDATE_SALARY[Validate Salary Data]
    OTHER_FORM --> VALIDATE_OTHER[Validate Other Data + Check Salary Exists]
    VALIDATE_SALARY --> SAVE[Save to localStorage]
    VALIDATE_OTHER --> SAVE
    
    %% Edit Entry Flow
    EDIT -->|Yes| FORM_EDIT[Open DataForm with Data]
    FORM_EDIT --> CATEGORY
    
    %% Delete Entry Flow
    DELETE -->|Yes| CONFIRM[Show Confirmation Dialog]
    CONFIRM -->|Confirm| REMOVE[Remove from localStorage]
    CONFIRM -->|Cancel| DISPLAY
    REMOVE --> REFRESH[Refresh Display]
    
    %% Import/Export Flow
    EXPORT -->|Yes| EXPORT_JSON[Generate JSON File]
    IMPORT -->|Yes| PARSE_JSON[Parse Uploaded JSON]
    PARSE_JSON --> MERGE[Merge with Existing Data]
    MERGE --> SAVE
    
    %% Data Updates
    SAVE --> STATS[Update Statistics]
    REFRESH --> STATS
    STATS --> MONTHS[Update Month Status]
    MONTHS --> DISPLAY
    
    %% Settings Flow
    DISPLAY --> TRANSPORT_SET{Set Transport Default?}
    TRANSPORT_SET -->|Yes| UPDATE_DEFAULT[Update Default for Year]
    UPDATE_DEFAULT --> SAVE

    %% Styling
    classDef userAction fill:#e3f2fd
    classDef process fill:#f1f8e9
    classDef decision fill:#fff3e0
    classDef storage fill:#fce4ec
    
    class START,YEAR,FILTER,ADD,EDIT,DELETE,EXPORT,IMPORT,TRANSPORT_SET userAction
    class LOAD,RENDER,DISPLAY,FORM_OPEN,SALARY_FORM,OTHER_FORM,VALIDATE_SALARY,VALIDATE_OTHER,EXPORT_JSON,PARSE_JSON,MERGE,STATS,MONTHS,UPDATE_DEFAULT,REFRESH process
    class CATEGORY,CONFIRM decision
    class SAVE,REMOVE storage
```

## Type System Architecture

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: mc
---
erDiagram
    BaseEntry {
        string id PK
        number year
        number month
        number amount
        string notes
        Date createdAt
        Date updatedAt
    }
    
    SalaryEntry {
        string category "salary"
        number salaryNet "Same as amount"
        number swilePayment "Previous month payment"
        number transportPayment "Previous month payment"
        boolean transportPaid "Payment status"
        boolean worked "Work status"
        number transportDefault "Optional default"
    }
    
    OtherEntry {
        string category "bonus|overtime|benefits"
    }
    
    MonthStatus {
        number year
        number month
        boolean hasSalary
        boolean hasSwile
        boolean hasTransport
        boolean notWorked
        boolean isComplete
    }
    
    FilterOptions {
        string category
        boolean transportPaid
        object monthRange
        string searchTerm
    }
    
    SortOptions {
        string field
        string direction "asc|desc"
    }
    
    ExportData {
        string exportDate
        array yearlyData
        object summary
    }
    
    ValidationError {
        string field
        string message
    }
    
    BaseEntry ||--|| SalaryEntry : "extends"
    BaseEntry ||--|| OtherEntry : "extends"
    SalaryEntry ||--o{ MonthStatus : "generates"
    FilterOptions ||--o{ SalaryEntry : "filters"
    FilterOptions ||--o{ OtherEntry : "filters"
    SortOptions ||--o{ SalaryEntry : "sorts"
    SortOptions ||--o{ OtherEntry : "sorts"
    ExportData ||--o{ SalaryEntry : "contains"
    ExportData ||--o{ OtherEntry : "contains"
```

## Business Logic Flow

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: mc
---
stateDiagram-v2
    [*] --> AppStartup: Application Load
    
    AppStartup --> DataLoaded: Load from localStorage
    DataLoaded --> YearSelected: Select Year
    YearSelected --> DisplayData: Filter by Year
    
    DisplayData --> AddEntry: Click Add
    DisplayData --> EditEntry: Click Edit
    DisplayData --> DeleteEntry: Click Delete
    DisplayData --> ViewMonth: Click Month Card
    DisplayData --> FilterData: Apply Filters
    DisplayData --> ExportData: Export
    DisplayData --> ImportData: Import
    DisplayData --> TransportSetting: Modify Transport Default
    
    %% Add Entry Flow
    AddEntry --> CategorySelection: Choose Category
    CategorySelection --> SalaryForm: If Salary
    CategorySelection --> OtherForm: If Bonus/Overtime/Benefits
    
    SalaryForm --> WorkStatus: Set Work Status
    WorkStatus --> SalaryFields: If Worked=true
    WorkStatus --> NotWorkedEntry: If Worked=false
    SalaryFields --> SalaryValidation: Validate
    NotWorkedEntry --> SalaryValidation: Validate
    SalaryValidation --> SaveSalary: If Valid
    SalaryValidation --> SalaryForm: If Invalid
    
    OtherForm --> CheckSalaryExists: Validate Prerequisites
    CheckSalaryExists --> OtherValidation: If Salary Entry Exists
    CheckSalaryExists --> ValidationError: If No Salary Entry
    OtherValidation --> SaveOther: If Valid
    OtherValidation --> OtherForm: If Invalid
    ValidationError --> OtherForm: Show Error
    
    %% Save Operations
    SaveSalary --> UpdateStatistics: Recalculate
    SaveOther --> UpdateStatistics: Recalculate
    UpdateStatistics --> UpdateMonthStatus: Refresh Status
    UpdateMonthStatus --> DisplayData: Return to Main View
    
    %% Edit Entry Flow
    EditEntry --> LoadExistingData: Populate Form
    LoadExistingData --> CategorySelection: Modify Data
    
    %% Delete Entry Flow
    DeleteEntry --> ConfirmDelete: Show Confirmation
    ConfirmDelete --> RemoveEntry: If Confirmed
    ConfirmDelete --> DisplayData: If Cancelled
    RemoveEntry --> UpdateStatistics: Recalculate
    
    %% Month View Flow
    ViewMonth --> MonthModal: Show Details
    MonthModal --> DisplayData: Close Modal
    
    %% Filter Flow
    FilterData --> ApplyFilters: Update Filter State
    ApplyFilters --> DisplayData: Show Filtered Results
    
    %% Import/Export Flow
    ExportData --> GenerateJSON: Create File
    ImportData --> ParseJSON: Validate Format
    ParseJSON --> MergeData: Avoid Duplicates
    MergeData --> UpdateStatistics: Recalculate
    GenerateJSON --> DisplayData: Download Complete
    
    %% Transport Default Flow
    TransportSetting --> UpdateDefault: Set New Value
    UpdateDefault --> ApplyToYear: Update All Year Entries
    ApplyToYear --> UpdateStatistics: Recalculate
```
## Performance & Optimization

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: mc
---
graph LR
    subgraph "🚀 Performance Optimizations"
        MEMO[React.memo<br/>Component Memoization]
        CALLBACK[useCallback<br/>Function Memoization]
        USEMEMO[useMemo<br/>Value Memoization]
        DEBOUNCE[Debounced Search<br/>Input Optimization]
    end
    
    subgraph "⚡ Data Optimizations"
        FILTER[Client-side Filtering<br/>No API calls]
        LAZY[Lazy Loading<br/>Component Splitting]
        CACHE[LocalStorage Caching<br/>Persistence Layer]
        BATCH[Batch Updates<br/>Reduce Re-renders]
    end
    
    subgraph "🎯 User Experience"
        LOADING[Loading States<br/>Visual Feedback]
        ERROR[Error Boundaries<br/>Graceful Degradation]
        RESPONSIVE[Responsive Design<br/>Mobile Optimized]
        VALIDATION[Real-time Validation<br/>Immediate Feedback]
    end
    
    MEMO --> BATCH
    CALLBACK --> BATCH
    USEMEMO --> BATCH
    DEBOUNCE --> FILTER
    FILTER --> CACHE
    LAZY --> LOADING
    CACHE --> ERROR
    BATCH --> RESPONSIVE
    VALIDATION --> RESPONSIVE
```

## Technology Stack

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: mc
---v
graph TB
    subgraph "🏗️ Development Stack"
        subgraph "Frontend"
            REACT[React 18.3.1<br/>UI Library]
            TS[TypeScript 5.5.3<br/>Type Safety]
            VITE_BUILD[Vite 5.4.2<br/>Build Tool]
        end
        
        subgraph "Styling"
            TAILWIND[Tailwind CSS 3.4.1<br/>Utility-first CSS]
            LUCIDE[Lucide React 0.344.0<br/>Icon Library]
            RESPONSIVE[Responsive Design<br/>Mobile-first]
        end
        
        subgraph "Development Tools"
            ESLINT[ESLint 9.9.1<br/>Code Linting]
            POSTCSS[PostCSS 8.4.35<br/>CSS Processing]
            AUTOPREFIXER[Autoprefixer 10.4.18<br/>CSS Compatibility]
        end
        
        subgraph "Data & Storage"
            LOCALSTORAGE[Browser localStorage<br/>Data Persistence]
            JSON_FORMAT[JSON Export/Import<br/>Data Portability]
            CLIENT_STATE[Client-side State<br/>No External DB]
        end
    end
    
    REACT --> TS
    TS --> VITE_BUILD
    TAILWIND --> POSTCSS
    POSTCSS --> AUTOPREFIXER
    LUCIDE --> REACT
    ESLINT --> TS
    LOCALSTORAGE --> JSON_FORMAT
    JSON_FORMAT --> CLIENT_STATE
```

This comprehensive Mermaid diagram system provides a complete overview of the Salary Management System, including:

1. **System Overview**: High-level architecture and component relationships
2. **Data Flow**: Sequence diagrams showing user interactions and data flow
3. **Component Interactions**: Detailed flowchart of user actions and system responses
4. **Type System**: Entity-relationship diagram of the data structure
5. **Business Logic**: State machine showing application states and transitions
6. **Feature Analysis**: Mind map of system complexity and features
7. **Performance**: Optimization strategies and techniques
8. **Technology Stack**: Complete development and runtime environment

The system demonstrates a sophisticated multi-category financial management application with type-safe operations, intelligent validation, and a modern React architecture.