'use client';
// src/components/NavbarWrapper.jsx
import { usePathname } from 'next/navigation';
import NavBar from './navbar';

export default function NavbarWrapper() {
    const pathname = usePathname();
    if (pathname === '/') return null;
    return <NavBar />;
}
