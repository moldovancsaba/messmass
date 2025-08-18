# MessMass - Real-time Event Statistics Dashboard

A professional real-time collaborative event statistics platform with advanced analytics, hashtag system, and comprehensive admin panel. Built with Next.js 15, React 18, TypeScript, and MongoDB.

## 🎯 Features

### Core Functionality
- 📊 **Real-time Event Statistics** - Live collaborative editing with WebSocket synchronization
- 🔐 **Admin Dashboard** - Password-protected management interface with hashtag overview
- 📈 **Advanced Analytics** - Core Fan Team metric and 5-metric engagement analysis
- 🏷️ **Hashtag System** - Project categorization with aggregated statistics and navigation
- 📱 **Responsive Design** - Optimized for mobile, tablet, and desktop
- 🎨 **Professional UI** - Glass-card effects with gradient backgrounds
- 💾 **MongoDB Integration** - Cloud database with automatic persistence

### Enhanced Chart System
- 👥 **Gender/Age Demographics** - Visual pie charts with emoji centers
- 📍 **Location Analytics** - Remote vs Event fan distribution
- 🛍️ **Merchandise Tracking** - Potential sales calculations
- 🌐 **Traffic Sources** - QR codes, short URLs, and web visits
- 💰 **Value Metrics** - Advertisement value breakdown (CPM, eDM, Ads, U40 Eng., Branding)
- 🎯 **Core Fan Team** - Advanced engagement metric: (merched/fans) × event attendees
- 📅 **Chart Export** - High-quality PNG downloads
- ⚙️ **Chart Algorithm Manager** - Admin interface for customizing chart formulas and configurations
- 🔄 **Dynamic Chart System** - Data-driven chart rendering with configurable calculations

