import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';

const trackedPaths = new Set();

function AnalyticsTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Only send hit if user stays on page for 5 seconds AND hasn't tracked this path yet
    if (trackedPaths.has(location.pathname)) return;

    const timer = setTimeout(() => {
        axios.post('/api/analytics/hit', { path: location.pathname })
          .then(() => {
            trackedPaths.add(location.pathname);
          })
          .catch(() => {});
    }, 50000); // 50 seconds to avoid 429 during dev

    return () => clearTimeout(timer);
  }, [location]);
  return null;
}
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyDetails from './pages/PropertyDetails';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import Dashboard from './pages/Dashboard';
import Favorites from './pages/Favorites';
import MyVisits from './pages/MyVisits';
import Search from './pages/Search';
import Admin from './pages/Admin';
import ReceivedInquiries from './pages/ReceivedInquiries';
import SellerProfile from './pages/SellerProfile';
import Brokers from './pages/Brokers';
import AreaConverter from './pages/AreaConverter';
import BoundaryMap from './pages/BoundaryMap';
import SharedMap from './pages/SharedMap';
import SavedMaps from './pages/SavedMaps';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import About from './pages/About';

import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import socket from './utils/socket';

function SocketManager() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join', user.id || user._id);
    } else {
      socket.disconnect();
    }

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return null;
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const hidePaths = ['/boundary-map', '/m/'];
  const shouldHide = hidePaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="app-wrapper">
      {!shouldHide && <Navbar />}
      <main>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <SocketManager />
      <AnalyticsTracker />
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={5}
        toastClassName="!rounded-2xl !shadow-lg !font-medium"
        bodyClassName="!text-sm"
      />
      <LayoutWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/brokers" element={<Brokers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/listings/:id" element={<PropertyDetails />} />
            <Route path="/land/:location/:id" element={<PropertyDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/my-visits" element={<MyVisits />} />
            <Route path="/received-inquiries" element={<ReceivedInquiries />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/edit-listing/:id" element={<EditListing />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/area-converter" element={<AreaConverter />} />
            <Route path="/boundary-map" element={<BoundaryMap />} />
            <Route path="/saved-maps" element={<SavedMaps />} />
            <Route path="/m/:shareId" element={<SharedMap />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/about" element={<About />} />
          </Routes>
      </LayoutWrapper>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
