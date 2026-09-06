import React, { useEffect, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';

import { AnimatePresence, motion } from 'framer-motion';
import ScrollToTopOnRouteChange from './components/ScrollToTopOnRouteChange';


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
        .catch(() => { });
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
import MyListings from './pages/MyListings';
import BuyerLeads from './pages/BuyerLeads';
import AccountSettings from './pages/AccountSettings';
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
import Calculator from './pages/Calculator';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DeleteAccount from './pages/DeleteAccount';
import RewardsWallet from './pages/RewardsWallet';
import CompleteProfileModal from './components/CompleteProfileModal';
import AppUpdateChecker from './components/AppUpdateChecker';
import FirstTimeAppModal from './components/FirstTimeAppModal';
import NetworkStatusBanner from './components/NetworkStatusBanner';
import { triggerInstallBonus } from './utils/rewards';

import { AuthContext } from './context/AuthContext';
import socket from './utils/socket';

import { initNotificationService, scheduleSmartRetentionNotifications, clearRetentionReminders } from './services/notificationService';
import { App as CapacitorApp } from '@capacitor/app';

function NotificationManager() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    initNotificationService(navigate);

    // Listen for app state changes (active vs background)
    let listenerHandle;
    try {
      listenerHandle = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App went to background -> schedule smart retention alerts (Zepto/Zomato style)
          scheduleSmartRetentionNotifications();
        } else {
          // App returned to foreground -> clear reminders
          clearRetentionReminders();
        }
      });
    } catch (err) {
      // Non-Capacitor environment
    }

    return () => {
      listenerHandle?.then(h => h.remove?.()).catch(() => { });
    };
  }, [navigate]);

  return null;
}

function SocketManager() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    triggerInstallBonus();
  }, []);

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join', user.id || user._id);
    } else {
      socket.connect(); // Connect as guest for public broadcast alerts
    }

    const handleBroadcastPush = (notif) => {
      if (!notif) return;
      toast.info(
        <div
          onClick={() => {
            const targetRoute = notif.data?.route || '/search';
            if (targetRoute) navigate(targetRoute);
          }}
          className="cursor-pointer"
        >
          <div className="font-extrabold text-slate-900 text-sm">{notif.title}</div>
          <div className="text-xs text-slate-600 font-medium mt-0.5">{notif.body}</div>
        </div>,
        {
          autoClose: 6000,
          icon: '🔔'
        }
      );
    };

    socket.on('broadcast_push_notification', handleBroadcastPush);

    return () => {
      socket.off('broadcast_push_notification', handleBroadcastPush);
      socket.disconnect();
    };
  }, [user, navigate]);

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

const hasPhoneNumber = (user) => {
  if (!user) return false;

  return Boolean(
    user.phone ||
    user.mobileNumber ||
    user.mobile ||
    user.phoneNumber
  );
};

const needsProfileCompletion = (user) => {
  if (!user) return false;
  return !hasPhoneNumber(user);
};

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (needsProfileCompletion(user)) return <Navigate to="/" replace />;
  if (requireAdmin && user?.role !== 'Admin') return <Navigate to="/" replace />;

  return children;
}

function GuestRoute({ children }) {
  const { user, loading, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null;
  if (isAuthenticated && user) {
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect');
    if (redirectPath && redirectPath.startsWith('/')) {
      return <Navigate to={redirectPath} replace />;
    }
    if (user.role === 'Admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

function GlobalProfileCompletionGate() {
  const { user, loading, isAuthenticated, completeProfile } = useContext(AuthContext);
  const location = useLocation();
  const [error, setError] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const hiddenPaths = ['/login', '/register', '/verify-otp', '/forgot-password'];
  const shouldHideModal = hiddenPaths.some(path => location.pathname.startsWith(path));
  const shouldShowModal = !loading && isAuthenticated && !shouldHideModal && !isDismissed && needsProfileCompletion(user);

  const handleProfileComplete = async (profileData) => {
    try {
      setError(null);
      await completeProfile(profileData);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || 'Profile completion failed. Please try again.';
      setError(serverMsg);
      throw err;
    }
  };

  if (!shouldShowModal) return null;

  return (
    <CompleteProfileModal
      isOpen={shouldShowModal}
      user={user}
      onComplete={handleProfileComplete}
      onClose={() => setIsDismissed(true)}
      error={error}
    />
  );
}

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const hidePaths = ['/boundary-map', '/m/'];
  const shouldHide = hidePaths.some(path => location.pathname.startsWith(path));

  return (
    <div className={`app-wrapper ${!shouldHide ? 'pb-16 sm:pb-0' : ''}`}>
      {!shouldHide && <Navbar />}
      <main>
        {children}
      </main>
    </div>
  );
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // ── Capacitor Back Button Handling ─────────────────────────────
    // This logic ensures the app goes back in history instead of exiting
    // on every back button press.
    const backListener = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        // If we are on the home page, exit the app
        CapacitorApp.exitApp();
      } else {
        // Otherwise, go back one step in history
        navigate(-1);
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check both key and keyCode (F9 is 120) for better compatibility
      if (e.key === 'F9' || e.keyCode === 120) {
        e.preventDefault();
        navigate('/calculator');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Global Referral Code URL listener (e.g. ?ref=KP1W4NES)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const ref = searchParams.get('ref');
      if (ref) {
        localStorage.setItem('pending_referral_code', ref.trim().toUpperCase());
      }
    } catch (err) {
      // Ignore
    }
  }, [location.search]);

  return (
    <LayoutWrapper>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/brokers" element={<Brokers />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/verify-otp" element={<GuestRoute><VerifyOTP /></GuestRoute>} />
            <Route path="/listings/:id" element={<PropertyDetails />} />
            <Route path="/listing/:id" element={<PropertyDetails />} />
            <Route path="/land/:location/:id" element={<PropertyDetails />} />
            <Route path="/dashboard" element={<Navigate to="/my-listings" replace />} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/my-properties" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/buyer-leads" element={<ProtectedRoute><BuyerLeads /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/my-visits" element={<ProtectedRoute><MyVisits /></ProtectedRoute>} />
            <Route path="/received-inquiries" element={<ProtectedRoute><ReceivedInquiries /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
            <Route path="/edit-listing/:id" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/area-converter" element={<AreaConverter />} />
            <Route path="/boundary-map" element={<BoundaryMap />} />
            <Route path="/wallet" element={<RewardsWallet />} />
            <Route path="/rewards" element={<RewardsWallet />} />
            <Route path="/saved-maps" element={<ProtectedRoute><SavedMaps /></ProtectedRoute>} />
            <Route path="/m/:shareId" element={<SharedMap />} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/account-deletion" element={<DeleteAccount />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalProfileCompletionGate />
        </motion.div>
      </AnimatePresence>
    </LayoutWrapper>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <NetworkStatusBanner />
        <AppUpdateChecker />
        <FirstTimeAppModal />
        <NotificationManager />
        <SocketManager />

        <AnalyticsTracker />
        <ScrollToTopOnRouteChange />
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={true}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover
          theme="dark"
          limit={3}
        />
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
