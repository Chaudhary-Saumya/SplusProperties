import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, History, RotateCcw, Delete, Calculator as CalcIcon, X, Percent, Divide, Plus, Minus, Equal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const Calculator = () => {
  const navigate = useNavigate();
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
    
    // If user wants to change the last operator
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
      // Using a safer evaluation method
      // Using a safer evaluation method
      // eslint-disable-next-line no-new-func
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

  // Keyboard support
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
    { label: 'DEL', action: backspace, type: 'special', icon: <Delete size={20} /> },
    { label: '%', action: handlePercent, type: 'special', icon: <Percent size={20} /> },
    { label: '÷', action: () => handleOperator('÷'), type: 'operator', icon: <Divide size={22} /> },
    
    { label: '7', action: () => handleNumber(7), type: 'num' },
    { label: '8', action: () => handleNumber(8), type: 'num' },
    { label: '9', action: () => handleNumber(9), type: 'num' },
    { label: '×', action: () => handleOperator('×'), type: 'operator', icon: <X size={22} /> },
    
    { label: '4', action: () => handleNumber(4), type: 'num' },
    { label: '5', action: () => handleNumber(5), type: 'num' },
    { label: '6', action: () => handleNumber(6), type: 'num' },
    { label: '-', action: () => handleOperator('-'), type: 'operator', icon: <Minus size={22} /> },
    
    { label: '1', action: () => handleNumber(1), type: 'num' },
    { label: '2', action: () => handleNumber(2), type: 'num' },
    { label: '3', action: () => handleNumber(3), type: 'num' },
    { label: '+', action: () => handleOperator('+'), type: 'operator', icon: <Plus size={22} /> },
    
    { label: '0', action: () => handleNumber(0), type: 'num' },
    { label: '.', action: () => handleNumber('.'), type: 'num' },
    { label: '=', action: calculate, type: 'equal', icon: <Equal size={26} />, span: 2 },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
      <SEO 
        title="Land Price & Valuation Calculator" 
        description="Calculate land rates, total valuation, registry fees, and token booking payments instantly." 
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');
        
        .calc-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .calc-btn {
          height: 55px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2;
          border: none;
          user-select: none;
        }
        .calc-btn:active {
          transform: scale(0.92);
        }
        .btn-num { background: #fff; color: #1a2340; border: 1px solid #e2e8f0; }
        .btn-num:hover { background: #f8fafc; border-color: #cbd5e1; }
        
        .btn-operator { background: #f8f9ff; color: #c9a84c; border: 1px solid rgba(201,168,76,0.1); }
        .btn-operator:hover { background: #f0f4ff; border-color: #c9a84c; }
        
        .btn-special { background: #f1f5f9; color: #64748b; }
        .btn-special:hover { background: #e2e8f0; color: #0f172a; }
        
        .btn-equal { 
          background: linear-gradient(135deg, #c9a84c 0%, #b8933a 100%); 
          color: #fff; 
          box-shadow: 0 8px 20px rgba(201,168,76,0.3);
        }
        .btn-equal:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(201,168,76,0.4); }
        
        .history-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e2d9c5;
          padding: 20px;
          height: 100%;
        }
      `}</style>

      <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#1a2340] font-bold text-xs uppercase tracking-wider mb-6 hover:text-[#c9a84c] transition-colors bg-transparent border-none p-0 cursor-pointer"
        >
          <ArrowLeft size={14} /> Go Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block bg-[#c9a84c]/15 border border-[#c9a84c]/40 text-[#b8933a] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Smart Tool
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a2340] mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Financial Calculator
          </h1>
          <p className="text-[#64748b] text-base font-medium">
            Accurate calculations for your property investments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Calculator */}
          <div className="lg:col-span-7 bg-white border border-[#e2e8f0] rounded-[24px] shadow-xl p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <CalcIcon size={80} color="#c9a84c" />
            </div>

            {/* Display Screen */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6 mb-6 text-right min-h-[100px] flex flex-col justify-end">
              <div className="text-xs font-bold text-[#94a3b8] tracking-widest mb-1 h-4">
                {formula}
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#1a2340] overflow-hidden whitespace-nowrap overflow-ellipsis">
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

          {/* History Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="history-card shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold text-[#1a2340] flex items-center gap-2">
                  <History size={22} className="text-[#c9a84c]" /> History
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={() => setHistory([])}
                    className="text-[#64748b] hover:text-[#dc2626] transition-colors p-1"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-[#94a3b8]">
                      <CalcIcon size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-bold">No history yet</p>
                      <p className="text-xs">Your calculations will appear here</p>
                    </div>
                  ) : (
                    history.map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 bg-[#f8f9ff] border-l-4 border-[#c9a84c] rounded-xl hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest">{entry.timestamp}</span>
                          <span className="text-xs font-bold text-[#c9a84c]">{entry.formula}</span>
                        </div>
                        <div className="text-xl font-extrabold text-[#1a2340] text-right">
                          = {entry.result}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-6 bg-[#1a2340] rounded-2xl text-white shadow-xl">
              <h4 className="text-sm font-extrabold text-[#c9a84c] uppercase tracking-widest mb-3">Pro Tip</h4>
              <p className="text-sm text-gray-300 font-medium leading-relaxed">
                Use the <span className="text-white font-bold">F9</span> key from any page on the site to quickly jump back to this calculator. You can also use your keyboard's number pad for faster inputs.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Calculator;
