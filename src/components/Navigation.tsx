'use client';

import { useState } from 'react';
import { MUN_CONSTANTS } from '@/lib/constants';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">UN</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{MUN_CONSTANTS.shortName}</h1>
              <p className="text-xs text-gray-500">2024</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('about')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('committees')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Committees
            </button>
            <button 
              onClick={() => scrollToSection('schedule')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Schedule
            </button>
            <button 
              onClick={() => scrollToSection('registration')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Registration
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Testimonials
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors duration-300">
              Register Now
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <button 
                onClick={() => scrollToSection('about')}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors duration-300"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('committees')}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors duration-300"
              >
                Committees
              </button>
              <button 
                onClick={() => scrollToSection('schedule')}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors duration-300"
              >
                Schedule
              </button>
              <button 
                onClick={() => scrollToSection('registration')}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors duration-300"
              >
                Registration
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors duration-300"
              >
                Testimonials
              </button>
              <button className="block w-full text-left px-3 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-300">
                Register Now
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
