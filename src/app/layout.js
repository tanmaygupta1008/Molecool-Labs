// app/layout.js
import './globals.css';
import NavBar from '../components/navbar';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Molecool Labs',
  description: 'Your AI-powered virtual chemistry laboratory',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black">
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
