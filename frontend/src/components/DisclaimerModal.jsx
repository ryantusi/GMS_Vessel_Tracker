import { useState, useEffect } from 'react';
import { X, AlertCircle, Github, PlayCircle, Database, Code } from 'lucide-react';

function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal on every page load
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const availableIMOs = [
    "9626390", "9585663", "9700287", "9646429", "9803417",
    "9779018", "9877339", "9779020", "9779032", "9780952",
    "9219874", "9208459", "9053919", "9141106", "9791779",
    "9123324", "9373204", "9377418", "7349106"
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label="Close disclaimer"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-full">
                <AlertCircle size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Important Notice</h2>
                <p className="text-amber-100 text-sm">Prototype Demonstration Version built by <a href="https://www.linkedin.com/in/ryantusi/" target="_blank" className='font-bold text-gray-100 hover:text-blue-200 transition-colors'>
                    Ryan Tusi</a></p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Main Message */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <h3 className="font-bold text-amber-900 mb-2 flex items-center">
                <Database size={20} className="mr-2" />
                Demo Mode - Static Mock Database
              </h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                This deployment uses a <i>static mock database</i> for demonstration purposes. 
                The <a a href="https://www.aisfriends.com/" target="_blank" className='font-bold text-amber-900 hover:text-red-400 transition-colors'>
                AIS Friends</a> API service is free for local development but restricted on hosted platforms. 
                Therefore, this live demo contains pre-loaded vessel data to showcase the application's functionality.
              </p>
            </div>

            {/* Available Vessels */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <Database size={20} className="mr-2 text-blue-600" />
                Available Vessels (20 vessels in mock database)
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {availableIMOs.map((imo) => (
                    <div
                      key={imo}
                      className="bg-white px-3 py-2 rounded border border-gray-300 text-center font-mono text-sm text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {imo}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  Try searching for any of these IMO numbers in single or batch mode
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">✅ What Works</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Single vessel tracking</li>
                  <li>• Batch vessel search</li>
                  <li>• Map visualization</li>
                  <li>• Port destination matching</li>
                  <li>• AI chatbot (COMPASS)</li>
                  <li>• Full UI/UX experience</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Limitations</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Static data (not real-time)</li>
                  <li>• Limited to 20 vessels</li>
                  <li>• Position data is snapshot</li>
                  <li>• No live AIS updates</li>
                </ul>
              </div>
            </div>

            {/* Full Version Info */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-xl text-white">
              <h3 className="font-bold text-xl mb-3 flex items-center">
                <Code size={24} className="mr-2" />
                Want the Full Experience?
              </h3>
              <p className="text-blue-100 mb-4 leading-relaxed">
                The complete implementation includes <strong>live AIS data</strong>, <strong>Redis caching</strong>, 
                and <strong>real-time vessel tracking</strong>. Set it up locally for the full experience!
              </p>
              
              <div className="space-y-3">
                <a
                  href="https://github.com/ryantusi/GMS_Vessel_Tracker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Github size={20} className="mr-2" />
                  View Source Code on GitHub
                </a>
                
                <a
                  href="https://github.com/yourusername/vessel-tracker#demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-white/10 backdrop-blur text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors border-2 border-white/30"
                >
                  <PlayCircle size={20} className="mr-2" />
                  Watch Demo Video
                </a>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">🚀 Quick Setup (Local)</h4>
              <div className="bg-gray-900 p-4 rounded font-mono text-sm text-green-400 overflow-x-auto">
                <div># Clone repository</div>
                <div>git clone https://github.com/ryantusi/GMS_Vessel_Tracker</div>
                <div className="mt-2"># Follow setup instructions in README</div>
                <div># Includes: API keys, Redis setup, environment config</div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-sm text-gray-600">
              <p>
                This is a <strong>portfolio demonstration project</strong> showcasing full-stack development, 
                API & GenAI integration, real-time data processing, and modern UI/UX design.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-xs text-gray-600">
              Thank you for reviewing this project! ~ Ryan Tusi, Full-Stack + AI/ML Engineer 🚢
            </p>
            <button
              onClick={handleClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Got it, let's explore!
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default DisclaimerModal;