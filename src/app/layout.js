import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import NavbarWrapper from '../components/NavbarWrapper';
import { ReactionEditorProvider } from '../context/ReactionEditorContext';

export const metadata = {
  title: 'Molecool Labs',
  description: 'Your AI-powered virtual chemistry laboratory',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black" suppressHydrationWarning>
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
