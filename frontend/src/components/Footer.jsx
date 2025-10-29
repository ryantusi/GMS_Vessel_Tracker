import { Ship, Github, Mail, Linkedin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center mb-4">
              <Ship size={32} className="mr-3 text-cyan-400" />
              <div>
                <h3 className="text-xl font-bold">Vessel Tracker</h3>
                <p className="text-sm text-gray-400">Live AI-Powered Ship Monitoring</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Track vessels worldwide with real-time AIS data and intelligent port matching.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#home" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#search" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Track your vessels
                </a>
              </li>
              <li>
                <a href="https://ryantusi.netlify.app/" target="_blank" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Developer's Portfolio
                </a>
              </li>
              <li>
                <a href="https://github.com/ryantusi/GMS_Vessel_Tracker" target="_blank" className="flex text-gray-400 hover:text-cyan-400 transition-colors">
                  Source Code <Github size={10} className="mr-2"/>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <div className="space-y-3">
              <a
                href="mailto:ryantusi45@gmail.com"
                className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                <Mail size={16} className="mr-2" />
                ryantusi45@gmail.com
              </a>
              <a
                href="https://github.com/ryantusi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                <Github size={16} className="mr-2" />
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/ryantusi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                <Linkedin size={16} className="mr-2" />
                LinkedIn
              </a>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                Powered by AIS Data, Mapbox & Gemini API
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Live Ship Vessel Tracker. Developed by <a href="" target="_blank" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <b>Ryan Tusi</b></a>. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Real-time maritime tracking with AI-powered assistance
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;