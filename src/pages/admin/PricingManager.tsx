import React, { useState } from 'react';
import { 
  Percent, 
  Link as LinkIcon, 
  Settings, 
  Save, 
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Globe
} from 'lucide-react';

// Mock Data
const MOCK_MARKUP = {
  defaultMarkup: 15, // 15%
  flightMarkup: 5, // 5%
  hotelMarkup: 12, // 12%
  activityMarkup: 20, // 20%
};

const MOCK_AFFILIATES = [
  { id: '1', name: 'GetYourGuide', partnerId: 'GYG_12345', status: 'active', url: 'https://getyourguide.com/partner/GYG_12345' },
  { id: '2', name: 'Booking.com', partnerId: 'BKG_9876', status: 'active', url: 'https://booking.com/?aid=BKG_9876' },
  { id: '3', name: 'Viator', partnerId: 'VIA_5544', status: 'inactive', url: 'https://viator.com/?pid=VIA_5544' },
];

export default function PricingManager() {
  const [markup, setMarkup] = useState(MOCK_MARKUP);
  const [affiliates, setAffiliates] = useState(MOCK_AFFILIATES);

  const handleMarkupChange = (field: keyof typeof MOCK_MARKUP, value: string) => {
    setMarkup(prev => ({ ...prev, [field]: Number(value) }));
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#0F1117] p-8 font-urbanist">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pricing & Affiliates</h1>
            <p className="text-gray-500 mt-1 text-lg">Manage global markup rules and affiliate partnerships.</p>
          </div>
          <button className="flex items-center gap-2 bg-[#E2F18A] text-[#0F1117] px-6 py-3 rounded-full font-semibold hover:bg-[#d4e275] transition-colors shadow-sm">
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Markup Configuration */}
          <div className="lg:col-span-1 space-y-8">
            {/* Global Markup Card */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#F0F2F5] rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-[#0F1117]" />
                </div>
                <h2 className="text-xl font-bold">Global Markup</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Default Global Markup (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-[#F0F2F5] border-none rounded-2xl py-3 px-4 pl-10 text-[#0F1117] font-medium focus:ring-2 focus:ring-[#E2F18A] outline-none transition-all"
                      value={markup.defaultMarkup}
                      onChange={(e) => handleMarkupChange('defaultMarkup', e.target.value)}
                    />
                    <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Applied when no category-specific rule exists.</p>
                </div>
              </div>
            </div>

            {/* Category Rules Card */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#F0F2F5] rounded-2xl">
                  <Settings className="w-6 h-6 text-[#0F1117]" />
                </div>
                <h2 className="text-xl font-bold">Category Rules</h2>
              </div>
              
              <div className="space-y-5">
                {[
                  { id: 'flightMarkup', label: 'Flights' },
                  { id: 'hotelMarkup', label: 'Hotels' },
                  { id: 'activityMarkup', label: 'Activities & Tours' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <label className="text-sm font-semibold text-gray-700">{item.label}</label>
                    <div className="relative w-32">
                      <input 
                        type="number" 
                        className="w-full bg-[#F0F2F5] border-none rounded-xl py-2 px-3 pr-8 text-right text-[#0F1117] font-medium focus:ring-2 focus:ring-[#E2F18A] outline-none transition-all"
                        value={markup[item.id as keyof typeof MOCK_MARKUP]}
                        onChange={(e) => handleMarkupChange(item.id as keyof typeof MOCK_MARKUP, e.target.value)}
                      />
                      <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Affiliate Links */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[28px] p-8 shadow-sm border border-gray-100 h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#F0F2F5] rounded-2xl">
                    <LinkIcon className="w-6 h-6 text-[#0F1117]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Affiliate Networks</h2>
                    <p className="text-sm text-gray-500">Manage external partners (e.g. GetYourGuide, Booking.com)</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-[#F0F2F5] text-[#0F1117] px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Partner
                </button>
              </div>

              <div className="space-y-4">
                {affiliates.map((affiliate) => (
                  <div key={affiliate.id} className="p-5 rounded-2xl border border-gray-100 bg-[#F8F9FA] hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg">{affiliate.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            affiliate.status === 'active' 
                              ? 'bg-[#E2F18A]/30 text-[#0F1117]' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {affiliate.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <Globe className="w-4 h-4" />
                          <span>Partner ID: <strong className="text-gray-700">{affiliate.partnerId}</strong></span>
                        </div>
                        <div className="w-full relative">
                          <input 
                            type="text" 
                            className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-600 focus:ring-2 focus:ring-[#E2F18A] outline-none"
                            value={affiliate.url}
                            readOnly
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-[#0F1117] hover:bg-gray-200 rounded-full transition-colors">
                          <Settings className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary / Preview */}
              <div className="mt-8 p-6 bg-[#0F1117] text-white rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-[#E2F18A]" />
                  <h3 className="text-lg font-bold">Revenue Preview</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Based on your current markup settings, here is a preview of the revenue breakdown for a standard booking.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Base Price</div>
                    <div className="text-xl font-bold">$1,000</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Flights (+{markup.flightMarkup}%)</div>
                    <div className="text-xl font-bold text-[#E2F18A]">+$50</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Hotels (+{markup.hotelMarkup}%)</div>
                    <div className="text-xl font-bold text-[#E2F18A]">+$120</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Activities (+{markup.activityMarkup}%)</div>
                    <div className="text-xl font-bold text-[#E2F18A]">+$200</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
