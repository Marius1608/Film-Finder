'use client';

import { Film, Heart, User, LogOut, Home, Sparkles, Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

 const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/movies', label: 'Movies', icon: Film },
    ...(user ? [
      { href: '/recommendations', label: 'Recommendations', icon: Sparkles },
      { href: '/features', label: 'New Features', icon: Zap }
    ] : [])
  ];

  const isActiveRoute = (href: string) => {
    return pathname === href;
  };

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      isScrolled 
        ? "bg-background/95 backdrop-blur-md shadow-lg" 
        : "bg-background/80 backdrop-blur-sm",
      "border-b"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 group transition-transform hover:scale-105"
            >
              <div className="relative">
                <Film className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                FilmFinder
              </span>
            </Link>
            
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-4 py-2 rounded-lg transition-all duration-300",
                      "hover:bg-primary/10 flex items-center gap-2 group",
                      isActiveRoute(item.href) && "text-primary"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-transform",
                      "group-hover:scale-110",
                      isActiveRoute(item.href) && "text-primary"
                    )} />
                    <span className="font-medium">{item.label}</span>
                    {isActiveRoute(item.href) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="animate-fade-in">
                  <NotificationBell />
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                  className="relative hover:bg-primary/10 transition-colors"
                >
                  <Link href="/watchlist">
                    <Heart className="h-5 w-5 transition-transform hover:scale-110" />
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/50 transition-all"
                    >
                      <Avatar className="h-9 w-9 border-2 border-primary/20">
                        <AvatarImage 
                          src="/avatars/01.png" 
                          alt={user.email}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-64 animate-slide-in"
                    align="end"
                  >
                    <div className="p-4 border-b">
                      <p className="font-semibold text-sm">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile" className="flex items-center gap-3 p-3">
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/settings" className="flex items-center gap-3 p-3">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="cursor-pointer flex items-center gap-3 p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  asChild
                  className="hover:bg-primary/10 transition-colors"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button 
                  asChild
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all hover:scale-105 shadow-lg"
                >
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          isMobileMenuOpen ? "max-h-screen py-4" : "max-h-0"
        )}>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    "hover:bg-primary/10",
                    isActiveRoute(item.href) && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {!user && (
              <>
                <div className="h-px bg-border my-2" />
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Login</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Sign Up</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import { Settings } from 'lucide-react';