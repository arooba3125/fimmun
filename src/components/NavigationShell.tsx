"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the client navigation component and force client-side only rendering.
const NavigationClient = dynamic(() => import('./NavigationClient'), {
  ssr: false,
  loading: () => null,
});

export default function NavigationShell() {
  return <NavigationClient />;
}
