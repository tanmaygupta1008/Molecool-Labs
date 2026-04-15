'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const pathname = usePathname();
  
  // Immersive routes where footer should be hidden to avoid layout overlap
  const isImmersivePath = 
    pathname?.includes('/chemical-reactions') || 
    pathname?.includes('/compounds/builder') ||
    pathname?.includes('/apparatus');
  
  if (isImmersivePath) return null;

  return (
    <footer className="glass-card !bg-white/5 backdrop-blur-3xl border-t border-white/10 text-white py-16 px-4 mt-20 relative z-10 rounded-none border-x-0 border-b-0 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-3xl font-black tracking-tighter mb-6">
            MOLECOOLS <span className="text-white/40 font-light">LAB</span>
          </h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm mb-8 font-medium">
            Empowering the next generation of chemists with immersive, AI-powered virtual laboratories. Explore the micro world through the lens of futuristic technology.
          </p>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl glass-pill flex items-center justify-center cursor-pointer tap-animation">
              <span className="text-white opacity-80">𝕏</span>
            </div>
            <div className="w-10 h-10 rounded-xl glass-pill flex items-center justify-center cursor-pointer tap-animation">
              <span className="text-white opacity-80">in</span>
            </div>
            <div className="w-10 h-10 rounded-xl glass-pill flex items-center justify-center cursor-pointer tap-animation">
              <span className="text-white opacity-80">gh</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white/80 mb-8">Modules</h4>
          <ul className="space-y-4">
            <li><Link href="/periodic-table" className="text-base text-white/90 hover:text-white transition-colors tap-animation font-medium">Periodic Table</Link></li>
            <li><Link href="/chemical-reactions" className="text-base text-white/90 hover:text-white transition-colors tap-animation font-medium">Reaction Lab</Link></li>
            <li><Link href="/compounds" className="text-base text-white/90 hover:text-white transition-colors tap-animation font-medium">Molecule Explorer</Link></li>
            <li><Link href="/apparatus" className="text-base text-white/90 hover:text-white transition-colors tap-animation font-medium">Lab Apparatus</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white/80 mb-8">Company</h4>
          <ul className="space-y-4">
            <li><Link href="/" className="text-base text-white/90 hover:text-white transition-colors tap-animation font-medium">Our Vision</Link></li>
            <li><Link href="/" className="text-base text-white/90 hover:text-white transition-colors tap-animation font-medium">Privacy Policy</Link></li>
            <li><Link href="/" className="text-base text-white/90 hover:text-white transition-colors tap-animation font-medium">Terms of Service</Link></li>
            <li><Link href="/" className="text-base text-white/90 hover:text-white transition-colors tap-animation font-medium">Contact Us</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-black uppercase tracking-widest text-white/50">
        <p>© 2026 Molecools Lab. All rights reserved.</p>
        <p className="flex items-center gap-2">
          Design inspired by <span className="text-white/90 font-black">Mercury Crystalline 🧪</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
