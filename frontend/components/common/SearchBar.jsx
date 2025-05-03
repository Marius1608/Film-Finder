import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const SearchBar = ({ isMobile = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();
  
  useEffect(() => {
    // Add click outside listener to close results
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    const searchMovies = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/movies/search?query=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        setResults(data.movies || []);
      } catch (error) {
        console.error('Error searching movies:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };
  
  return (
    <div ref={searchRef} className={`relative ${isMobile ? 'w-full' : 'w-64'}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            placeholder="Caută filme..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="w-full bg-gray-800 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </form>
      
      {showResults && query.length >= 2 && (
        <div className="absolute mt-1 w-full bg-primary-dark rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="py-2 px-4 text-sm text-gray-400">Se caută...</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((movie) => (
                <Link key={movie.id} href={`/movies/${movie.id}`}>
                  <a 
                    className="block py-2 px-4 hover:bg-primary cursor-pointer"
                    onClick={() => setShowResults(false)}
                  >
                    <div className="flex items-center">
                      {movie.poster_path ? (
                        <img 
                          src={movie.poster_path} 
                          alt={movie.title} 
                          className="w-8 h-12 object-cover rounded mr-3"
                        />
                      ) : (
                        <div className="w-8 h-12 bg-gray-800 rounded mr-3 flex items-center justify-center text-xs text-gray-400">
                          No img
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium">{movie.title}</div>
                        <div className="text-xs text-gray-400">
                          {movie.year} • {movie.genres_list?.replace(/,/g, ', ')}
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
              <Link href={`/search?q=${encodeURIComponent(query)}`}>
                <a 
                  className="block py-2 px-4 text-center text-sm text-accent hover:underline"
                  onClick={() => setShowResults(false)}
                >
                  Vezi toate rezultatele
                </a>
              </Link>
            </div>
          ) : (
            <div className="py-2 px-4 text-sm text-gray-400">Niciun rezultat găsit</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;