# Yarimart-Website

Yarimart-Website is an open-source web application developed by YarimaGroup. This repository contains the codebase for the Yarimart e-commerce platform, designed to provide a modern, scalable, and customizable online store experience.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## About

Yarimart-Website is intended as a foundational e-commerce website that can be adapted for various business needs. The project aims to deliver a fast, responsive, and user-friendly online shopping experience. It is built with modern JavaScript tooling and follows best practices for web development.

---

## Features

- Modern, responsive design
- Built with TypeScript for type safety and maintainability
- Utilizes Tailwind CSS for flexible and efficient styling
- Fast development workflow using Vite
- Easily customizable and extendable codebase
- Admin panel for managing products, orders, and customers
- Secure authentication and authorization
- Real-time data synchronization

---

## Tech Stack

- **Frontend Framework:** React (with TypeScript)
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Linting:** ESLint
- **Package Management:** npm
- **Database:** Supabase
- **Authentication:** Supabase Auth
- **Deployment:** Netlify

---

## Getting Started

Follow these steps to set up the project locally:

1. **Clone the repository**
```bash
git clone https://github.com/Jishnulal7/Yarimart
cd Yarimart-Website
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Copy the `.env.example` file to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```
Then edit the `.env` file with your Supabase URL, anon key, and service role key.

4. **Run the development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

6. **Preview the production build**
```bash
npm run preview
```

---

## Environment Setup

The application requires the following environment variables:

### Required for all environments:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

### Required for admin operations:
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

### How to find your Supabase keys:
1. Go to [app.supabase.io](https://app.supabase.io)
2. Select your project
3. Go to Project Settings → API
4. Copy the Project URL and anon public key

---

## Deployment

### Netlify Deployment

This project is configured for easy deployment on Netlify. Follow these steps:

1. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - The build settings are automatically configured via `netlify.toml`

2. **Configure Environment Variables**
   - Go to your Netlify dashboard
   - Select your site
   - Navigate to Site settings → Environment variables
   - Add the following variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key

3. **Deploy**
   - Push your code to GitHub
   - Netlify will automatically build and deploy your site

### Important Notes:
- Environment variables from `.env` files are NOT automatically available in production
- Always configure environment variables in your deployment platform's dashboard
- Never commit `.env` files to version control for security reasons

---

## Admin Setup

To set up admin users for the admin panel:

1. **Configure environment variables** (see Environment Setup section)

2. **Run the admin setup script**
```bash
npm run setup-admins
```

3. **Admin email addresses** are configured in the application. Contact support to add new admin emails.

---

## Folder Structure

- `/public` — Static assets
- `/src` — Source code (components, pages, utilities, etc.)
  - `/components` — Reusable React components
  - `/pages` — Page components
  - `/context` — React context providers
  - `/hooks` — Custom React hooks
  - `/utils` — Utility functions
  - `/types` — TypeScript type definitions
- `/supabase` — Database migrations and functions
- `.bolt` — Configuration or environment files
- `index.html` — Main HTML entry point
- `package.json` — Project metadata and dependencies
- `tailwind.config.js` — Tailwind CSS configuration
- `vite.config.ts` — Vite configuration
- `netlify.toml` — Netlify deployment configuration

---

## Troubleshooting

### Common Issues:

1. **"Authentication service requires configuration" error**
   - This usually means environment variables are not set in your deployment platform
   - For Netlify: Go to Site settings → Environment variables and add your Supabase keys
   - For local development: Ensure your `.env` file has the correct values

2. **Admin panel not accessible**
   - Run `npm run setup-admins` to configure admin users
   - Ensure your email is in the admin whitelist
   - Check that environment variables are properly configured

3. **Build failures**
   - Ensure all environment variables are set in your deployment platform
   - Check that all dependencies are properly installed
   - Verify Node.js version compatibility (18+)

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request to help improve the project. For major changes, please open an issue first to discuss what you would like to change.

---

## License

This project is licensed under the Apache License 2.0.

---

## Contact

For questions or support, please open an issue in this repository.

---

*This README was last updated on December 20, 2024.*

> _A well-crafted README helps others understand, use, and contribute to your project. For more tips, see GitHub's README guidelines and community templates_.