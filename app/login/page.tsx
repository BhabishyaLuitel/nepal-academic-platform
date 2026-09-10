import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="cas-card w-full max-w-sm p-8">
        <span className="cas-badge">Springdale School</span>
        <h1 className="mt-3 text-xl font-semibold text-[color:var(--cas-ink)]">
          Academic Workflow Platform
        </h1>
        <p className="mt-1 text-sm text-[color:var(--cas-ink-dim)]">Sign in to your school account</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
