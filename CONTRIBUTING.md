# Contributing to CampusOS AI

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. Be kind, be helpful, assume good faith.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment** (OS, Node version, browser)

### Suggesting Enhancements

Open an issue with the `enhancement` label. Include:
- Clear description of the feature
- Why it would be useful
- Possible implementation approach

### Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run `npm run build` to ensure no type errors
5. Write clear commit messages
6. Push and open a PR

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/campusos-ai.git
cd campusos-ai
npm install
cp .env.local.example .env.local
npx prisma db push
npm run dev
```

## Style Guide

- TypeScript strict mode (no `any` unless interface requires)
- 2-space indentation
- Functional React components with hooks
- Tailwind CSS for styling
- Use existing UI components from `src/components/ui/`
- Toast notifications for all async actions (sonner)
- Loading states for all API calls

## Project Structure

```
src/
├── app/          # Next.js App Router pages + API routes
├── components/   # Reusable UI components
└── lib/          # Business logic (AI, storage, auth, types)
```

## Questions?

Open a GitHub Discussion or email the maintainer.

---

**Happy hacking!** 🚀
