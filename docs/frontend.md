# Frontend Documentation

## Project Structure

### Key Directories
- `/app`: Main application directory (Next.js 13+)
  - `layout.tsx`: Common layout wrapper
  - `page.tsx`: Main homepage
  - `globals.css`: Global styles
- `/components`: Reusable UI components
- `/hooks`: Custom React hooks
- `/lib`: Utility functions and configurations
- `/styles`: Additional styling
- `/public`: Static assets

## Technologies Used

### Core Technologies
1. **Next.js**
   - Server-side rendering
   - File-based routing
   - API routes
   - Built-in optimization features

2. **Tailwind CSS**
   - Utility-first CSS framework
   - Customizable through `tailwind.config.ts`

3. **Radix UI**
   - Accessible, unstyled components
   - Building blocks for consistent UI

### Development Environment
- Docker containerization
- MongoDB integration
- PNPM package manager

## Development Guide

### Getting Started
```bash
# Initialize project
make init

# Development server
make dev

# Stop services
make down

# View logs
make logs

# Reset project
make reset
```

### Key Areas for Improvement

#### 1. Performance Optimization
```typescript
// Image optimization
import Image from 'next/image'

// Proper usage
<Image 
  src="/image.jpg" 
  width={500} 
  height={300} 
  alt="Description" 
  priority={true} // For important images
/>

// Loading states
import { Suspense } from 'react'

<Suspense fallback={<LoadingSpinner />}>
  <YourComponent />
</Suspense>
```

#### 2. State Management
```typescript
// Local state
const [data, setData] = useState()

// Global state example with Context
const DataContext = createContext()

export function DataProvider({ children }) {
  const [data, setData] = useState()
  return (
    <DataContext.Provider value={{ data, setData }}>
      {children}
    </DataContext.Provider>
  )
}
```

#### 3. API Integration
```typescript
// /app/api/example/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await fetchData()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' }, 
      { status: 500 }
    )
  }
}
```

#### 4. Error Handling
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false }
  
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorComponent />
    }
    return this.props.children
  }
}
```

### Best Practices

#### Component Organization
