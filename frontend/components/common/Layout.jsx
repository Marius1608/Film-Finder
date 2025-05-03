import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Head from 'next/head';

const Layout = ({ children, title = 'FilmFinder' }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Head>
        <title>{title} | FilmFinder</title>
        <meta name="description" content="Descoperă filme noi și organizează colecția ta de filme" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;