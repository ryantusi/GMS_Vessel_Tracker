import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SingleVessel from './pages/SingleVessel';
import BatchVessels from './pages/BatchVessels';
import Chatbot from './components/Chatbot';
import Footer from './components/Footer';
import DisclaimerModal from './components/DisclaimerModal';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
        {/* Disclaimer Modal - Shows on every page */}
        <DisclaimerModal />
        {/* Main content area */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vessel/:imo" element={<SingleVessel />} />
            <Route path="/batch" element={<BatchVessels />} />
          </Routes>
        </div>

        {/* Footer on all pages */}
        <Footer />

        {/* Floating Chatbot on all pages */}
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;