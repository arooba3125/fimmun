"use client";

import React, { useEffect, useState } from 'react';

// Client wrapper that dynamically imports the real Navigation component at runtime.
// While loading (or if import fails) we render a minimal accessible fallback navigation
// to avoid crashing the entire page.
export default function NavigationClient() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let mounted = true;
    import('./Navigation')
      .then((mod) => {
        const resolved = (mod && (((mod as unknown) as { default?: React.ComponentType }).default || (mod as unknown) as React.ComponentType)) as React.ComponentType | null;
        if (!mounted) return;
        if (resolved) {
          setComp(() => resolved);
        } else {
          // eslint-disable-next-line no-console
          console.error('Navigation module imported but did not resolve to a component:', mod);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to dynamically import Navigation component:', err);
      });

    return () => { mounted = false; };
  }, []);

  if (Comp) {
    const C = Comp as React.ComponentType;
    return <C />;
  }

  // Minimal fallback nav while the real component loads or if it fails.
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">FIMMUN</h1>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <a href="#about" className="text-gray-700 hover:text-blue-600">About</a>
            <a href="#committees" className="text-gray-700 hover:text-blue-600">Committees</a>
            <a href="#registration" className="px-4 py-2 bg-blue-600 text-white rounded-full">Register</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
