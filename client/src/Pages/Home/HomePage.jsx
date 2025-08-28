import 'react';
import { Clock } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-black to-black"></div>
      
      <div className="relative z-10 text-center">
        {/* Brand Name */}
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-2 tracking-wider">
          TIFFIX
        </h1>
        <p className="text-lg text-gray-500 mb-8">by Futuredesks</p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center px-6 py-3 rounded-full border border-orange-500/50 bg-orange-500/20 backdrop-blur-sm mb-8">
          <Clock className="w-5 h-5 text-orange-400 mr-2 animate-pulse" />
          <span className="text-lg font-medium text-orange-400">COMING SOON</span>
        </div>

        {/* Subtitle */}
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Something extraordinary is in the works. We&#39;re crafting the perfect experience just for you.
        </p>

        {/* Features */}
        <div className="flex justify-center space-x-12">
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-orange-400 font-medium">Fast</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔧</div>
            <div className="text-orange-400 font-medium">Reliable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <div className="text-orange-400 font-medium">Innovative</div>
          </div>
        </div>
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-500/30 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-orange-400/50 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-orange-300/40 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default HomePage;