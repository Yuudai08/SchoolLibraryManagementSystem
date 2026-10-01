import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { getErrorMessage } from '../api/client';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({
        email: email.trim(),
        password,
      });

      login(response);
      toast.success(`Welcome back, ${response.fullName}!`);
      navigate('/', { replace: true });
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#091524] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Subtle ambient warm lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-elevated ring-1 ring-white/20">
            <Library className="w-7 h-7 stroke-[1.8]" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Oakridge Academy
        </h2>
        <p className="mt-1 text-center text-xs text-stone-400 font-mono tracking-wide">
          Library Management Information Portal
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-elevated rounded-2xl sm:px-10 border border-stone-200/90">
          <form className="space-y-4.5" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Librarian ID or Email"
                type="email"
                required
                placeholder="librarian@oakridge.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center py-2.5 font-semibold text-sm shadow-card"
                isLoading={isLoading}
              >
                Sign In to Portal
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Institutional Access &bull; 256-Bit TLS Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
