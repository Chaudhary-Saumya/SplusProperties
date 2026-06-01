import React from 'react';
import { Shield, ArrowLeft, Lock, Database, Eye, Trash2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f5ee] font-['Nunito_Sans',sans-serif] text-[#1a2340]">
      <SEO 
        title="Privacy Policy &bull; Kharsan Properties" 
        description="Learn how Kharsan Properties collects, protects, and handles your personal information, listing data, and token payment details in compliance with app store requirements." 
      />

      {/* Hero Header Section */}
      <div className="bg-[#1a2340] text-white px-6 py-16 md:py-20 relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        
        {/* Luxury top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#c9a84c] text-[10px] font-black uppercase tracking-[0.2em] mb-6 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-white/10"
          >
            <ArrowLeft size={12} />
            <span>Go Back</span>
          </button>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center shadow-lg">
              <Shield size={32} className="text-[#c9a84c]" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Privacy <span className="text-[#c9a84c]">Policy</span>
          </h1>
          <p className="text-white/50 text-xs md:text-sm font-semibold max-w-xl mx-auto uppercase tracking-widest leading-relaxed">
            Effective Date: June 1, 2026 &bull; Kharsan Properties Privacy Standard
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-[#e2d9c5] rounded-3xl p-6 md:p-10 shadow-sm space-y-12"
        >
          {/* Introduction */}
          <div>
            <h2 className="text-xl font-bold text-[#1a2340] mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Lock size={18} className="text-[#c9a84c]" /> 1. Introduction
            </h2>
            <p className="text-slate-600 font-semibold text-sm leading-relaxed">
              Kharsan Properties values your privacy and is dedicated to protecting your personal data. This Privacy Policy details our practices concerning the collection, use, security, and deletion of information gathered via our mobile application and online dashboard. By accessing Kharsan Properties, you consent to the operations outlined in this standard.
            </p>
          </div>

          {/* Information Collection */}
          <div>
            <h2 className="text-xl font-bold text-[#1a2340] mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Database size={18} className="text-[#c9a84c]" /> 2. Information We Collect
            </h2>
            <div className="space-y-4 text-slate-600 font-semibold text-sm leading-relaxed">
              <p>We process standard identifiers and operational telemetry to offer a secure land listing and token reservation service:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-[#1a2340]">Account Identifiers:</strong> Your full name, email address, phone number, password hash, and active user role (Buyer, Seller, or Broker).</li>
                <li><strong className="text-[#1a2340]">Google Sign-In:</strong> If you use Google Authenticated sign-in, we collect the basic profile payload (OAuth email address, name, and profile picture URL).</li>
                <li><strong className="text-[#1a2340]">Property Details:</strong> If you post a listing, we collect title descriptions, price tiers, area measurements, geospatial GPS coordinates, plot attributes, and visual assets.</li>
                <li><strong className="text-[#1a2340]">Financial Payout Channels:</strong> Bank names, UPI IDs, holder details, and IFSC routing numbers supplied by Sellers to receive reservation tokens.</li>
                <li><strong className="text-[#1a2340]">Access & Devices:</strong> IP address location metadata, OS version (Android/iOS), browser identifiers, and active JWT session timings.</li>
              </ul>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div>
            <h2 className="text-xl font-bold text-[#1a2340] mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Eye size={18} className="text-[#c9a84c]" /> 3. Processing and Utilization
            </h2>
            <div className="space-y-4 text-slate-600 font-semibold text-sm leading-relaxed">
              <p>Your collected information is processed strictly for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To initialize, verify, and authenticate user accounts using OTPs or Google OAuth integrations.</li>
                <li>To enable Sellers and Brokers to publish, update, and manage property listings securely.</li>
                <li>To process digital land reservations and secure buyer leads using up-to-date payment gateways.</li>
                <li>To display precise boundary structures and plot locations via interactive OpenStreetMap frameworks.</li>
                <li>To provide live updates, system warnings, and account status telemetry via real-time WebSocket messaging.</li>
              </ul>
            </div>
          </div>

          {/* Account and Data Deletion (App Store Guidelines compliance) */}
          <div>
            <h2 className="text-xl font-bold text-[#1a2340] mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Trash2 size={18} className="text-red-500" /> 4. Data Purging & Deletion
            </h2>
            <div className="space-y-4 text-slate-600 font-semibold text-sm leading-relaxed">
              <p>
                In strict compliance with Google Play Store and Apple App Store user data control guidelines, we provide a complete self-service account deletion channel inside the application dashboard:
              </p>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-950 text-xs font-semibold">
                ⚠️ <strong className="text-red-900">Danger Zone Action:</strong> When you execute "Delete My Account" in the Dashboard Settings, the system immediately triggers a full wipe of your data records. All user credentials, listed properties, mapped configurations, token transaction receipts, and received inquiry lists will be permanently and irreversibly purged from our live database servers within 24 hours.
              </div>
              <p>
                If you are unable to log in and wish to request account deletion manually, you can submit a written request to <a href="mailto:support@kharsan.com" className="text-[#c9a84c] underline font-bold">support@kharsan.com</a>. We will process your identity verification and purge all associated records within 7 business days.
              </p>
            </div>
          </div>

          {/* Third-Party Transfers */}
          <div>
            <h2 className="text-xl font-bold text-[#1a2340] mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Shield size={18} className="text-[#c9a84c]" /> 5. Third-Party Integrations & Transfers
            </h2>
            <p className="text-slate-600 font-semibold text-sm leading-relaxed">
              We do not sell, rent, or lease your personal identifiers to marketing brokers. We share operational tokens exclusively with essential third-party service nodes, including payment processing gateways, reverse geocoding engines (Nominatim OpenStreetMap), and web-socket streaming networks. All data pipelines are secured with high-grade HTTPS / SSL transport encryption.
            </p>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-bold text-[#1a2340] mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Mail size={18} className="text-[#c9a84c]" /> 6. Privacy Concerns & Contact
            </h2>
            <div className="space-y-3 text-slate-600 font-semibold text-sm leading-relaxed">
              <p>If you have any inquiries, security reviews, or requests regarding this Privacy Policy, please contact our support desk:</p>
              <div className="bg-[#fdfaf5] border border-[#e2d9c5] rounded-2xl p-5 space-y-2">
                <p>💡 <strong className="text-[#1a2340]">Company:</strong> Kharsan Properties (A Unit of Kharsan IT Solution)</p>
                <p>📧 <strong className="text-[#1a2340]">Email Desk:</strong> <a href="mailto:support@kharsan.com" className="text-[#c9a84c] underline font-bold">support@kharsan.com</a></p>
                <p>🌐 <strong className="text-[#1a2340]">Support URL:</strong> <a href="https://properties.kharsan.com" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] underline font-bold">properties.kharsan.com</a></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Brand footer tag */}
        <div className="text-center mt-12">
          <p className="text-[#1a2340]/40 text-[10px] font-black tracking-[4px] uppercase">
            Kharsan Properties &bull; Secured Land Tiers
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
