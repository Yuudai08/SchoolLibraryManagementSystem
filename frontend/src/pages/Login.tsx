import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Lock, Mail, Eye, EyeOff, BookOpenCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle decorative background gradient */}
      <div className="absolute inset-0 bg-radial-gradient from-indigo-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Library className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          School Library Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Sign in to access circulation, books catalog, and records
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Librarian Email"
                type="email"
                required
                placeholder="librarian@example.com"
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
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 focus:outline-none"
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
                className="w-full justify-center"
                isLoading={isLoading}
              >
                Sign In to Portal
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <BookOpenCheck className="w-4 h-4 text-indigo-500" />
              <span>Clean Architecture &bull; Secure JWT Session</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
