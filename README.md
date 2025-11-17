# Mujthaba's Portfolio Website

A modern, responsive portfolio website showcasing my skills, projects, and expertise in Java Spring Boot, Angular, TypeScript, JavaScript, and CSS.

## Features

- 🎨 Modern, responsive design with smooth animations
- 📄 Resume PDF viewer in modal popup
- 💼 Projects showcase with GitHub links
- 🚀 Skills and expertise sections
- 📧 Direct contact via email
- ☕ Buy Me a Coffee integration
- 🔗 Social media links (LinkedIn, GitHub, Telegram)

## Tech Stack

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Project Structure

```
mj-portfolio/
├── public/
│   └── Resume Mujthaba Resume.pdf
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Skills.tsx
│   │   ├── Expertise.tsx
│   │   ├── Projects.tsx
│   │   ├── Footer.tsx
│   │   └── ResumeModal.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Customization

To customize the portfolio:

1. Update social links in `src/components/Header.tsx`
2. Modify project data in `src/components/Projects.tsx`
3. Update skills and expertise in respective component files
4. Change colors in `tailwind.config.js`
5. Update Buy Me a Coffee link in `src/components/Footer.tsx`

## License

© 2024 Mujthaba Mandayen Kandi. All rights reserved.
