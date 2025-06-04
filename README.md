# OpenCascade.js Demo with Three.js, Next.js and TypeScript

This is a [Next.js](https://nextjs.org/) project showcasing [OpenCascade.js](https://ocjs.org/) integration with [Three.js](https://threejs.org/) rendering, fully implemented in TypeScript.

## ✨ Features

- **Three.js Rendering**: High-performance WebGL-based 3D visualization
- **OpenCascade.js Integration**: Advanced CAD geometry processing
- **Interactive Controls**: Orbit controls for camera manipulation
- **TypeScript**: Full type safety and developer experience
- **Next.js 14**: Modern React framework with App Router
- **CascadeStudio**: Full-featured CAD environment with code editor, 3D viewport and GUI

## CascadeStudio Migration

This project includes a complete migration of [CascadeStudio](https://github.com/zalo/CascadeStudio) to Next.js 14, TypeScript, and React 18. The migration process is documented in the `docs/` directory:

1. **Phase 1-6**: Basic migration and feature implementation
2. **Phase 7**: Code quality improvements and performance optimization

### CascadeStudio Features

- **Code Editor**: Monaco Editor with syntax highlighting and code completion
- **3D Viewport**: Three.js-based viewing with orbit controls
- **GUI Panel**: Parameter controls using Tweakpane
- **URL State Management**: Share designs via URL
- **Import/Export**: Support for STEP, STL, OBJ formats
- **WebWorker Processing**: OpenCascade.js runs in a worker thread for better performance

### How to Use CascadeStudio

1. Navigate to `/cascade-studio` route
2. Write JavaScript code using the OpenCascade.js API in the editor
3. Use the GUI panel to control parameters
4. Export your models in various formats
5. Share your designs via URL

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
- `npm run test:e2e` - Run Playwright end-to-end tests

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── cascade-studio/    # CascadeStudio page
├── components/            # React components
│   ├── cad/               # CAD-specific components
│   ├── threejs/           # Three.js components
│   ├── layout/            # Layout components
│   └── gui/               # GUI components
├── hooks/                 # Custom React hooks
│   └── useCADWorker.ts    # CAD worker hook
├── lib/                   # Library code
│   ├── cad/               # CAD utilities
│   └── layout/            # Layout utilities
├── public/                # Static files
│   └── workers/           # Web workers
└── types/                 # TypeScript type definitions
```

## Architecture

### Three.js Rendering Pipeline
1. **OpenCascade.js**: Generates 3D geometry using CAD operations
2. **WebWorker**: Processes CAD operations in a background thread
3. **Three.js**: Renders 3D models with WebGL
4. **React Three Fiber**: React integration for Three.js

### CascadeStudio Architecture
1. **Monaco Editor**: Code editing with syntax highlighting
2. **CAD Worker**: Processes OpenCascade.js operations
3. **Three.js Viewport**: 3D visualization of CAD models
4. **Tweakpane GUI**: Parameter controls

## Technologies Used

- [Next.js 14.2.5](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Three.js 0.160.0](https://threejs.org/) - 3D rendering
- [React Three Fiber 8.15.12](https://docs.pmnd.rs/react-three-fiber) - React integration
- [React Three Drei 9.92.7](https://github.com/pmndrs/drei) - Three.js utilities
- [OpenCascade.js](https://ocjs.org/) - CAD geometry processing
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Tweakpane](https://tweakpane.github.io/docs/) - GUI controls
- [Golden Layout](http://golden-layout.com/) - Multi-panel layout
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
