# OpenCascade.js Demo with Next.js and TypeScript

This is a [Next.js](https://nextjs.org/) project showcasing [OpenCascade.js](https://ocjs.org/) integration, now fully migrated to TypeScript.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
├── pages/              # Next.js pages (Pages Router)
│   ├── api/           # API routes
│   ├── _app.tsx       # App component
│   └── index.tsx      # Home page
├── components/         # React components
│   └── OCJSViewport.tsx
├── lib/               # Library code
│   └── shapeToUrl.ts
├── styles/            # CSS styles
├── public/            # Static files
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## TypeScript Configuration

This project uses TypeScript with strict mode enabled. The configuration can be found in `tsconfig.json`.

## Technologies Used

- [Next.js 12.1.5](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [React 18](https://reactjs.org/)
- [OpenCascade.js](https://ocjs.org/)
- [@google/model-viewer](https://modelviewer.dev/)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [OpenCascade.js Documentation](https://ocjs.org/docs)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
