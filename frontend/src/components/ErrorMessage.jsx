import { AlertCircle, Home, RefreshCw } from 'lucide-react';

function ErrorMessage({ message, onRetry, onHome }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertCircle size={48} className="text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            Oops! Something went wrong
          </h2>

          {/* Error Message */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700 text-sm">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={20} className="mr-2" />
                Try Again
              </button>
            )}
            
            {onHome && (
              <button
                onClick={onHome}
                className="w-full flex items-center justify-center bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                <Home size={20} className="mr-2" />
                Go to Home
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              If the problem persists, please check:
            </p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• Your internet connection</li>
              <li>• The IMO number is correct</li>
              <li>• The vessel is transmitting AIS data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorMessage;