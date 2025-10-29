import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Ship, Eye, MapPin } from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function BatchVessels() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchData, setBatchData] = useState(null);

  useEffect(() => {
    const imos = location.state?.imos;
    
    if (!imos || imos.length === 0) {
      navigate('/');
      return;
    }

    fetchBatchData(imos);
  }, [location.state]);

  const fetchBatchData = async (imos) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getBatchVessels(imos);
      setBatchData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch batch vessel data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (imo) => {
    navigate(`/vessel/${imo}`);
  };

  if (loading) {
    return <LoadingSpinner message="Fetching vessels data..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={() => fetchBatchData(location.state?.imos)}
        onHome={() => navigate('/')}
      />
    );
  }

  if (!batchData || !batchData.success) {
    return (
      <ErrorMessage 
        message="No vessel data found"
        onHome={() => navigate('/')}
      />
    );
  }

  const { vessels, totalRequested, totalSuccess, totalFailed, failed } = batchData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Ship size={40} className="mr-4" />
              <div>
                <h1 className="text-3xl font-bold">Batch Vessel Search Results</h1>
                <p className="text-blue-100">
                  {totalSuccess} of {totalRequested} vessels found
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              <Home size={20} className="mr-2" />
              Home
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <SummaryCard 
            title="Total Requested" 
            value={totalRequested} 
            color="blue"
            icon={<Ship size={24} />}
          />
          <SummaryCard 
            title="Successfully Found" 
            value={totalSuccess} 
            color="green"
            icon={<MapPin size={24} />}
          />
          <SummaryCard 
            title="Failed / Not Found" 
            value={totalFailed} 
            color="red"
            icon={<Ship size={24} />}
          />
        </div>

        {/* Failed Vessels Alert */}
        {totalFailed > 0 && failed && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to fetch {totalFailed} vessel(s)
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>IMOs: {failed.map(f => f.imo).join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vessels Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-cyan-600 to-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    IMO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Port
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Reported Destination
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vessels.map((vessel, index) => {
                  const destination = typeof vessel.ais_destination === 'object' 
                    ? vessel.ais_destination 
                    : { port: 'Unknown', country: 'Unknown' };

                  return (
                    <tr 
                      key={vessel.imo || index}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-semibold text-gray-900">
                          {vessel.imo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <VesselTypeBadge type={vessel.type} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Ship size={16} className="text-blue-600 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {vessel.name || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {destination.port || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {destination.country || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-600">
                          {vessel.reportedDestination || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(vessel.imo)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {vessels.length === 0 && (
            <div className="text-center py-12">
              <Ship size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vessels found</h3>
              <p className="text-gray-500">Try searching with different IMO numbers</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Click the "View" button on any vessel to see detailed information including position on map, specifications, and navigation status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for summary cards
function SummaryCard({ title, value, color, icon }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Helper component for vessel type badge
function VesselTypeBadge({ type }) {
  const typeColors = {
    mt: 'bg-orange-100 text-orange-800 border-orange-300',
    mv: 'bg-blue-100 text-blue-800 border-blue-300',
    tug: 'bg-purple-100 text-purple-800 border-purple-300',
    others: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const typeLabels = {
    mt: 'Motor Tanker',
    mv: 'Motor Vessel',
    tug: 'Tug Boat',
    others: 'Other',
  };

  const colorClass = typeColors[type?.toLowerCase()] || typeColors.others;
  const label = typeLabels[type?.toLowerCase()] || 'Other';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
}

export default BatchVessels;