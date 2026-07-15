// Public layout for guest facing pages
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 flex flex-col">
      {/* Simple elegant header */}
      <header className="py-4 text-center border-b border-cream-200 bg-white/50 backdrop-blur-sm">
        <span className="text-xl font-bold text-navy-800 tracking-wider">
          Davet<span className="text-gold-600">Masa</span>
        </span>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col p-4 sm:p-8 relative">
        {/* Background decorative elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gold-200 blur-3xl" />
          <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-cream-300 blur-3xl" />
        </div>
        
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-navy-400 bg-white/50 backdrop-blur-sm border-t border-cream-200 mt-auto">
        <p>© {new Date().getFullYear()} DavetMasa. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
