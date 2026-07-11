import React, { useState } from 'react';
import { Search, Edit2, Trash2, Mail, Calendar, Map, CheckCircle, XCircle } from 'lucide-react';

// Define types for our mock data
interface Itinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  status: 'active' | 'inactive';
  itineraries: Itinerary[];
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Eleanor Shellstrop',
    email: 'eleanor@example.com',
    avatar: 'https://i.pravatar.cc/150?u=1',
    joinDate: '2023-11-15',
    status: 'active',
    itineraries: [
      { id: 'i1', destination: 'Paris, France', startDate: '2024-05-10', endDate: '2024-05-20', status: 'completed' },
      { id: 'i2', destination: 'Tokyo, Japan', startDate: '2024-10-01', endDate: '2024-10-15', status: 'active' }
    ]
  },
  {
    id: '2',
    name: 'Chidi Anagonye',
    email: 'chidi@example.com',
    avatar: 'https://i.pravatar.cc/150?u=2',
    joinDate: '2024-01-10',
    status: 'active',
    itineraries: [
      { id: 'i3', destination: 'Athens, Greece', startDate: '2024-08-12', endDate: '2024-08-26', status: 'draft' }
    ]
  },
  {
    id: '3',
    name: 'Tahani Al-Jamil',
    email: 'tahani@example.com',
    avatar: 'https://i.pravatar.cc/150?u=3',
    joinDate: '2023-09-05',
    status: 'inactive',
    itineraries: []
  },
  {
    id: '4',
    name: 'Jason Mendoza',
    email: 'jason@example.com',
    avatar: 'https://i.pravatar.cc/150?u=4',
    joinDate: '2024-02-28',
    status: 'active',
    itineraries: [
      { id: 'i4', destination: 'Jacksonville, FL', startDate: '2024-07-04', endDate: '2024-07-10', status: 'active' },
      { id: 'i5', destination: 'Miami, FL', startDate: '2024-12-25', endDate: '2024-12-31', status: 'draft' }
    ]
  }
];

export default function UsersList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-[#F0F2F5] min-h-screen font-['Urbanist',sans-serif] text-[#0F1117]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Users Management</h1>
            <p className="text-gray-500 mt-2">Manage your platform users and their travel itineraries.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 rounded-[24px] bg-white border-none shadow-sm focus:ring-2 focus:ring-[#E2F18A] outline-none w-full md:w-64 transition-all"
              />
            </div>
            <button className="bg-[#E2F18A] text-[#0F1117] font-semibold px-6 py-3 rounded-[24px] hover:bg-[#d4e47a] transition-colors shadow-sm whitespace-nowrap">
              Add User
            </button>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 flex flex-col gap-6 hover:shadow-md transition-shadow">
              
              {/* User Header */}
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#F0F2F5]" />
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {user.name}
                      {user.status === 'active' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-2 gap-4 bg-[#F0F2F5] rounded-[20px] p-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Joined</div>
                  <div className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Trips</div>
                  <div className="font-semibold flex items-center gap-2">
                    <Map className="w-4 h-4 text-gray-400" />
                    {user.itineraries.length}
                  </div>
                </div>
              </div>

              {/* Itineraries List */}
              {user.itineraries.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Recent Itineraries</h3>
                  <div className="flex flex-col gap-3">
                    {user.itineraries.map(itinerary => (
                      <div key={itinerary.id} className="flex items-center justify-between p-3 rounded-[20px] border border-gray-100 hover:border-[#E2F18A] transition-colors group">
                        <div className="flex flex-col">
                          <span className="font-bold">{itinerary.destination}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          itinerary.status === 'active' ? 'bg-[#E2F18A]/20 text-[#0F1117]' :
                          itinerary.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-[20px] p-6 text-gray-400 text-sm">
                  No itineraries yet
                </div>
              )}
              
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
