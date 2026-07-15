// Auth sayfaları için layout - sidebar'sız, minimal tasarım
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
