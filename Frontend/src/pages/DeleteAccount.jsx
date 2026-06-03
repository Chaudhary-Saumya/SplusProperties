import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Lock, Database, Trash2, Mail, Info, LogIn, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Account Deletion",
      subtitle: "Kharsan Properties Deletion Portal",
      introTitle: "1. Overview",
      introText: "Kharsan Properties allows users to permanently delete their account. Once deleted, your account cannot be recovered and all active sessions will be terminated.",
      stepsTitle: "2. Deletion Steps",
      steps: [
        "Login to your account.",
        "Go to Dashboard → Settings.",
        "Scroll to the Danger Zone section.",
        "Click \"Delete My Account\".",
        "Confirm account deletion."
      ],
      dataDeletedTitle: "3. Data Permanently Deleted",
      dataDeletedDesc: "The following records will be permanently and irreversibly purged from our live database servers:",
      dataDeletedList: [
        "Profile information",
        "Saved properties & favorites",
        "Reviews & feedback",
        "Property listings",
        "Inquiries sent & received"
      ],
      dataRetentionTitle: "4. Data Retention Policy",
      dataRetentionText: "Certain transaction records, financial ledger entries, or logs may be retained for legal compliance, security audits, or fraud prevention purposes where required by law.",
      supportTitle: "5. Manual Deletion Requests",
      supportText: "If you cannot access your account or need manual purging, please contact our support desk at:",
      btnProceed: "Proceed to Account Deletion",
      btnLogin: "Login to Delete Account",
      badgeTitle: "Data Purge Control",
      goBack: "Go Back"
    },
    gu: {
      title: "એકાઉન્ટ કાઢી નાખવું",
      subtitle: "ખરસણ પ્રોપર્ટીઝ એકાઉન્ટ ડિલીશન પોર્ટલ",
      introTitle: "૧. વિહંગાવલોકન (Overview)",
      introText: "ખરસણ પ્રોપર્ટીઝ વપરાશકર્તાઓને તેમનું એકાઉન્ટ કાયમી ધોરણે કાઢી નાખવાની મંજૂરી આપે છે. એકવાર કાઢી નાખ્યા પછી, તમારું એકાઉન્ટ પુનઃપ્રાપ્ત કરી શકાશે નહીં અને તમામ સક્રિય સત્રો સમાપ્ત થઈ જશે.",
      stepsTitle: "૨. એકાઉન્ટ કાઢી નાખવાના પગલાં",
      steps: [
        "તમારા એકાઉન્ટમાં લોગિન કરો.",
        "ડેશબોર્ડ → સેટિંગ્સ પર જાઓ.",
        "ડેન્જર ઝોન વિભાગ પર જાઓ.",
        "\"મારું એકાઉન્ટ કાઢી નાખો\" પર ક્લિક કરો.",
        "એકાઉન્ટ ડિલીશન કન્ફર્મ કરો."
      ],
      dataDeletedTitle: "૩. કાયમી ધોરણે ડિલીટ કરેલ ડેટા",
      dataDeletedDesc: "નીચેના રેકોર્ડ્સ અમારા લાઇવ ડેટાબેઝ સર્વર્સમાંથી કાયમી ધોરણે અને અફર રીતે ભૂંસી નાખવામાં આવશે:",
      dataDeletedList: [
        "પ્રોફાઇલ માહિતી",
        "સાચવેલી મિલકતો અને મનપસંદ યાદી",
        "રિવ્યુઝ અને પ્રતિસાદ",
        "પ્રોપર્ટી લિસ્ટિંગ્સ",
        "મોકલેલી અને મેળવેલી પૂછપરછ"
      ],
      dataRetentionTitle: "૪. ડેટા જાળવણી નીતિ",
      dataRetentionText: "કાનૂની પાલન, સુરક્ષા ઓડિટ અથવા છેતરપિંડી નિવારણ હેતુઓ માટે કાયદા દ્વારા જ્યાં જરૂરી હોય ત્યાં ચોક્કસ વ્યવહાર રેકોર્ડ્સ અથવા નાણાકીય ખાતાવહીઓ જાળવી રાખવામાં આવી શકે છે.",
      supportTitle: "૫. મેન્યુઅલ એકાઉન્ટ ડિલીશન વિનંતી",
      supportText: "જો તમે તમારા એકાઉન્ટને એક્સેસ કરી શકતા નથી અથવા મેન્યુઅલ ડિલીશનની જરૂર છે, તો કૃપા કરીને અમારા સપોર્ટ ડેસ્ક પર સંપર્ક કરો:",
      btnProceed: "એકાઉન્ટ ડિલીશન માટે આગળ વધો",
      btnLogin: "એકાઉન્ટ ડિલીટ કરવા માટે લોગિન કરો",
      badgeTitle: "ડેટા પર્જ કંટ્રોલ",
      goBack: "પાછા જાઓ"
    }
  };

  const activeContent = content[language] || content.en;

  const handleActionClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard?tab=settings&action=delete');
    } else {
      navigate('/login?redirect=/dashboard?tab=settings%26action=delete');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5ee] font-['Nunito_Sans',sans-serif] text-[#1a2340]">
      <SEO 
        title={`${activeContent.title} • Kharsan Properties`} 
        description="Learn how to delete your Kharsan Properties account, what data is permanently wiped, and our data retention standards." 
      />

      {/* Hero Header Section */}
      <div className="bg-[#1a2340] text-white px-6 py-16 md:py-20 relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        
        {/* Luxury top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#c9a84c] text-[10px] font-black uppercase tracking-[0.2em] mb-6 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-white/10"
          >
            <ArrowLeft size={12} />
            <span>{activeContent.goBack}</span>
          </button>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg">
              <ShieldAlert size={32} className="text-red-500" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            {activeContent.title}
          </h1>
          <p className="text-[#c9a84c] text-xs md:text-sm font-semibold max-w-xl mx-auto uppercase tracking-widest leading-relaxed">
            {activeContent.subtitle}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-[#e2d9c5] rounded-3xl p-6 md:p-10 shadow-sm space-y-10"
        >
          {/* Action Callout Button */}
          <div className="bg-[#fffdf9] border-2 border-dashed border-[#e2d9c5] rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-[#1a2340] mb-3">
              {isAuthenticated ? "Ready to Deactivate or Delete?" : "Begin Deletion Process"}
            </h3>
            <button
              onClick={handleActionClick}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-md hover:scale-[1.02] active:scale-95 ${
                isAuthenticated 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white"
              }`}
            >
              {isAuthenticated ? <Trash2 size={16} /> : <LogIn size={16} />}
              <span>{isAuthenticated ? activeContent.btnProceed : activeContent.btnLogin}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* 1. Introduction */}
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#1a2340] mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Info size={16} className="text-[#c9a84c]" /> {activeContent.introTitle}
            </h2>
            <p className="text-slate-600 font-semibold text-sm leading-relaxed">
              {activeContent.introText}
            </p>
          </div>

          {/* 2. Deletion Steps */}
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#1a2340] mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Lock size={16} className="text-[#c9a84c]" /> {activeContent.stepsTitle}
            </h2>
            <div className="relative border-l-2 border-[#f0ebe0] ml-3 pl-6 space-y-6">
              {activeContent.steps.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-[#1a2340] border-2 border-[#c9a84c] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </div>
                  <p className="text-slate-700 font-bold text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Data Purged */}
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#1a2340] mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Trash2 size={16} className="text-red-500" /> {activeContent.dataDeletedTitle}
            </h2>
            <p className="text-slate-600 font-semibold text-sm leading-relaxed mb-4">
              {activeContent.dataDeletedDesc}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeContent.dataDeletedList.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 bg-red-50/50 border border-red-100/50 rounded-xl px-4 py-2.5 text-slate-700 font-semibold text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Data Retention */}
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#1a2340] mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Database size={16} className="text-[#c9a84c]" /> {activeContent.dataRetentionTitle}
            </h2>
            <p className="text-slate-600 font-semibold text-sm leading-relaxed bg-[#fdfaf5] border border-[#e2d9c5] rounded-2xl p-4">
              {activeContent.dataRetentionText}
            </p>
          </div>

          {/* 5. Support / Assistance */}
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#1a2340] mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-[#f0ebe0] pb-2">
              <Mail size={16} className="text-[#c9a84c]" /> {activeContent.supportTitle}
            </h2>
            <p className="text-slate-600 font-semibold text-sm leading-relaxed mb-3">
              {activeContent.supportText}
            </p>
            <div className="bg-[#1a2340] text-white border border-[#c9a84c]/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center">
                  <Mail size={18} className="text-[#c9a84c]" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-[#c9a84c] tracking-wider">Email Support</div>
                  <a href="mailto:support@kharsan.com" className="text-sm font-bold hover:underline">
                    support@kharsan.com
                  </a>
                </div>
              </div>
              <a
                href="mailto:support@kharsan.com"
                className="bg-[#c9a84c] hover:bg-[#b8933a] text-[#1a1200] font-extrabold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all"
              >
                Contact
              </a>
            </div>
          </div>
        </motion.div>

        {/* Brand footer tag */}
        <div className="text-center mt-12">
          <p className="text-[#1a2340]/40 text-[10px] font-black tracking-[4px] uppercase">
            Kharsan Properties &bull; {activeContent.badgeTitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
