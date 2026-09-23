# 🍛 Sri Ganapathi Catering Platform

A modern, scalable catering services platform featuring multilingual support (English & Tamil), built with a microservices-ready monorepo architecture.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📁 Project Structure

This monorepo is architected for independent microservice deployment:

```
ganapathi-catering-platform/
├── frontend/              # Next.js web application
│   ├── app/              # Next.js App Router (pages & layouts)
│   ├── components/       # Reusable React components
│   │   ├── home/        # Home page sections
│   │   └── layout/      # Layout components (Header, Footer, Nav)
│   ├── i18n/            # Internationalization configuration
│   ├── messages/        # Translation files (en.json, ta.json)
│   ├── public/          # Static assets (images, logos)
│   └── package.json     # Frontend dependencies
├── backend/             # (Planned) API services & business logic
├── documentations/      # Business plans & technical docs
├── legacy_prototype/    # Original HTML/CSS/JS prototype
└── LOGOS/              # Brand assets & marketing materials
```

---

## 🚀 Frontend Application

### Features

- ✅ **Multilingual Support**: Seamless English ↔ Tamil language switching
- ✅ **Modern Stack**: Next.js 16 with React 19 and TypeScript
- ✅ **Responsive Design**: Mobile-first approach with Tailwind CSS 4
- ✅ **SEO Optimized**: Server-side rendering for better search visibility
- ✅ **Component-Based**: Modular architecture for maintainability
- ✅ **Internationalization**: Powered by next-intl

### Quick Start

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

🌐 Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint for code quality checks |

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.3 (App Router) |
| **UI Library** | React 19.2 |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4.x |
| **i18n** | next-intl 4.14 |
| **Build Tool** | SWC (Rust-based compiler) |

---

## 🔮 Backend Services (Roadmap)

Planned microservices architecture:

- 🔧 **API Gateway**: RESTful/GraphQL endpoints
- 🤖 **AI Service**: Intelligent menu recommendations & chatbot
- 💾 **Database Layer**: Bookings, orders, customer data
- 🔐 **Auth Service**: User authentication & authorization
- 📧 **Notification Service**: Email/SMS confirmations
- 📊 **Analytics Service**: Business intelligence & reporting

---

## 🌐 Deployment Strategy

### Frontend Deployment

**Recommended Platforms:**
- **Vercel** (Optimal for Next.js) - [Deploy Now](https://vercel.com)
- **Netlify** - Serverless edge functions
- **AWS Amplify** - Full-stack deployment
- **Google Cloud Run** - Container-based hosting

**Configuration:**
```bash
# Build output directory
frontend/.next/

# Environment variables
NEXT_PUBLIC_API_URL=https://api.ganapathicatering.com
```

### Backend Deployment (Future)

**Microservices Platforms:**
- **AWS ECS/EKS** - Container orchestration
- **Google Kubernetes Engine** - Scalable microservices
- **Azure Container Apps** - Serverless containers
- **Railway/Render** - Simple PaaS deployment

**Docker Support:**
Each service can be containerized independently:
```bash
# Example structure
backend/
├── api-gateway/Dockerfile
├── ai-service/Dockerfile
└── database-service/Dockerfile
```

---

## 🛠️ Development Guidelines

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Git**: Latest version

### Local Development Workflow

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhinakaran311/ganapathi-catering-platform.git
   cd ganapathi-catering-platform
   ```

2. **Setup frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Create a new branch for features**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforce code quality
- **Prettier**: Code formatting (recommended)
- **Conventional Commits**: Use semantic commit messages

---

## 📂 Additional Resources

- **Legacy Prototype**: `legacy_prototype/` - Original HTML/CSS implementation
- **Business Docs**: `documentations/` - Business plan & strategy documents
- **Brand Assets**: `LOGOS/` - Official logos in multiple sizes

---

## 📄 License

This is a private business project for **Sri Ganapathi Catering Services**.

© 2026 Sri Ganapathi Catering. All rights reserved.

---

## 🤝 Contact

For business inquiries or technical support, please contact through our official channels.

**Built with ❤️ for authentic South Indian catering experiences**
