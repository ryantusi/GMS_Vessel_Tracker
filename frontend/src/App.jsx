import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SingleVessel from './pages/SingleVessel';
import BatchVessels from './pages/BatchVessels';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vessel/:imo" element={<SingleVessel />} />
          <Route path="/batch" element={<BatchVessels />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;