import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-seb-cream px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-seb-red mb-4">
            <span className="text-white font-bold text-xl">SEB</span>
          </div>
          <h1 className="text-2xl font-bold text-seb-gray-dark">
            Influence Dashboard
          </h1>
          <p className="text-seb-gray mt-1 text-sm">
            Tableau de bord exécutif - Groupe SEB
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Connexion
          </h2>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-seb-gray-light mt-6">
          Accès réservé aux collaborateurs autorisés
        </p>
      </div>
    </div>
  );
}
