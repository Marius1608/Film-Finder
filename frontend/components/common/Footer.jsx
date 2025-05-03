import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-primary-dark text-gray-400 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">FilmFinder</h3>
            <p className="text-sm">
              Platformă pentru descoperire, organizare și recomandare de filme personalizate.
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-white mb-4">Explorare</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/explore">
                  <a className="hover:text-accent transition">Toate filmele</a>
                </Link>
              </li>
              <li>
                <Link href="/explore?sort=rating">
                  <a className="hover:text-accent transition">Top rating</a>
                </Link>
              </li>
              <li>
                <Link href="/explore?sort=popularity">
                  <a className="hover:text-accent transition">Populare</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-white mb-4">Profile</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/?profile=action_fan">
                  <a className="hover:text-accent transition">Fan acțiune</a>
                </Link>
              </li>
              <li>
                <Link href="/?profile=drama_lover">
                  <a className="hover:text-accent transition">Iubitor de drame</a>
                </Link>
              </li>
              <li>
                <Link href="/?profile=comedy_enthusiast">
                  <a className="hover:text-accent transition">Entuziast comedie</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-white mb-4">Cont</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register">
                  <a className="hover:text-accent transition">Înregistrare</a>
                </Link>
              </li>
              <li>
                <Link href="/login">
                  <a className="hover:text-accent transition">Autentificare</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} FilmFinder. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;