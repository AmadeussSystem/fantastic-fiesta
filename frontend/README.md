# Fantastic Fiesta Frontend

A stunning, modern frontend for the DSA Learning Roadmap project built with **SolidJS** and **UnoCSS** - inspired by the beautiful design of the NvChad website.

## ✨ Features

- 🎨 **Beautiful Dark Theme** - Sleek, modern dark mode design with gradient accents
- ⚡ **Blazing Fast** - SolidJS provides exceptional performance with fine-grained reactivity
- 🎭 **Smooth Animations** - Intersection observer-based scroll animations
- 📱 **Fully Responsive** - Looks great on all devices
- 🎯 **Interactive Roadmap** - Phase-based DSA learning tracker
- 🔄 **Sync Feature Showcase** - Visualizes the auto-sync functionality

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 🛠️ Tech Stack

- **[SolidJS](https://solidjs.com)** - A declarative, efficient, and flexible JavaScript library
- **[UnoCSS](https://unocss.dev)** - Instant On-demand Atomic CSS Engine
- **[Vite](https://vitejs.dev)** - Next Generation Frontend Tooling

## 📁 Project Structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Navbar.tsx      # Navigation bar
│   │   ├── Hero.tsx        # Hero section
│   │   ├── Features.tsx    # Features grid
│   │   ├── Stats.tsx       # Statistics section
│   │   ├── Roadmap.tsx     # DSA roadmap tracker
│   │   ├── SyncFeature.tsx # Sync feature showcase
│   │   └── Footer.tsx      # Footer component
│   ├── styles/
│   │   └── global.css      # Global styles
│   ├── App.tsx             # Main app component
│   └── index.tsx           # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── uno.config.ts           # UnoCSS configuration
└── vite.config.ts          # Vite configuration
```

## 🎨 Design System

### Colors

- **Primary**: Indigo (#6366f1)
- **Accent**: Purple, Pink, Green, Cyan, Orange
- **Background**: Dark slate tones

### Typography

- **Sans**: Inter (400-800)
- **Mono**: JetBrains Mono (400-600)

## 📝 License

MIT
