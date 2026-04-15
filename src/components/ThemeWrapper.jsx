'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ThemeWrapper({ children }) {
  const pathname = usePathname();
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    setIsInternal(pathname !== '/');
  }, [pathname]);

  return (
    <div className={isInternal ? 'theme-internal min-h-screen' : 'min-h-screen'}>
      {children}
    </div>
  );
}
