import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import NavbarWrapper from '../components/NavbarWrapper';
import { ReactionEditorProvider } from '../context/ReactionEditorContext';
import NextTopLoader from 'nextjs-toploader';
import Footer from '../components/Footer';
import ThemeWrapper from '../components/ThemeWrapper';


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
          shadow="0 0 10px rgba(255,255,255,0.4),0 0 5px rgba(255,255,255,0.2)"

        />
        <AuthProvider>
          <ReactionEditorProvider>
            <ThemeWrapper>
              <NavbarWrapper />
              {children}
              <Footer />
            </ThemeWrapper>
          </ReactionEditorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
