import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Academic Workflow Platform
        </h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your school account</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
