'use client';

import { MUN_CONSTANTS } from '@/lib/constants';

export default function Hero() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 pt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400 rounded-full opacity-20 animate-pulse animation-delay-1000"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-blue-300 rounded-full opacity-30 animate-bounce animation-delay-2000"></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-blue-500 rounded-full opacity-25 animate-pulse animation-delay-3000"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-blue-400 rounded-full opacity-20 animate-bounce animation-delay-500"></div>
      <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-blue-200 rounded-full opacity-40 animate-ping animation-delay-4000"></div>
      <div className="absolute top-2/3 right-1/3 w-6 h-6 bg-blue-300 rounded-full opacity-35 animate-ping animation-delay-1500"></div>
      
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto animate-fade-in-scale">
        {/* Logo/Badge */}
        <div className="mb-8 animate-float">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full border-2 border-white/20 mb-6 hover:bg-white/20 transition-all duration-500">
            <span className="text-4xl font-bold text-white">UN</span>
          </div>
        </div>
        
        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up animation-delay-500">
          <span className="block">{MUN_CONSTANTS.shortName}</span>
          <span className="block text-3xl md:text-4xl font-light text-blue-200 mt-2 animate-fade-in-up animation-delay-1000">
            {MUN_CONSTANTS.eventName}
          </span>
        </h1>
        
        {/* Tagline */}
        <p className="text-xl md:text-2xl text-blue-100 mb-8 font-light animate-fade-in-up animation-delay-1500">
          {MUN_CONSTANTS.tagline}
        </p>
        
        {/* Event Details */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 text-white animate-fade-in-up animation-delay-2000">
          <div className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">{MUN_CONSTANTS.date}</p>
              <p className="text-blue-200 text-sm">Conference Dates</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">{MUN_CONSTANTS.location}</p>
              <p className="text-blue-200 text-sm">Venue</p>
            </div>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24">
          <button 
            onClick={() => scrollToSection('registration')}
            className="group px-10 py-5 bg-white text-blue-900 font-bold text-lg rounded-full hover:bg-blue-50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 shadow-2xl hover:shadow-blue-300/50 relative overflow-hidden"
          >
            <span className="relative z-10">Register Now</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          <button 
            onClick={() => scrollToSection('about')}
            className="group px-10 py-5 border-3 border-white text-white font-bold text-lg rounded-full hover:bg-white hover:text-blue-900 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 relative overflow-hidden backdrop-blur-sm"
          >
            <span className="relative z-10">Learn More</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </section>
  );
}
