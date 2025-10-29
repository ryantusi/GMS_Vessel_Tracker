import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Search, List } from 'lucide-react';
import MapComponent from '../components/MapComponent';

function Home() {
  const navigate = useNavigate();
  const [singleIMO, setSingleIMO] = useState('');
  const [batchIMOs, setBatchIMOs] = useState('');
  const [singleError, setSingleError] = useState('');
  const [batchError, setBatchError] = useState('');

  // Handle single vessel search
  const handleSingleSearch = (e) => {
    e.preventDefault();
    setSingleError('');

    const imo = singleIMO.trim();
    
    // Validate IMO
    if (!imo) {
      setSingleError('Please enter an IMO number');
      return;
    }

    if (!/^\d+$/.test(imo)) {
      setSingleError('IMO must contain only numbers');
      return;
    }

    if (imo.length < 7) {
      setSingleError('IMO must be at least 7 digits');
      return;
    }

    // Navigate to single vessel page
    navigate(`/vessel/${imo}`);
  };

  // Handle batch search
  const handleBatchSearch = (e) => {
    e.preventDefault();
    setBatchError('');

    const input = batchIMOs.trim();
    
    if (!input) {
      setBatchError('Please enter IMO numbers');
      return;
    }

    // Split by comma and validate each IMO
    const imos = input.split(',').map(imo => imo.trim()).filter(imo => imo);

    if (imos.length === 0) {
      setBatchError('Please enter at least one IMO number');
      return;
    }

    // Validate all IMOs are numbers
    const invalidIMOs = imos.filter(imo => !/^\d+$/.test(imo));
    if (invalidIMOs.length > 0) {
      setBatchError(`Invalid IMO(s): ${invalidIMOs.join(', ')}`);
      return;
    }

    // Check if any IMO is too short
    const shortIMOs = imos.filter(imo => imo.length < 7);
    if (shortIMOs.length > 0) {
      setBatchError(`IMO(s) too short: ${shortIMOs.join(', ')}`);
      return;
    }

    // Navigate to batch page with IMOs as query params
    navigate('/batch', { state: { imos } });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <Ship size={64} className="mr-4" />
            <h1 className="text-5xl font-bold">Live Ship Vessel Tracker</h1>
          </div>
          <p className="text-xl text-blue-100 mb-8">
            Track vessels in real-time using AIS data • Monitor ship locations worldwide
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="font-semibold">Real-time AIS Data</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="font-semibold">Global Coverage</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="font-semibold">Batch Search</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Forms Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Single Vessel Search */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Search className="text-blue-600" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Single Vessel Search</h2>
                <p className="text-gray-600">Track one vessel by IMO number</p>
              </div>
            </div>

            <form onSubmit={handleSingleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMO Number
                </label>
                <input
                  type="text"
                  value={singleIMO}
                  onChange={(e) => {
                    setSingleIMO(e.target.value);
                    setSingleError('');
                  }}
                  placeholder="e.g., 9626390"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                {singleError && (
                  <p className="mt-2 text-sm text-red-600">{singleError}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Enter a valid IMO number (7+ digits, numbers only)
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Search size={20} className="mr-2" />
                Search Vessel
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Example IMOs:</strong> 9626390, 9308444, 9711819
              </p>
            </div>
          </div>

          {/* Batch Vessel Search */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="bg-cyan-100 p-3 rounded-lg mr-4">
                <List className="text-cyan-600" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Batch Vessel Search</h2>
                <p className="text-gray-600">Track multiple vessels at once</p>
              </div>
            </div>

            <form onSubmit={handleBatchSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMO Numbers (comma-separated)
                </label>
                <textarea
                  value={batchIMOs}
                  onChange={(e) => {
                    setBatchIMOs(e.target.value);
                    setBatchError('');
                  }}
                  placeholder="e.g., 9626390, 9308444, 9711819"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition resize-none"
                />
                {batchError && (
                  <p className="mt-2 text-sm text-red-600">{batchError}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Separate multiple IMO numbers with commas
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center justify-center"
              >
                <List size={20} className="mr-2" />
                Search Multiple Vessels
              </button>
            </form>

            <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
              <p className="text-sm text-cyan-800">
                <strong>Tip:</strong> You can search up to 20 vessels at once
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* World Map Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600">
            <h2 className="text-2xl font-bold text-white">Global Vessel Tracking</h2>
            <p className="text-blue-100">Centered on the Suez Canal - Heart of Maritime Trade</p>
          </div>
          <div className="h-[500px]">
            <MapComponent 
              center={[38.3, 29.9]} // Suez Canal coordinates
              zoom={3}
              markers={[]}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Live Ship Vessel Tracker • Powered by AIS Data & Mapbox
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;