import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import NavbarWrapper from '../components/NavbarWrapper';
import { ReactionEditorProvider } from '../context/ReactionEditorContext';
import NextTopLoader from 'nextjs-toploader';

export const metadata = {
  title: 'Molecools Lab',
  description: 'Your AI-powered virtual chemistry laboratory',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black" suppressHydrationWarning>
        <NextTopLoader
          color="#22d3ee"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
          shadow="0 0 10px #22d3ee,0 0 5px #22d3ee"
        />
        <AuthProvider>
          <ReactionEditorProvider>
            <NavbarWrapper />
            {children}
          </ReactionEditorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
