"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Client-only wrapper that dynamically loads the real Navigation client component.
// Keeping `ssr: false` inside a client component avoids the build error when
// imported from a server component (app/page.tsx).
const DynamicNavigation = dynamic(() => import('./NavigationClient'), {
  ssr: false,
  loading: () => null,
});

export default function NavigationLoader() {
  return <DynamicNavigation />;
}
