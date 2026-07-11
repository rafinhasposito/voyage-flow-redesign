import React, { useState } from 'react';
import { Star, Plus, GripVertical, Trash2, Search } from 'lucide-react';

// Mock data
const mockFeatured = [
  { id: '1', title: 'Balloons Over Bagan', location: 'Myanmar', type: 'Adventure', image: 'https://images.unsplash.com/photo-1544084944-15269ec7b5a0?q=80&w=2000&auto=format&fit=crop' },
  { id: '2', title: 'Ice Cave Exploration', location: 'Iceland', type: 'Nature', image: 'https://images.unsplash.com/photo-1517418939632-15942f9e4225?q=80&w=2000&auto=format&fit=crop' },
  { id: '3', title: 'Kyoto Tea Ceremony', location: 'Japan', type: 'Culture', image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2000&auto=format&fit=crop' },
];

const mockAvailable = [
  { id: '4', title: 'Safari in Serengeti', location: 'Tanzania', type: 'Wildlife', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop' },
  { id: '5', title: 'Machu Picchu Trek', location: 'Peru', type: 'Adventure', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=2000&auto=format&fit=crop' },
  { id: '6', title: 'Northern Lights', location: 'Norway', type: 'Nature', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2000&auto=format&fit=crop' },
];

const FeaturedDashboard = () => {
  const [featured, setFeatured] = useState(mockFeatured);
  const [available, setAvailable] = useState(mockAvailable);
  const [searchQuery, setSearchQuery] = useState('');

  const removeFeatured = (id: string) => {
    const item = featured.find(f => f.id === id);
    if (item) {
      setFeatured(featured.filter(f => f.id !== id));
      setAvailable([...available, item]);
    }
  };

  const addFeatured = (id: string) => {
    if (featured.length >= 4) {
      alert("Maximum of 4 featured experiences allowed.");
      return;
    }
    const item = available.find(a => a.id === id);
    if (item) {
      setAvailable(available.filter(a => a.id !== id));
      setFeatured([...featured, item]);
    }
  };

  const filteredAvailable = available.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#0F1117] p-8" style={{ fontFamily: 'Urbanist, sans-serif' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold mb-2">Featured Experiences</h1>
            <p className="text-gray-600">Manage the spotlight experiences shown on the homepage.</p>
          </div>
          <button className="bg-[#E2F18A] hover:bg-[#d4e47a] text-[#0F1117] px-6 py-3 rounded-[24px] font-semibold flex items-center gap-2 transition-colors">
            <Star size={20} />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Active Featured Slots - Bento Box Style */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Current Spotlight</h2>
              <span className="bg-gray-100 text-sm font-medium px-3 py-1 rounded-full text-gray-600">
                {featured.length} / 4 Slots Used
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {featured.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-[24px] p-8">
                  <Star size={48} className="mb-4 text-gray-300" />
                  <p>No featured experiences selected.</p>
                </div>
              ) : (
                featured.map((item, index) => (
                  <div key={item.id} className="group relative flex items-center bg-gray-50 rounded-[24px] p-3 border border-gray-100 transition-all hover:shadow-md">
                    <div className="cursor-grab text-gray-400 px-2">
                      <GripVertical size={20} />
                    </div>
                    
                    <div className="w-20 h-20 rounded-[16px] overflow-hidden flex-shrink-0 relative">
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10 backdrop-blur-sm">
                        #{index + 1}
                      </div>
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.location} • {item.type}</p>
                    </div>

                    <button 
                      onClick={() => removeFeatured(item.id)}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm ml-2 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Experiences */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-6">Available Inventory</h2>
            
            {/* Search */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search experiences..." 
                className="w-full bg-gray-50 border border-gray-200 text-[#0F1117] rounded-[24px] pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#E2F18A] focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[600px]">
              {filteredAvailable.map(item => (
                <div key={item.id} className="flex items-center bg-white rounded-[24px] p-3 border border-gray-100 hover:border-gray-300 transition-all hover:shadow-sm">
                  <div className="w-16 h-16 rounded-[16px] overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-md leading-tight">{item.title}</h3>
                    <p className="text-gray-500 text-sm">{item.location}</p>
                  </div>

                  <button 
                    onClick={() => addFeatured(item.id)}
                    disabled={featured.length >= 4}
                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#0F1117] hover:bg-[#E2F18A] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
              
              {filteredAvailable.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No experiences found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FeaturedDashboard;
