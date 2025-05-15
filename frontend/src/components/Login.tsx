'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FilmIcon, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Invalid email or password');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-float-slow" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full blur-xl" />
                <div className="relative p-4 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-xl transform hover:scale-110 transition-transform">
                  <FilmIcon className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent animate-slide-up">
              Welcome Back
            </h1>
            <p className="text-gray-600 mt-3 text-lg animate-slide-up-delayed">
              Log in to discover your next favorite movie
            </p>
          </div>

          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl animate-scale-up">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Sign In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 animate-slide-in">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className={cn(
                        "w-full pl-10 h-12 border-2 transition-all duration-300",
                        focusedField === 'email' && "border-primary shadow-lg shadow-primary/10"
                      )}
                    />
                    <Mail className={cn(
                      "absolute left-3 top-3.5 w-4 h-4 transition-colors duration-300",
                      focusedField === 'email' ? "text-primary" : "text-gray-400"
                    )} />
                  </div>
                </div>
                <div className="space-y-2 animate-slide-in-delayed">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className={cn(
                        "w-full pl-10 pr-12 h-12 border-2 transition-all duration-300",
                        focusedField === 'password' && "border-primary shadow-lg shadow-primary/10"
                      )}
                    />
                    <Lock className={cn(
                      "absolute left-3 top-3.5 w-4 h-4 transition-colors duration-300",
                      focusedField === 'password' ? "text-primary" : "text-gray-400"
                    )} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-4 rounded-lg animate-shake">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 transform hover:scale-105 shadow-lg animate-fade-in-delayed group" 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center animate-fade-in-delayed">
                <p className="text-sm text-gray-600">
                  Do not have an account?{' '}
                  <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1 inline-flex group">
                    Sign up now
                    <Sparkles className="w-3 h-3 transition-transform group-hover:scale-110" />
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-gray-500 mt-8 animate-fade-in-delayed">
            FilmFinder © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}