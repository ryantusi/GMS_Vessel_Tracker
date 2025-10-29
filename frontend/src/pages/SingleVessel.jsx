import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Ship, MapPin, Navigation, Calendar, Anchor } from 'lucide-react';
import apiService from '../services/api';
import MapComponent from '../components/MapComponent';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function SingleVessel() {
  const { imo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vesselData, setVesselData] = useState(null);

  useEffect(() => {
    fetchVesselData();
  }, [imo]);

  const fetchVesselData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getSingleVessel(imo);
      setVesselData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch vessel data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Fetching vessel data..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={fetchVesselData}
        onHome={() => navigate('/')}
      />
    );
  }

  if (!vesselData || !vesselData.success) {
    return (
      <ErrorMessage 
        message="No vessel data found"
        onHome={() => navigate('/')}
      />
    );
  }

  const vessel = vesselData.vessel;
  const fullData = vesselData.vessel; // This contains the full AIS data

  // Format ETA
  const formatETA = () => {
    if (fullData.eta_month_utc && fullData.eta_day_utc) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[fullData.eta_month_utc - 1]} ${fullData.eta_day_utc}, ${fullData.eta_hour_utc || '00'}:${String(fullData.eta_minute_utc || '00').padStart(2, '0')} UTC`;
    }
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Ship size={40} className="mr-4" />
              <div>
                <h1 className="text-3xl font-bold">{vessel.name || 'Unknown Vessel'}</h1>
                <p className="text-blue-100">IMO: {vessel.imo} • Type: {vessel.type?.toUpperCase()}</p>
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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Map and Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-[500px]">
                <MapComponent
                  markers={vesselData.map?.markers || []}
                  bounds={vesselData.map?.bounds}
                  center={vesselData.map?.center || [vessel.longitude, vessel.latitude]}
                  zoom={vesselData.map?.zoom || 8}
                />
              </div>
            </div>

            {/* Main Details Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Ship className="mr-2 text-blue-600" />
                Vessel Details
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <DetailItem icon={<Ship size={20} />} label="Vessel Name" value={vessel.name || 'N/A'} />
                  <DetailItem icon={<Anchor size={20} />} label="IMO Number" value={vessel.imo || 'N/A'} />
                  <DetailItem icon={<Ship size={20} />} label="Vessel Type" value={vessel.type?.toUpperCase() || 'N/A'} />
                  <DetailItem 
                    icon={<MapPin size={20} />} 
                    label="Destination" 
                    value={
                      typeof vessel.ais_destination === 'object' 
                        ? vessel.ais_destination.destination 
                        : vessel.ais_destination || 'N/A'
                    } 
                  />
                </div>
                <div className="space-y-4">
                  <DetailItem 
                    icon={<Navigation size={20} />} 
                    label="Current Position" 
                    value={`${vessel.latitude?.toFixed(4)}°, ${vessel.longitude?.toFixed(4)}°`} 
                  />
                  <DetailItem 
                    icon={<MapPin size={20} />} 
                    label="Last Port" 
                    value={fullData.last_port || 'N/A'} 
                  />
                  <DetailItem 
                    icon={<Calendar size={20} />} 
                    label="ETA" 
                    value={formatETA()} 
                  />
                  <DetailItem 
                    icon={<Ship size={20} />} 
                    label="Reported Dest" 
                    value={vessel.reportedDestination || 'N/A'} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Information */}
          <div className="space-y-6">
            {/* Technical Specifications */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Technical Specifications</h3>
              <div className="space-y-3 text-sm">
                <DataRow label="MMSI" value={fullData.mmsi || 'N/A'} />
                <DataRow label="Call Sign" value={fullData.call_sign || 'N/A'} />
                <DataRow label="Flag" value={fullData.flag || 'N/A'} />
                <DataRow label="Country" value={fullData.country || 'N/A'} />
                <DataRow label="Length" value={fullData.length ? `${fullData.length} m` : 'N/A'} />
                <DataRow label="Beam" value={fullData.beam ? `${fullData.beam} m` : 'N/A'} />
                <DataRow label="Draught" value={fullData.draught ? `${fullData.draught} m` : 'N/A'} />
                <DataRow label="Gross Tonnage" value={fullData.gt || 'N/A'} />
                <DataRow label="Deadweight" value={fullData.dwt ? `${fullData.dwt} MT` : 'N/A'} />
                <DataRow label="Year Built" value={fullData.year || 'N/A'} />
              </div>
            </div>

            {/* Navigation Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Navigation Status</h3>
              <div className="space-y-3 text-sm">
                <DataRow 
                  label="Status" 
                  value={fullData.navigational_status || 'N/A'}
                  highlight={true}
                />
                <DataRow 
                  label="Speed" 
                  value={fullData.speed_over_ground ? `${fullData.speed_over_ground} knots` : 'N/A'} 
                />
                <DataRow 
                  label="Course" 
                  value={fullData.course_over_ground ? `${fullData.course_over_ground}°` : 'N/A'} 
                />
                <DataRow 
                  label="Heading" 
                  value={fullData.true_heading ? `${fullData.true_heading}°` : 'N/A'} 
                />
                <DataRow 
                  label="Rate of Turn" 
                  value={fullData.rate_of_turn ? `${fullData.rate_of_turn}°/min` : 'N/A'} 
                />
              </div>
            </div>

            {/* Ship Type Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Ship Classification</h3>
              <div className="space-y-3 text-sm">
                <DataRow label="Ship Type" value={fullData.type || 'N/A'} />
                <DataRow label="Detailed Type" value={fullData.detailed_type || 'N/A'} />
                <DataRow label="AIS Class" value={fullData.class || 'N/A'} />
              </div>
            </div>

            {/* Last Update */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Last Position Update</p>
              <p className="text-sm font-semibold text-gray-800">
                {fullData.updated_at 
                  ? new Date(fullData.updated_at).toLocaleString() 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for detail items with icons
function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start">
      <div className="text-blue-600 mt-1 mr-3">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-base font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// Helper component for data rows
function DataRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between py-2 border-b border-gray-100 ${highlight ? 'bg-blue-50 px-2 rounded' : ''}`}>
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className={`font-semibold ${highlight ? 'text-blue-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

export default SingleVessel;