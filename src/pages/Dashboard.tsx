import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BedDouble, 
  Grid3X3, 
  Users, 
  ShoppingBag, 
  Package, 
  Receipt, 
  LogOut,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Types
type RoomCount = {
  total: number;
  occupied: number;
  available: number;
  cleaning: number;
  maintenance: number;
};

type Revenue = {
  today: number;
  thisWeek: number;
  thisMonth: number;
};

type DailyRevenue = {
  date: string;
  revenue: number;
};

const features = [
  { icon: BedDouble, label: 'Rooms', path: '/rooms', color: 'bg-blue-500' },
  { icon: Grid3X3, label: 'Room Matrix', path: '/rooms/matrix', color: 'bg-indigo-500' },
  { icon: Users, label: 'Booked Rooms', path: '/booked-rooms', color: 'bg-purple-500' },
  { icon: ShoppingBag, label: 'Shop', path: '/shop', color: 'bg-pink-500' },
  { icon: Package, label: 'Inventory', path: '/inventory', color: 'bg-yellow-500' },
  { icon: Receipt, label: 'Payment Logs', path: '/payments', color: 'bg-green-500' },
  { icon: LogOut, label: 'Checkout', path: '/checkout', color: 'bg-red-500' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [roomCount, setRoomCount] = useState<RoomCount>({
    total: 0,
    occupied: 0,
    available: 0,
    cleaning: 0,
    maintenance: 0
  });
  const [revenue, setRevenue] = useState<Revenue>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch room counts
      const roomsQuery = collection(db, 'rooms');
      const roomsSnapshot = await getDocs(roomsQuery);
      
      let total = 0;
      let occupied = 0;
      let available = 0;
      let cleaning = 0;
      let maintenance = 0;
      
      roomsSnapshot.forEach(doc => {
        total++;
        const status = doc.data().status;
        if (status === 'occupied') occupied++;
        else if (status === 'available') available++;
        else if (status === 'cleaning') cleaning++;
        else if (status === 'maintenance') maintenance++;
      });
      
      setRoomCount({ total, occupied, available, cleaning, maintenance });

      // Generate sample revenue data
      setRevenue({
        today: Math.floor(Math.random() * 10000) + 5000,
        thisWeek: Math.floor(Math.random() * 50000) + 25000,
        thisMonth: Math.floor(Math.random() * 200000) + 100000
      });

      // Generate sample daily revenue data for chart
      const today = new Date();
      const data = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        data.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: Math.floor(Math.random() * 10000) + 3000
        });
      }
      
      setDailyRevenue(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <BedDouble className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Room Status</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div>
                      <p className="text-xl font-bold">{roomCount.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-600">{roomCount.available}</p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-600">{roomCount.occupied}</p>
                      <p className="text-xs text-gray-500">Occupied</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 mr-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Occupancy Rate</p>
                  <div className="mt-1">
                    <p className="text-xl font-bold">
                      {roomCount.total ? Math.round((roomCount.occupied / roomCount.total) * 100) : 0}%
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${roomCount.total ? Math.round((roomCount.occupied / roomCount.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 mr-4">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Revenue</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div>
                      <p className="text-xl font-bold">₹{revenue.today.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Today</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">₹{revenue.thisWeek.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">This Week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Revenue Chart */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Revenue</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyRevenue}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Quick Access */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {features.map(({ icon: Icon, label, path, color }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 hover:bg-gray-50"
                >
                  <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Recent Activities */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">New Booking - Room 102</p>
                  <p className="text-xs text-gray-500">10 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Payment Received - ₹5,000</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Inventory Updated - Towels (50 added)</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Checkout Completed - Room 105</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;