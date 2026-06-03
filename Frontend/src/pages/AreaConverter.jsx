import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, CopyCheck, History, Zap, ArrowLeftRight, RotateCcw, Download, GripVertical } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const AreaConverter = () => {
  const { language, t } = useLanguage();
  const [values, setValues] = useState({});
  const [history, setHistory] = useState([]);
  const [topInputs, setTopInputs] = useState({ hectare: '', aare: '', sqm: '' });
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Bilingual unit labels mapping
  // Note: For PDF Export we intentionally use standard English labels as standard jsPDF Helvetica fonts do not support Gujarati Unicode characters.
  const unitLabels = {
    en: {
      guntha: 'Guntha (Gutha)',
      hectare: 'Hectare (Hector)',
      aare: 'Aare',
      vigha_bada: 'Bigha (23.78 Gutha)',
      vigha_chhota: 'Bigha (16.19 Gutha)',
      acre: 'Acre',
      sqm: 'Square Meter (Sq.Mt)',
      sqft: 'Square Feet (Sqft)',
      gaj: 'Gaj / Yard / Vaar',
    },
    gu: {
      guntha: 'ગુન્ટા',
      hectare: 'હેક્ટર',
      aare: 'આરે',
      vigha_bada: 'વીઘું (મોટું - ૨૩.૭૮ ગુન્ટા)',
      vigha_chhota: 'વીઘું (નાનું - ૧૬.૧૯ ગુન્ટા)',
      acre: 'એકર',
      sqm: 'ચોરસ મીટર',
      sqft: 'ચોરસ ફૂટ',
      gaj: 'ગજ / વાર',
    }
  };

  const [orderedUnits, setOrderedUnits] = useState([
    { value: 'guntha', label: 'Guntha (Gutha)', type: 'area' },
    { value: 'hectare', label: 'Hectare (Hector)', type: 'area' },
    { value: 'aare', label: 'Aare', type: 'area' },
    { value: 'vigha_bada', label: 'Bigha (23.78 Gutha)', type: 'area' },
    { value: 'vigha_chhota', label: 'Bigha (16.19 Gutha)', type: 'area' },
    { value: 'acre', label: 'Acre', type: 'area' },
    { value: 'sqm', label: 'Square Meter (Sq.Mt)', type: 'area' },
    { value: 'sqft', label: 'Square Feet (Sqft)', type: 'area' },
    { value: 'gaj', label: 'Gaj / Yard / Vaar', type: 'area' },
  ]);

  // All conversions to Guntha (base unit based on user image)
  const toBase = {
    guntha: 1,
    hectare: 98.84,
    aare: 0.98,
    vigha_bada: 23.78,
    vigha_chhota: 16.19,
    acre: 40,
    sqm: 0.0098,
    sqft: 1/1089,
    gaj: 9/1089,
  };

  const convertToBase = (unit, value) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue === 0) return 0;
    
    // Convert from the input unit to Guntha
    const factor = toBase[unit];
    if (!factor) return 0;
    
    return numValue * factor;
  };

  const convertFromBase = (baseValue, targetUnit) => {
    if (baseValue === 0) return 0;
    
    // Convert from Guntha to the target unit
    const factor = toBase[targetUnit];
    if (!factor) return 0;
    
    return baseValue / factor;
  };

  const handleInputChange = (unit, newValue) => {
    // Clear top inputs when user edits main list
    setTopInputs({ hectare: '', aare: '', sqm: '' });

    if (newValue === '' || newValue === '-') {
      const clearedValues = {};
      orderedUnits.forEach(u => { clearedValues[u.value] = ''; });
      setValues(clearedValues);
      return;
    }

    const baseValue = convertToBase(unit, newValue);
    const newValues = {};
    orderedUnits.forEach(u => {
      const converted = convertFromBase(baseValue, u.value);
      newValues[u.value] = converted === 0 ? '' : converted.toFixed(3).replace(/\.?0+$/, '');
    });
    setValues(newValues);

    const numValue = parseFloat(newValue);
    if (numValue > 0) {
      const entry = {
        value: parseFloat(newValues[unit]).toLocaleString('en-IN', { maximumFractionDigits: 4 }),
        unit, fromValue: numValue.toLocaleString('en-IN'), fromUnit: unit,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [entry, ...prev.slice(0, 9)]);
    }
  };

  // Compound top-input handler: sum all three, drive main converter
  const handleTopInputChange = (key, newVal) => {
    const updated = { ...topInputs, [key]: newVal };
    setTopInputs(updated);

    // Sum all filled top inputs converted to Guntha
    const totalGuntha =
      (parseFloat(updated.hectare) || 0) * toBase.hectare +
      (parseFloat(updated.aare)    || 0) * toBase.aare +
      (parseFloat(updated.sqm)     || 0) * toBase.sqm;

    // If everything is empty, clear all
    const anyFilled = Object.values(updated).some(v => v !== '' && parseFloat(v) > 0);
    if (!anyFilled) {
      const clearedValues = {};
      orderedUnits.forEach(u => { clearedValues[u.value] = ''; });
      setValues(clearedValues);
      return;
    }

    // Push combined total to all units
    const newValues = {};
    orderedUnits.forEach(u => {
      const converted = convertFromBase(totalGuntha, u.value);
      newValues[u.value] = converted === 0 ? '' : converted.toFixed(3).replace(/\.?0+$/, '');
    });
    setValues(newValues);
  };

  // Initialize with default value
  useEffect(() => {
    const initialValues = {};
    orderedUnits.forEach(u => {
      initialValues[u.value] = u.value === 'guntha' ? '100' : '';
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(initialValues);
  }, []);

  // const copyResult = (unit) => {
  //   if (!values[unit]) return;
  //   navigator.clipboard.writeText(`${values[unit]} ${unit.toUpperCase().replace('_', ' ')}`);
  //   setCopied(unit);
  //   setTimeout(() => setCopied(false), 1500);
  // };

  const handleReset = () => {
    const clearedValues = {};
    orderedUnits.forEach(u => {
      clearedValues[u.value] = '';
    });
    setValues(clearedValues);
    setTopInputs({ hectare: '', aare: '', sqm: '' });
  };

  const handleExportPDF = () => {
    // Check if there's any data to export
    const hasData = Object.values(values).some(val => val !== '' && val !== '0');
    if (!hasData) {
      alert('Please enter a value to convert before exporting.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(201, 168, 76); // Gold
    doc.text('Area Conversion Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 35, 64); // Navy
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 28, { align: 'center' });
    
    // Add line
    doc.setDrawColor(201, 168, 76);
    doc.setLineWidth(0.8);
    doc.line(20, 32, pageWidth - 20, 32);
    
    // Prepare data
    const filteredUnits = orderedUnits.filter(unit => values[unit.value] && values[unit.value] !== '');
    
    // Table settings
    let yPos = 40;
    const lineHeight = 8;
    const col1Width = 90;
    const col2Width = 50;
    const col3Width = 40;
    const startX = 20;
    
    // Table header
    doc.setFillColor(26, 35, 64); // Navy
    doc.rect(startX, yPos - 5, col1Width + col2Width + col3Width, lineHeight + 2, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Unit Name', startX + 3, yPos + 2);
    doc.text('Value', startX + col1Width + 3, yPos + 2);
    doc.text('Unit', startX + col1Width + col2Width + 3, yPos + 2);
    
    yPos += lineHeight + 3;
    
    // Table rows
    doc.setFontSize(10);
    filteredUnits.forEach((unit, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, yPos - 5, col1Width + col2Width + col3Width, lineHeight, 'F');
      }
      
      // Row data
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      
      // Unit name (left aligned)
      doc.text(unit.label.substring(0, 35), startX + 3, yPos + 2);
      
      // Value (right aligned in column)
      doc.setFont('helvetica', 'bold');
      const valueText = values[unit.value];
      const valueWidth = doc.getTextWidth(valueText);
      doc.text(valueText, startX + col1Width + col2Width - 3 - valueWidth, yPos + 2);
      
      // Unit code (center)
      doc.setFont('helvetica', 'normal');
      const unitCode = unit.value.replace('_', ' ').toUpperCase();
      const unitCodeWidth = doc.getTextWidth(unitCode);
      doc.text(unitCode, startX + col1Width + col2Width + (col3Width / 2) - (unitCodeWidth / 2), yPos + 2);
      
      yPos += lineHeight;
    });
    
    // Add border around table
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(startX, 37, col1Width + col2Width + col3Width, yPos - 37);
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount} | LandSelling Area Converter`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`area-conversion-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
      <SEO 
        title={language === 'en' ? "Smart Land Area Converter & Calculator" : "સ્માર્ટ જમીન ક્ષેત્રફળ કન્વર્ટર અને કેલ્ક્યુલેટર"} 
        description="Convert land measurements instantly between Sq. Ft, Sq. Yards, Gaj, Acres, Hectares, and Sq. Meters." 
      />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-10">

        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#1a2340] font-bold text-xs uppercase tracking-wider mb-4 sm:mb-8 hover:text-[#c9a84c] transition-colors"
        >
          <ArrowLeft size={16} /> {language === 'en' ? 'Back to Home' : 'હોમ પેજ પર પાછા'}
        </Link>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
         <div className="relative inline-block mb-2 sm:mb-3">
  <button
    onClick={() => setShowMenu(!showMenu)}
    className="bg-[#c9a84c]/15 border border-[#c9a84c]/40 text-[#b8933a] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
  >
    {language === 'en' ? 'Presented by www.kharsan.com' : 'ખારસણ ડોટ કોમ દ્વારા પ્રસ્તુત'}
  </button>

  {showMenu && (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setShowMenu(false)}
      />

      <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-white border rounded-lg shadow-lg z-50 min-w-[180px]">
        <a
          href="https://www.kharsan.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center px-4 py-3 text-sm font-medium hover:bg-gray-100"
        >
          {language === 'en' ? '🌐 Visit Website' : '🌐 વેબસાઇટની મુલાકાત લો'}
        </a>
      </div>
    </>
  )}
</div>
          <h1 className="text-2xl sm:text-4xl font-bold text-[#1a2340] mb-1 sm:mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {t('tools_page.converter_title')}
          </h1>
          <p className="text-[#6b7280] text-xs sm:text-base font-medium hidden sm:block">
            {t('tools_page.converter_desc')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-5 sm:mb-8">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-white border-2 border-[#e2d9c5] text-[#1a2340] font-bold rounded-lg sm:rounded-xl hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all shadow-sm text-xs sm:text-sm"
          >
            <RotateCcw size={14} />
            {language === 'en' ? 'Reset All' : 'બધું ફરીથી સેટ કરો'}
          </button>

          {/* Reorder Toggle */}
          <button
            onClick={() => setReorderEnabled(prev => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 font-bold rounded-lg sm:rounded-xl transition-all shadow-sm text-xs sm:text-sm border-2 ${
              reorderEnabled
                ? 'bg-[#c9a84c] border-[#c9a84c] text-white shadow-[0_0_12px_rgba(201,168,76,0.4)]'
                : 'bg-white border-[#e2d9c5] text-[#1a2340] hover:border-[#c9a84c] hover:text-[#c9a84c]'
            }`}
            title={reorderEnabled ? 'Click to lock unit order' : 'Click to enable drag reordering'}
          >
            <GripVertical size={14} />
            <span>{language === 'en' ? 'Reorder Units' : 'એકમોનો ક્રમ બદલો'}</span>
            {/* Toggle pill */}
            <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-300 ${
              reorderEnabled ? 'bg-white/30' : 'bg-[#e2d9c5]'
            }`}>
              <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-300 ${
                reorderEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
              }`} />
            </span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#1a2340] to-[#2a3454] text-white font-bold rounded-lg sm:rounded-xl hover:from-[#c9a84c] hover:to-[#b8933a] transition-all shadow-md text-xs sm:text-sm"
          >
            <Download size={14} />
            {language === 'en' ? 'Export as PDF' : 'PDF તરીકે ડાઉનલોડ કરો'}
          </button>
        </div>

        {/* Main Live Converter Section */}
        <div className="bg-white border border-[#e2d9c5] rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 mb-6 sm:mb-10">

          {/* Quick Reference Top Bar — Compound Editable Inputs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
            {[
              { key: 'hectare', label: language === 'en' ? 'Hectare' : 'હેક્ટર' },
              { key: 'aare',    label: language === 'en' ? 'Aare' : 'આરે' },
              { key: 'sqm',     label: language === 'en' ? 'Sq. Meter' : 'ચોરસ મીટર' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center bg-[#faf7f0] border border-[#e2d9c5] rounded-lg sm:rounded-xl py-1.5 sm:py-2 px-1">
                <span className="text-[8px] sm:text-[9px] font-extrabold text-[#b8933a] uppercase tracking-widest mb-0.5 sm:mb-1">{label}</span>
                <input
                  type="number"
                  step="any"
                  value={topInputs[key]}
                  onChange={(e) => handleTopInputChange(key, e.target.value)}
                  className="w-full text-center text-xs sm:text-sm font-extrabold text-[#1a2340] bg-transparent focus:outline-none transition-colors placeholder:text-[#d0c5b0]"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          {/* Sum label — visible when multiple top inputs are filled */}
          {Object.values(topInputs).filter(v => v !== '' && parseFloat(v) > 0).length > 1 && (
            <div className="flex justify-end mb-4">
              <span className="text-[10px] font-bold text-[#b8933a] bg-[#fdf8ee] border border-[#e2d9c5] rounded-lg px-3 py-1">
                ∑ {language === 'en' ? 'Combined =' : 'સંયુક્ત ='} {(
                  (parseFloat(topInputs.hectare) || 0) * toBase.hectare +
                  (parseFloat(topInputs.aare)    || 0) * toBase.aare +
                  (parseFloat(topInputs.sqm)     || 0) * toBase.sqm
                ).toFixed(3).replace(/\.?0+$/, '')} {language === 'en' ? 'Guntha' : 'ગુન્ટા'}
              </span>
            </div>
          )}

          {/* Reorder hint banner */}
          {reorderEnabled && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-xl text-xs font-bold text-[#b8933a]">
              <GripVertical size={13} />
              {language === 'en' ? 'Drag units to reorder. Toggle off to lock the order.' : 'એકમોનો ક્રમ બદલવા માટે ખેંચો. લોક કરવા માટે બંધ કરો.'}
            </div>
          )}

          {reorderEnabled ? (
            <Reorder.Group axis="y" values={orderedUnits} onReorder={setOrderedUnits} className="flex flex-col gap-1 sm:gap-3">
              {orderedUnits.map((unit) => (
                <Reorder.Item
                  key={unit.value}
                  value={unit}
                  className="flex items-center justify-between group bg-white rounded-lg sm:rounded-xl p-1 sm:p-2 border border-[#e2d9c5] hover:border-[#c9a84c] transition-colors cursor-grab active:cursor-grabbing shadow-sm"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-hidden">
                    <div className="text-[#c9a84c] p-1">
                      <GripVertical size={16} />
                    </div>
                    <label className="text-[13px] sm:text-base font-bold text-[#1a2340] truncate">
                      {unitLabels[language]?.[unit.value] || unit.label}
                    </label>
                  </div>
                  <div className="w-[120px] sm:w-96 relative shrink-0 flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={values[unit.value] || ''}
                      onChange={(e) => handleInputChange(unit.value, e.target.value)}
                      className="w-full px-3 py-2 sm:px-5 sm:py-3 border-2 border-[#f0ebe0] rounded-lg sm:rounded-xl text-sm sm:text-lg font-bold text-right focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/10 transition-all bg-[#faf9f6]"
                      placeholder="0.00"
                    />
                    <div className="hidden sm:block w-20 text-right text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider truncate">
                      {unit.value.replace('vigha_', '').toUpperCase()}
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div className="flex flex-col gap-1 sm:gap-3">
              {orderedUnits.map((unit) => (
                <div
                  key={unit.value}
                  className="flex items-center justify-between bg-white rounded-lg sm:rounded-xl p-1 sm:p-2 border border-transparent hover:border-[#e2d9c5] transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-hidden">
                    {/* Locked icon replaces drag handle */}
                    <div className="text-[#d1d5db] p-1">
                      <GripVertical size={16} />
                    </div>
                    <label className="text-[13px] sm:text-base font-bold text-[#1a2340] truncate">
                      {unitLabels[language]?.[unit.value] || unit.label}
                    </label>
                  </div>
                  <div className="w-[120px] sm:w-96 relative shrink-0 flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={values[unit.value] || ''}
                      onChange={(e) => handleInputChange(unit.value, e.target.value)}
                      className="w-full px-3 py-2 sm:px-5 sm:py-3 border-2 border-[#f0ebe0] rounded-lg sm:rounded-xl text-sm sm:text-lg font-bold text-right focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/10 transition-all bg-[#faf9f6]"
                      placeholder="0.00"
                    />
                    <div className="hidden sm:block w-20 text-right text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider truncate">
                      {unit.value.replace('vigha_', '').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* You can keep your Popular Conversions, History, and Formulas sections here */}
        {/* For now, I'm including a minimal History section */}

        {history.length > 0 && (
          <section className="mb-10">
            <h3 className="text-lg font-bold text-[#1a2340] mb-4 flex items-center gap-2">
              <History size={18} className="text-[#c9a84c]" /> {language === 'en' ? 'Recent Conversions' : 'તાજેતરના રૂપાંતરણો'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.slice(0, 6).map((h, i) => (
                <div key={i} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 text-sm">
                  <div className="text-[#9ca3af] text-xs mb-1">{h.timestamp}</div>
                  <div className="font-bold">
                    {h.fromValue} {h.fromUnit} = {h.value} {h.unit}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default AreaConverter;