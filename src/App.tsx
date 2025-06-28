import React, { useState, useEffect } from 'react';
import { Stars, Calendar, User, Sparkles, Clock, AlertCircle } from 'lucide-react';

// Types
interface ZodiacEntry {
  id: number;
  name: string;
  zodiacSign: string;
  timestamp: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  errors?: any[];
}

// Zodiac sign emoji mapping
const zodiacEmojis: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

function App() {
  // State management
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
  });
  const [result, setResult] = useState<string>('');
  const [recentEntries, setRecentEntries] = useState<ZodiacEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // API base URL - works for both development and production
  const API_BASE = window.location.origin;

  /**
   * Fetch recent entries from the server
   */
  const fetchRecentEntries = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/recent`);
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data) {
        setRecentEntries(data.data);
      }
    } catch (error) {
      console.error('Error fetching recent entries:', error);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setResult('');
    setShowSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/zodiac`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setResult(data.data.message);
        setShowSuccess(true);
        // Reset form
        setFormData({ name: '', dateOfBirth: '' });
        // Refresh recent entries
        await fetchRecentEntries();
      } else {
        // Handle validation errors
        if (data.errors) {
          setErrors(data.errors.map((err: any) => err.msg));
        } else {
          setErrors([data.message || 'Something went wrong']);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(['Failed to connect to server. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Load recent entries on component mount
  useEffect(() => {
    fetchRecentEntries();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars absolute inset-0 opacity-50"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Stars className="w-16 h-16 text-yellow-300 animate-pulse" />
              <Sparkles className="w-8 h-8 text-purple-300 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            Zodiac Oracle
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Discover your celestial identity through the ancient wisdom of the stars
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Main Form Card */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-white mb-2">Enter Your Details</h2>
              <p className="text-purple-200">Let the cosmos reveal your zodiac sign</p>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 text-red-300 mr-2" />
                  <h3 className="text-red-300 font-medium">Please fix the following errors:</h3>
                </div>
                <ul className="list-disc list-inside text-red-200 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && result && (
              <div className="mb-6 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl backdrop-blur-sm animate-pulse">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-yellow-300 mx-auto mb-3 animate-spin" />
                  <p className="text-green-200 text-lg font-medium">{result}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-purple-200 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  min="1900-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Consulting the Stars...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Stars className="w-5 h-5 mr-2" />
                    Discover My Zodiac Sign
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Recent Entries Card */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-white mb-2">Recent Discoveries</h2>
              <p className="text-purple-200">See who else has consulted the stars</p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {recentEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-purple-300 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-300">No entries yet. Be the first to discover your zodiac sign!</p>
                </div>
              ) : (
                recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {zodiacEmojis[entry.zodiacSign] || '⭐'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{entry.name}</p>
                          <p className="text-purple-300 text-sm">{entry.zodiacSign}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-400 text-xs">
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-purple-300 text-sm">
            ✨ Your cosmic journey begins with a single question ✨
          </p>
        </div>
      </div>

      {/* Custom styles for scrollbar and animations */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
        
        .stars {
          background-image: 
            radial-gradient(2px 2px at 20px 30px, #eee, transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 90px 40px, #fff, transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
            radial-gradient(2px 2px at 160px 30px, #ddd, transparent);
          background-repeat: repeat;
          background-size: 200px 100px;
          animation: sparkle 20s linear infinite;
        }
        
        @keyframes sparkle {
          from { transform: translateX(0); }
          to { transform: translateX(-200px); }
        }
      `}</style>
    </div>
  );
}

export default App;