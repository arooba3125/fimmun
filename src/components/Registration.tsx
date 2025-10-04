import { MUN_CONSTANTS } from '@/lib/constants';

export default function Registration() {
  return (
    <section id="registration" className="py-20 bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Registration <span className="text-blue-200">Information</span>
          </h2>
          <div className="w-24 h-1 bg-blue-200 mx-auto mb-8"></div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Secure your spot at the most prestigious Model United Nations conference in the region
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Pricing Cards */}
          <div className="space-y-8">
            {/* Early Bird */}
            <div className="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-2 text-sm font-semibold transform rotate-12 translate-x-4 -translate-y-2">
                BEST VALUE
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Early Bird Registration</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-600">{MUN_CONSTANTS.registration.earlyBird.price}</span>
                  <span className="text-gray-500 line-through text-xl">{MUN_CONSTANTS.registration.regular.price}</span>
                </div>
                <p className="text-gray-600 mt-2">Valid until {MUN_CONSTANTS.registration.earlyBird.deadline}</p>
              </div>
              
              <p className="text-gray-700 mb-6">{MUN_CONSTANTS.registration.earlyBird.description}</p>
              
              <button className="w-full py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-lg">
                Register Early Bird
              </button>
            </div>
            
            {/* Regular Registration */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Regular Registration</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">{MUN_CONSTANTS.registration.regular.price}</span>
                </div>
                <p className="text-gray-600 mt-2">Valid until {MUN_CONSTANTS.registration.regular.deadline}</p>
              </div>
              
              <p className="text-gray-700 mb-6">{MUN_CONSTANTS.registration.regular.description}</p>
              
              <button className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-lg">
                Register Now
              </button>
            </div>
          </div>
          
          {/* What's Included */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">What&apos;s Included</h3>
            <div className="space-y-4">
              {MUN_CONSTANTS.registration.includes.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-blue-100">{item}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-white/5 rounded-xl">
              <h4 className="text-lg font-semibold text-white mb-3">Registration Process</h4>
              <div className="space-y-3 text-blue-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                  <span>Complete online registration form</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                  <span>Submit required documents</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                  <span>Make payment confirmation</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                  <span>Receive confirmation email</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Need Help with Registration?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <p className="text-white font-semibold">Email</p>
                <p className="text-blue-200">{MUN_CONSTANTS.contact.email}</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <p className="text-white font-semibold">Phone</p>
                <p className="text-blue-200">{MUN_CONSTANTS.contact.phone}</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-white font-semibold">Location</p>
                <p className="text-blue-200">{MUN_CONSTANTS.contact.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
