export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full" style={{ maxWidth: '28rem' }}>
        {children}
      </div>
    </div>
  );
}
