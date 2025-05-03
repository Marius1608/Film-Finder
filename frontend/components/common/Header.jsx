import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/hooks/useAuth';
import SearchBar from './SearchBar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <header className="bg-primary py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-accent">Film<span className="text-white">Finder</span></span>
          </a>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <SearchBar />
          
          <nav className="flex items-center space-x-6">
            <Link href="/explore">
              <a className={`hover:text-accent transition ${
                router.pathname === '/explore' ? 'text-accent font-medium' : ''
              }`}>
                Explorează
              </a>
            </Link>
            
            {user ? (
              <>
                <Link href="/user/dashboard">
                  <a className={`hover:text-accent transition ${
                    router.pathname === '/user/dashboard' ? 'text-accent font-medium' : ''
                  }`}>
                    Dashboard
                  </a>
                </Link>
                
                <div className="relative group">
                  <button className="flex items-center space-x-1 hover:text-accent transition">
                    <span>{user.username}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-primary-dark rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                    <Link href="/user/profile">
                      <a className="block px-4 py-2 hover:bg-primary hover:text-accent">
                        Profil
                      </a>
                    </Link>
                    <Link href="/user/history">
                      <a className="block px-4 py-2 hover:bg-primary hover:text-accent">
                        Istoric
                      </a>
                    </Link>
                    <Link href="/user/lists">
                      <a className="block px-4 py-2 hover:bg-primary hover:text-accent">
                        Listele mele
                      </a>
                    </Link>
                    <hr className="my-1 border-gray-700" />
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 hover:bg-primary hover:text-accent"
                    >
                      Deconectare
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <a className="px-4 py-2 rounded-md bg-transparent border border-accent text-accent hover:bg-accent hover:text-white transition">
                    Autentificare
                  </a>
                </Link>
                <Link href="/register">
                  <a className="px-4 py-2 rounded-md bg-accent text-white hover:bg-accent-dark transition">
                    Înregistrare
                  </a>
                </Link>
              </>
            )}
          </nav>
        </div>
        
        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-300 hover:text-white focus:outline-none"
          onClick={toggleMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary-dark">
          <div className="px-4 py-3">
            <SearchBar isMobile />
          </div>
          <nav className="px-4 py-2 space-y-3">
            <Link href="/explore">
              <a className="block py-2 hover:text-accent">
                Explorează
              </a>
            </Link>
            
            {user ? (
              <>
                <Link href="/user/dashboard">
                  <a className="block py-2 hover:text-accent">
                    Dashboard
                  </a>
                </Link>
                <Link href="/user/profile">
                  <a className="block py-2 hover:text-accent">
                    Profil
                  </a>
                </Link>
                <Link href="/user/history">
                  <a className="block py-2 hover:text-accent">
                    Istoric
                  </a>
                </Link>
                <Link href="/user/lists">
                  <a className="block py-2 hover:text-accent">
                    Listele mele
                  </a>
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left py-2 hover:text-accent"
                >
                  Deconectare
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link href="/login">
                  <a className="px-4 py-2 rounded-md text-center bg-transparent border border-accent text-accent hover:bg-accent hover:text-white transition">
                    Autentificare
                  </a>
                </Link>
                <Link href="/register">
                  <a className="px-4 py-2 rounded-md text-center bg-accent text-white hover:bg-accent-dark transition">
                    Înregistrare
                  </a>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;