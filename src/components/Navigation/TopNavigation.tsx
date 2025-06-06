'use client'

import React from 'react'

interface NavItem {
  label: string
  onClick: () => void
  title?: string
  isActive?: boolean
}

const TopNavigation: React.FC = () => {
  const navItems: NavItem[] = [
    {
      label: 'Modeler X v1.0',
      onClick: () => window.open('https://github.com/your-repo/modeler-x', '_blank'),
      title: 'GitHub Repository'
    },
    {
      label: 'Save Project',
      onClick: () => console.log('Save Project'),
      title: 'Save Project to .json'
    },
    {
      label: 'Load Project', 
      onClick: () => console.log('Load Project'),
      title: 'Load Project from .json'
    },
    {
      label: 'Save STEP',
      onClick: () => console.log('Save STEP'),
      title: 'Export as STEP file'
    },
    {
      label: 'Save STL',
      onClick: () => console.log('Save STL'),
      title: 'Export as STL file'
    },
    {
      label: 'Save OBJ',
      onClick: () => console.log('Save OBJ'),
      title: 'Export as OBJ file'
    },
    {
      label: 'Import STEP/IGES/STL',
      onClick: () => console.log('Import Files'),
      title: 'Import STEP, IGES, or (ASCII) STL from File'
    },
    {
      label: 'Clear Imported Files',
      onClick: () => console.log('Clear Files'),
      title: 'Clears the external step/iges/stl files stored in the project.'
    },
  ]

  return (
    <nav 
      className="overflow-hidden"
      style={{ backgroundColor: 'var(--modeler-nav-bg)' }}  // v0: #111
    >
      <div className="flex">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            title={item.title}
            className={`
              float-left text-center px-4 py-1 no-underline text-sm font-console
              transition-colors duration-150
            `}
            style={{
              color: 'var(--modeler-nav-text)',                    // v0: #f2f2f2
              fontFamily: 'Consolas',                              // v0: Consolas
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--modeler-nav-hover-bg)'  // v0: #aaa
              e.currentTarget.style.color = 'var(--modeler-nav-hover-text)'          // v0: black
            }}
            onMouseLeave={(e) => {
              if (!item.isActive) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--modeler-nav-text)'             // v0: #f2f2f2
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default TopNavigation 