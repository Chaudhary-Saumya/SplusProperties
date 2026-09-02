import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, RotateCcw, Delete, Calculator as CalcIcon, X, Percent, Divide, Plus, Minus, Equal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const Calculator = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [display, setDisplay] = useState('0');
  const [formula, setFormula] = useState('');
  const [history, setHistory] = useState([]);
  const [isDone, setIsDone] = useState(false);

  const handleNumber = useCallback((num) => {
    if (isDone) {
      setDisplay(num.toString());
      setIsDone(false);
    } else {
      setDisplay(prev => (prev === '0' ? num.toString() : prev + num));
    }
  }, [isDone]);

  const handleOperator = useCallback((op) => {
    if (display === 'Error') return;

    if (display === '0' && formula !== '' && !isDone) {
      setFormula(prev => prev.trim().split(' ').slice(0, -1).join(' ') + ' ' + op + ' ');
      return;
    }

    if (isDone) {
      setFormula(display + ' ' + op + ' ');
      setIsDone(false);
    } else {
      setFormula(prev => prev + display + ' ' + op + ' ');
    }
    setDisplay('0');
  }, [display, isDone, formula]);

  const calculate = useCallback(() => {
    try {
      const fullFormula = formula + display;

      const result = new Function('return ' + fullFormula.replace('×', '*').replace('÷', '/'))();
      const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '');

      const newEntry = {
        formula: fullFormula,
        result: formattedResult,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => [newEntry, ...prev.slice(0, 6)]);
      setDisplay(formattedResult);
      setFormula('');
      setIsDone(true);
    } catch (error) {
      setDisplay('Error');
      setFormula('');
    }
  }, [display, formula]);

  const clear = () => {
    setDisplay('0');
    setFormula('');
    setIsDone(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay((val / 100).toString());
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      if (e.key === '.') handleNumber('.');
      if (e.key === '+') handleOperator('+');
      if (e.key === '-') handleOperator('-');
      if (e.key === '*') handleOperator('×');
      if (e.key === '/') handleOperator('÷');
      if (e.key === 'Enter' || e.key === '=') calculate();
      if (e.key === 'Escape') clear();
      if (e.key === 'Backspace') backspace();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleOperator, calculate]);

  const buttons = [
    { label: 'AC', action: clear, type: 'special' },
    { label: 'DEL', action: backspace, type: 'special', icon: <Delete size={18} /> },
    { label: '%', action: handlePercent, type: 'special', icon: <Percent size={18} /> },
    { label: '÷', action: () => handleOperator('÷'), type: 'operator', icon: <Divide size={20} /> },

    { label: '7', action: () => handleNumber(7), type: 'num' },
    { label: '8', action: () => handleNumber(8), type: 'num' },
    { label: '9', action: () => handleNumber(9), type: 'num' },
    { label: '×', action: () => handleOperator('×'), type: 'operator', icon: <X size={20} /> },

    { label: '4', action: () => handleNumber(4), type: 'num' },
    { label: '5', action: () => handleNumber(5), type: 'num' },
    { label: '6', action: () => handleNumber(6), type: 'num' },
    { label: '-', action: () => handleOperator('-'), type: 'operator', icon: <Minus size={20} /> },

    { label: '1', action: () => handleNumber(1), type: 'num' },
    { label: '2', action: () => handleNumber(2), type: 'num' },
    { label: '3', action: () => handleNumber(3), type: 'num' },
    { label: '+', action: () => handleOperator('+'), type: 'operator', icon: <Plus size={20} /> },

    { label: '0', action: () => handleNumber(0), type: 'num' },
    { label: '.', action: () => handleNumber('.'), type: 'num' },
    { label: '=', action: calculate, type: 'equal', icon: <Equal size={24} />, span: 2 },
  ];

  return (
    <div className="w-full bg-slate-100/70 font-['Nunito_Sans',sans-serif] pb-12 antialiased">
      <SEO
        title="Land Price & Valuation Calculator"
        description="Calculate land rates, total valuation, registry fees, and token booking payments instantly."
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Nunito+Sans:wght@400;500;600;700;800;900&display=swap');

        .calc-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .calc-btn {
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          user-select: none;
        }

        @media (min-width: 640px) {
          .calc-btn {
            height: 52px;
            font-size: 18px;
          }
          .calc-grid {
            gap: 12px;
          }
        }

        .calc-btn:active {
          transform: scale(0.94);
        }

        .btn-num {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .btn-num:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn-operator {
          background: #f0f5ff;
          color: #2563eb;
          border: 1px solid #dbeaff;
        }
        .btn-operator:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }

        .btn-special {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .btn-special:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .btn-equal {
          background: linear-gradient(135deg, #c9a84c 0%, #b8933a 100%);
          color: #ffffff;
          box-shadow: 0 6px 18px rgba(201,168,76,0.35);
        }
        .btn-equal:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(201,168,76,0.45);
        }
      `}</style>

      {/* Top Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Back Link & Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-slate-700 font-extrabold text-xs uppercase tracking-wider hover:text-[#c9a84c] transition-colors bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
            >
              <ArrowLeft size={14} /> {t('calculator.go_back')}
            </button>

            <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-400/40 text-[#b8933a] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              <Sparkles size={12} className="text-amber-500" />
              <span>{t('calculator.smart_tool')}</span>
            </span>
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mb-1.5 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {t('calculator.financial_calculator')}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-xl mx-auto">
              {t('calculator.subtitle')}
            </p>
          </div>
        </div>

        {/* Calculator & History Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Calculator Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl shadow-xl p-5 sm:p-6 space-y-4 relative overflow-hidden text-slate-900">
            <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
              <CalcIcon size={90} color="#c9a84c" />
            </div>

            {/* Display Screen */}
            <div className="bg-[#1a2340] border border-slate-800 rounded-2xl p-4 sm:p-5 text-right min-h-[95px] flex flex-col justify-end shadow-inner relative overflow-hidden">
              <div className="text-xs font-mono font-bold text-amber-400/90 tracking-widest mb-1 h-5 overflow-hidden text-ellipsis">
                {formula}
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-mono overflow-hidden whitespace-nowrap text-ellipsis tracking-tight">
                {display}
              </div>
            </div>

            {/* Buttons Grid */}
            <div className="calc-grid">
              {buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.action}
                  className={`calc-btn btn-${btn.type}`}
                  style={btn.span ? { gridColumn: `span ${btn.span}` } : {}}
                >
                  {btn.icon || btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* History & Tips Panel */}
          <div className="lg:col-span-5 space-y-4">

            {/* Calculation History Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <History size={18} className="text-amber-500" /> {t('calculator.history')}
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer rounded-lg hover:bg-rose-50"
                    title="Clear History"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 space-y-1">
                      <CalcIcon size={36} className="mx-auto text-slate-300 opacity-60" />
                      <p className="font-extrabold text-xs text-slate-500">{t('calculator.no_history')}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{t('calculator.calculations_appear_here')}</p>
                    </div>
                  ) : (
                    history.map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="p-3 bg-slate-50/80 border-l-4 border-amber-500 border border-slate-200/80 rounded-2xl shadow-2xs space-y-0.5"
                      >
                        <div className="flex justify-between items-center text-[10px] font-extrabold">
                          <span className="text-slate-400">{entry.timestamp}</span>
                          <span className="text-amber-600 font-mono">{entry.formula}</span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-slate-900 text-right font-mono">
                          = {entry.result}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Pro Tips Card */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-[#1a2340] rounded-3xl text-white shadow-xl space-y-2 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest">
                <Sparkles size={15} />
                <span>{t('calculator.pro_tip')}</span>
              </div>
              <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                {t('calculator.tip_desc')}
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Calculator;
