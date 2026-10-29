export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">HomeHub</h1>
      <p className="text-slate-600 mb-6 text-center max-w-xl">
        Coordinate shared bills, AI-powered inventory, maintenance dispatch, and tenancy compliance — for tenants, landlords, agents, and contractors.
      </p>
      <div className="flex gap-3">
        <a href="/login" className="px-4 py-2 rounded bg-slate-900 text-white">Sign in</a>
        <a href="/signup" className="px-4 py-2 rounded border border-slate-300">Create account</a>
      </div>
    </main>
  );
}
