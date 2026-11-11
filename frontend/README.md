# Typeform Clone Frontend

A Next.js (App Router, TypeScript, Tailwind CSS, Framer Motion) frontend for the Typeform Clone.

## Features

- **Public Respondent Flow (`/f/[slug]`)**:
  - Full-screen, conversational one-question-at-a-time experience.
  - **Framer Motion slide transitions**: Smooth vertical sliding between questions based on direction.
  - **Keyboard Navigation**:
    - `Enter`: Advances to the next question or submits when on the final question.
    - `ArrowDown` / `PageDown`: Navigate forward.
    - `ArrowUp` / `PageUp`: Navigate backward.
    - Letter keys (`A`, `B`, `C`, etc.): Pick multiple choice or single choice options directly.
    - Number keys (`1` through `5`/`10`): Pick ratings directly.
  - **Progress Bar**: Smooth animated bar tracking form completion at the top.
  - **Client-Side Validation**: Immediate feedback on required questions, email format, numeric bounds, choice options, and ratings.
  - **Server-Side Validation Handling**: Captures FastAPI 422 errors, navigates back to the erroneous question, and presents the error inline.
  - **Custom Form Theming**: Dynamically applies form colors (`primary_color`, `background_color`, `text_color`, `font`).
  - **Celebratory Thank-You Screen**: Confetti celebration and custom completion message with optional action link.

---

## Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- pnpm (recommended) or npm

### 2. Install Dependencies
```bash
cd frontend
pnpm install
```

### 3. Environment Configuration
The API endpoint defaults to `http://127.0.0.1:8000`. You can configure it in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Routes

- `/`: Home page with live links to test seeded forms.
- `/f/product-feedback`: Public respondent flow for the Product Feedback Survey.
- `/f/developer-experience`: Public respondent flow for the Developer Experience Survey.
- `/f/[slug]`: Public respondent flow for any published form.
