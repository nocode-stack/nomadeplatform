
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import EmailConfirmationDialog from '../components/ui/EmailConfirmationDialog';
import AccountActivationDialog from '../components/auth/AccountActivationDialog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);

  const { login, activateAccount } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      navigate('/intro');
    } else if (result.needsConfirmation) {
      setShowConfirmationDialog(true);
    } else if (result.needsActivation) {
      setShowActivationDialog(true);
    } else {
      setError(result.error || 'Error desconocido');
    }

    setIsLoading(false);
  };

  return (
    <>
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative overflow-hidden animate-blur-in"
        style={{ backgroundImage: 'url("/lovable-uploads/login2.jpg")' }}
      >
        {/* Dark Cinematic Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-0"></div>

        <div className="relative z-10 w-full max-w-md animate-fade-in-up [animation-delay:200ms]">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 overflow-hidden">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="bg-[#D9D9D9] p-1 rounded-2xl w-20 h-20 flex items-center justify-center shadow-2xl animate-logo-breath">
                  <img
                    src="/lovable-uploads/logo_grande.jpg"
                    alt="Nomade Logo"
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-4xl font-bold text-white tracking-tighter leading-none mb-1">Nomade</span>
                  <span className="text-lg font-medium text-white/50 tracking-[0.2em] uppercase">Nation</span>
                </div>
              </div>
            </div>


            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-white/60 uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                  placeholder="nombre@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold text-white/60 uppercase tracking-wider ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all pr-12 [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-shake">
                  <p className="text-destructive-foreground text-sm font-medium text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center px-4 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg ${isLoading
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                ) : (
                  <LogIn className="w-5 h-5 mr-3" />
                )}
                {isLoading ? 'Autenticando...' : 'ENTRAR'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                Acceso Plataforma
              </p>
            </div>
          </div>
        </div>
      </div>

      <EmailConfirmationDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        email={email}
      />

      <AccountActivationDialog
        open={showActivationDialog}
        onOpenChange={setShowActivationDialog}
        email={email}
        onResendEmail={() => activateAccount(email)}
      />
    </>
  );
};

export default Login;
