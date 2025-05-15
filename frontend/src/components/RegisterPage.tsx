'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import axios from 'axios';
import { 
  FilmIcon, Mail, Lock, User, Eye, EyeOff, 
  X, Sparkles, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length > 6) strength++;
    if (password.length > 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await axios.post('/auth/register', formData, {
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      });
      router.push('/login');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Registration failed');
      } else {
        setError('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-float-slow" />
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
              Join FilmFinder
            </h1>
            <p className="text-gray-600 mt-3 text-lg animate-slide-up-delayed">
              Create an account to start discovering movies
            </p>
          </div>

          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl animate-scale-up">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Create Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4 animate-slide-in">
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      First Name
                    </label>
                    <Input
                      id="first_name"
                      name="first_name"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('first_name')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className={cn(
                        "h-11 border-2 transition-all duration-300",
                        focusedField === 'first_name' && "border-primary shadow-lg shadow-primary/10"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last_name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      Last Name
                    </label>
                    <Input
                      id="last_name"
                      name="last_name"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('last_name')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className={cn(
                        "h-11 border-2 transition-all duration-300",
                        focusedField === 'last_name' && "border-primary shadow-lg shadow-primary/10"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2 animate-slide-in-delayed">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={formData.email}
                      onChange={handleChange}
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
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={handleChange}
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
                  
                  {formData.password && (
                    <div className="mt-2 space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Password strength:</span>
                        <span className={cn(
                          "font-medium",
                          passwordStrength <= 1 ? "text-red-500" : 
                          passwordStrength <= 3 ? "text-yellow-500" : "text-green-500"
                        )}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-300",
                            getPasswordStrengthColor()
                          )}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-4 rounded-lg animate-shake flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />
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
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>

              <div className="mt-6 text-center animate-fade-in-delayed">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1 inline-flex group">
                    Log in now
                    <Sparkles className="w-3 h-3 transition-transform group-hover:scale-110" />
                  </Link>
                </p>
              </div>

              <div className="mt-6 flex justify-center animate-fade-in-delayed">
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