# OpenCascade.js Demo with Three.js, Next.js and TypeScript

This is a [Next.js](https://nextjs.org/) project showcasing [OpenCascade.js](https://ocjs.org/) integration with [Three.js](https://threejs.org/) rendering, fully implemented in TypeScript.

## ✨ Features

- **Three.js Rendering**: High-performance WebGL-based 3D visualization
- **OpenCascade.js Integration**: Advanced CAD geometry processing
- **Interactive Controls**: Orbit controls for camera manipulation
- **TypeScript**: Full type safety and developer experience
- **Next.js 14**: Modern React framework with App Router

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
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── threejs/           # Three.js components
│   │   ├── ThreeJSViewport.tsx
│   │   └── ThreeJSModel.tsx
│   ├── ui/                # UI components
│   │   └── LoadingSpinner.tsx
│   └── OCJSViewport.tsx   # Legacy component (preserved)
├── hooks/                 # Custom React hooks
│   └── useOpenCascade.ts
├── lib/                   # Library code
│   ├── threejs/           # Three.js utilities
│   └── shapeToUrl.ts      # OpenCascade to GLB conversion
├── docs/                  # Documentation
│   └── 4_convert_threejs/ # Migration documentation
├── public/                # Static files
└── types/                 # TypeScript type definitions
```

## Architecture

### Three.js Rendering Pipeline
1. **OpenCascade.js**: Generates 3D geometry using CAD operations
2. **GLB Conversion**: Converts geometry to GLB format via `shapeToUrl`
3. **Three.js**: Renders GLB models with WebGL
4. **React Three Fiber**: React integration for Three.js

### Key Components
- **ThreeJSViewport**: Main 3D viewport with lighting and controls
- **ThreeJSModel**: GLTF/GLB model renderer with material optimization
- **useOpenCascade**: Hook managing OpenCascade.js initialization and shape generation

## Technologies Used

- [Next.js 14.2.5](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Three.js 0.160.0](https://threejs.org/) - 3D rendering
- [React Three Fiber 8.15.12](https://docs.pmnd.rs/react-three-fiber) - React integration
- [React Three Drei 9.92.7](https://github.com/pmndrs/drei) - Three.js utilities
- [OpenCascade.js](https://ocjs.org/) - CAD geometry processing
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [DaisyUI](https://daisyui.com/) - UI components

## Migration History

This project has been migrated from `@google/model-viewer` to Three.js for enhanced performance and customization. The migration documentation can be found in `docs/4_convert_threejs/`.

**Migration completed**: June 2024

## Learn More

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenCascade.js Documentation](https://ocjs.org/docs)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