### Hashtag System
- 🏷️ **Project Tagging** - Add up to 5 hashtags per project for easy categorization
- 📈 **Hashtag Overview** - Visual dashboard showing all hashtags with project counts
- 🔗 **Aggregated Statistics** - Combined analytics from all projects sharing the same hashtag
- 📊 **Cross-Project Analysis** - Compare performance across related events
- 📅 **Date Range Aggregation** - Shows time span from oldest to newest project per hashtag
- 🔄 **Real-time Updates** - Hashtag counts update automatically when projects change

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed on your system
- MongoDB Atlas account (for database)
- Railway account (for WebSocket server deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/moldovancsaba/messmass.git
cd messmass
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env.local`:
```bash
MONGODB_URI=your_mongodb_atlas_connection_string
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com
ADMIN_PASSWORD=your_secure_admin_password
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the main dashboard
6. Access admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

## 📜 Available Scripts

- `npm run dev` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm run start` - Runs the built app in production mode
- `npm run lint` - Runs ESLint for code quality
- `npm run type-check` - TypeScript validation without emitting files
- `npm run export` - Export static files (if needed)
- `npm run clean` - Remove .next and out directories

## 🏗️ Project Structure

```
messmass/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── login/
│   │   │       └── route.ts        # Admin authentication API
│   │   ├── chart-config/
│   │   │   └── route.ts            # Chart configuration CRUD API
│   │   ├── hashtags/
│   │   │   ├── route.ts            # Hashtag management API
│   │   │   └── [hashtag]/
│   │   │       └── route.ts        # Aggregated hashtag statistics
│   │   └── projects/
│   │       ├── route.ts            # CRUD operations with hashtag support
│   │       └── stats/[slug]/
│   │           └── route.ts        # Public stats viewing
│   ├── admin/
│   │   ├── page.tsx               # Admin dashboard with hashtag overview
│   │   ├── charts/
│   │   │   └── page.tsx           # Chart Algorithm Manager
│   │   └── login/
│   │       └── page.tsx           # Admin login form
│   ├── hashtag/
│   │   └── [hashtag]/
│   │       └── page.tsx           # Aggregated hashtag statistics page
│   ├── stats/[slug]/
│   │   └── page.tsx               # Public stats viewing
│   ├── globals.css                # Main CSS entry point
│   ├── theme.css                  # Design tokens and variables
│   ├── components.css             # Reusable UI components
│   ├── layout.css                 # Layout utilities and grids
│   ├── admin.css                  # Admin-specific styles
│   ├── charts.css                 # Chart visualization styles
│   ├── layout.tsx                 # App layout
│   └── page.tsx                   # Main event dashboard
├── components/
│   ├── AdminDashboard.tsx         # Admin dashboard with hashtag overview
│   ├── ChartAlgorithmManager.tsx  # Chart config management
│   ├── DynamicChart.tsx           # Dynamic chart renderer
│   ├── HashtagInput.tsx           # Hashtag input component
│   └── StatsCharts.tsx            # Chart visualization components
├── lib/
│   ├── auth.ts                    # Authentication utilities
│   ├── mongodb.ts                 # Database connection
│   ├── chartCalculator.ts         # Chart calculation engine
│   └── formulaParser.ts           # Formula parsing utilities
├── server/
│   └── websocket-server.js        # Railway WebSocket server
├── middleware.ts                  # Admin route protection
├── .env.local                     # Environment configuration
├── package.json                   # v1.4.0 with hashtag system
├── CSS_ARCHITECTURE.md            # Design system documentation
└── memory.md                      # Project documentation
```

## 🌐 Live Demo

**Production Application**: [https://messmass.doneisbetter.com](https://messmass.doneisbetter.com)
**Admin Dashboard**: [https://messmass.doneisbetter.com/admin](https://messmass.doneisbetter.com/admin)

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `MONGODB_URI`
   - `NEXT_PUBLIC_WS_URL` 
   - `ADMIN_PASSWORD`
3. Deploy automatically from main branch

### WebSocket Server (Railway)
1. Deploy `server/websocket-server.js` to Railway
2. Set `PORT` environment variable
3. Update `NEXT_PUBLIC_WS_URL` with Railway WebSocket URL

### Database (MongoDB Atlas)
1. Create MongoDB Atlas cluster
2. Set up database user and connection string
3. Configure IP whitelist for production access

## 🛠️ Technologies Used

### Core Framework
- [Next.js 15.4.6](https://nextjs.org/) - React framework with App Router
- [React 18.3.1](https://reactjs.org/) - JavaScript library for building user interfaces
- [TypeScript 5.6.3](https://www.typescriptlang.org/) - Typed JavaScript

### Database & Real-time
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Cloud database
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time communication
- [Railway](https://railway.app/) - WebSocket server hosting

### Authentication & Security
- Password-based admin authentication
- Session management with HTTP-only cookies
- Environment variable configuration

### Visualization & Export
- [html2canvas](https://html2canvas.hertzen.com/) - Chart export functionality
- Custom SVG chart rendering
- Professional data visualization components

## 📊 Core Features

### Real-time Collaboration
- Multi-user editing with live synchronization
- WebSocket-based instant updates
- Automatic reconnection with error recovery
- Project-based collaboration rooms

### Advanced Analytics
- **Core Fan Team Metric**: Calculate highly engaged stadium projection
- **5-Metric Engagement System**: Engaged, Interactive, Front-runners, Fanaticals, Casuals
- **Value Analysis**: CPM, eDM, Ads, U40 Engagement, Branding calculations
- **Demographics**: Gender, age, and location breakdowns
- **Traffic Sources**: QR codes, short URLs, web visits

### Admin Dashboard
- Password-protected management interface
- Complete project overview and statistics
- CSV export functionality
- Real-time monitoring and system status
- Professional chart visualizations with PNG export
- **Chart Algorithm Manager** - Configure chart formulas, labels, and calculations
- **Dynamic Chart System** - Create and modify chart algorithms with live preview
- **Hashtag Overview** - Visual dashboard of all hashtags with project counts and navigation
- **Aggregated Reporting** - Cross-project analytics via hashtag categorization

## 🎯 Chart System

### Visual Design
- **Pie Charts**: Large emoji centers (👥📍🌐) with clean legends
- **Horizontal Bars**: Color-coded with value displays
- **Organized Layout**: Logical grouping in rows
  - Row 1: Merchandise, Engagement, Value
  - Row 2: Gender Distribution, Age Groups
  - Row 3: Location, Sources

### Key Metrics
- **Core Fan Team**: `(merched fans / total fans) × event attendees`
- **Potential Merch Sales**: `(total fans - merched fans) × €10`
- **Advertisement Value**: Multi-factor calculation for marketing ROI
- **Engagement Percentages**: Real-time fan interaction analysis

## 🎨 CSS Architecture

MessMass features a modular CSS design system for maintainability and performance:

### Design System Structure
- **`theme.css`** - Design tokens, CSS variables, color palettes, typography scales
- **`components.css`** - Reusable UI components (buttons, cards, forms, typography)
- **`layout.css`** - Grid systems, flexbox utilities, responsive containers
- **`charts.css`** - Chart-specific styles and animations
- **`admin.css`** - Admin dashboard specific styling
- **`globals.css`** - Main entry point with imports and base styles

### Modular Loading
- CSS files are imported per-page for optimal performance
- Admin pages load only admin-specific styles
- Chart pages load chart visualization styles
- Consistent design tokens across all modules

For detailed CSS architecture documentation, see [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md).

## 📈 Version History

- **v1.4.0** - Hashtag system implementation with overview dashboard and aggregated statistics
- **v1.3.0** - Major CSS architecture refactor with modular design system
- **v1.2.0** - Chart Algorithm Manager and dynamic chart system
- **v1.1.0** - MongoDB integration improvements and error handling
- **v1.0.3** - Enhanced chart system with Core Fan Team metric
- **v1.0.2** - html2canvas integration and chart exports
- **v1.0.1** - Admin dashboard and authentication system
- **v1.0.0** - Initial production release

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Csaba Moldovan - [moldovancsaba@gmail.com](mailto:moldovancsaba@gmail.com)
