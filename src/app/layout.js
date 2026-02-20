import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import NavbarWrapper from '../components/NavbarWrapper';

export const metadata = {
  title: 'Molecool Labs',
  description: 'Your AI-powered virtual chemistry laboratory',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black">
        <AuthProvider>
          <NavbarWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
