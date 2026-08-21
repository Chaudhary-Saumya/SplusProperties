import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, CopyCheck, History, Zap, ArrowLeftRight, RotateCcw, Download, GripVertical, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { savePdfCrossPlatform } from '../utils/pdfDownloader';

const AreaConverter = () => {
  const { language, t } = useLanguage();
  const [values, setValues] = useState({});
  const [history, setHistory] = useState([]);
  const [topInputs, setTopInputs] = useState({ hectare: '', aare: '', sqm: '' });
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [totalPrice, setTotalPrice] = useState('');
  const [unitRate, setUnitRate] = useState('');
  const [priceUnit, setPriceUnit] = useState('guntha');
  const [lastEditedPriceField, setLastEditedPriceField] = useState('total');
  const [lastEditedUnit, setLastEditedUnit] = useState('guntha');

  // Bilingual unit labels mapping
  const unitLabels = {
    en: {
      guntha: 'Guntha (Gutha)',
      hectare: 'Hectare (Hector)',
      aare: 'Aare',
      vigha_bada: 'Bigha (Big - 23.78 Gutha)',
      vigha_chhota: 'Bigha (Small - 16.19 Gutha)',
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

  // All conversions to Guntha (base unit)
  const toBase = {
    guntha: 1,
    hectare: 98.84,
    aare: 0.9884,
    vigha_bada: 23.78,
    vigha_chhota: 16.19,
    acre: 40,
    sqm: 0.009884,
    sqft: 1 / 1089,
    gaj: 9 / 1089,
  };

  const convertToBase = (unit, value) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue === 0) return 0;
    const factor = toBase[unit];
    if (!factor) return 0;
    return numValue * factor;
  };

  const convertFromBase = (baseValue, targetUnit) => {
    if (baseValue === 0) return 0;
    const factor = toBase[targetUnit];
    if (!factor) return 0;
    return baseValue / factor;
  };

  const handleInputChange = (unit, newValue) => {
    setTopInputs({ hectare: '', aare: '', sqm: '' });
    setLastEditedUnit(unit);
    setPriceUnit(unit);

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
        unit,
        fromValue: numValue.toLocaleString('en-IN'),
        fromUnit: unit,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [entry, ...prev.slice(0, 9)]);
    }

    if (lastEditedPriceField === 'total') {
      updatePriceCalculations('total', totalPrice, unit, baseValue);
    } else {
      updatePriceCalculations('rate', unitRate, unit, baseValue);
    }
  };

  const handleTopInputChange = (key, newVal) => {
    const updated = { ...topInputs, [key]: newVal };
    setTopInputs(updated);
    if (newVal !== '') {
      setLastEditedUnit(key);
      setPriceUnit(key);
    }

    const totalGuntha =
      (parseFloat(updated.hectare) || 0) * toBase.hectare +
      (parseFloat(updated.aare) || 0) * toBase.aare +
      (parseFloat(updated.sqm) || 0) * toBase.sqm;

    const anyFilled = Object.values(updated).some(v => v !== '' && parseFloat(v) > 0);
    if (!anyFilled) {
      const clearedValues = {};
      orderedUnits.forEach(u => { clearedValues[u.value] = ''; });
      setValues(clearedValues);
      return;
    }

    const newValues = {};
    orderedUnits.forEach(u => {
      const converted = convertFromBase(totalGuntha, u.value);
      newValues[u.value] = converted === 0 ? '' : converted.toFixed(3).replace(/\.?0+$/, '');
    });
    setValues(newValues);

    if (lastEditedPriceField === 'total') {
      updatePriceCalculations('total', totalPrice, key, totalGuntha);
    } else {
      updatePriceCalculations('rate', unitRate, key, totalGuntha);
    }
  };

  const handleReset = () => {
    const clearedValues = {};
    orderedUnits.forEach(u => { clearedValues[u.value] = ''; });
    setValues(clearedValues);
    setTopInputs({ hectare: '', aare: '', sqm: '' });
    setTotalPrice('');
    setUnitRate('');
    setPriceUnit('guntha');
    setLastEditedPriceField('total');
    setLastEditedUnit('guntha');
  };

  const getShortLabel = (unitVal) => {
    const label = unitLabels[language]?.[unitVal] || unitVal;
    return label.replace(/\([^)]*\)/g, '').split('/')[0].trim();
  };

  const updatePriceCalculations = (changedField, val, activeUnit = priceUnit, gunthaVal = values.guntha) => {
    const gunthaArea = parseFloat(gunthaVal);
    const numVal = parseFloat(val);

    if (isNaN(numVal) || isNaN(gunthaArea) || gunthaArea <= 0) {
      if (changedField === 'total') {
        setTotalPrice(val);
        setUnitRate('');
      } else {
        setUnitRate(val);
        setTotalPrice('');
      }
      return;
    }

    const factor = toBase[activeUnit];
    const areaInActiveUnit = gunthaArea / factor;

    if (changedField === 'total') {
      setTotalPrice(val);
      const calculatedRate = numVal / areaInActiveUnit;
      setUnitRate(calculatedRate === 0 ? '' : calculatedRate.toFixed(2).replace(/\.?0+$/, ''));
    } else {
      setUnitRate(val);
      const calculatedTotal = numVal * areaInActiveUnit;
      setTotalPrice(calculatedTotal === 0 ? '' : calculatedTotal.toFixed(2).replace(/\.?0+$/, ''));
    }
  };

  const handleTotalPriceChange = (val) => {
    setLastEditedPriceField('total');
    updatePriceCalculations('total', val);
  };

  const handleUnitRateChange = (val) => {
    setLastEditedPriceField('rate');
    updatePriceCalculations('rate', val);
  };

  const handlePriceUnitChange = (newUnit) => {
    setPriceUnit(newUnit);
    updatePriceCalculations('total', totalPrice, newUnit);
  };

  const calculateUnitPrice = (unitVal) => {
    const priceNum = parseFloat(totalPrice);
    const gunthaArea = parseFloat(values.guntha);

    if (isNaN(priceNum) || isNaN(gunthaArea) || gunthaArea <= 0) {
      return 0;
    }

    const pricePerGuntha = priceNum / gunthaArea;
    return pricePerGuntha * toBase[unitVal];
  };

  const formatCurrency = (val) => {
    if (isNaN(val) || !isFinite(val) || val === 0) return '₹0';

    let decimals = 2;
    if (val % 1 === 0) {
      decimals = 0;
    } else if (val < 1) {
      decimals = 4;
    }

    return '₹' + val.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const handleExportPDF = async () => {
    const hasData = Object.values(values).some(val => val !== '' && val !== '0');
    if (!hasData) {
      toast.warning(language === 'en' ? 'Please enter a value to convert before exporting.' : 'નિકાસ કરતાં પહેલાં રૂપાંતરિત કરવા માટે મૂલ્ય દાખલ કરો.');
      return;
    }
    const toastId = toast.loading(language === 'en' ? 'Generating PDF...' : 'PDF બનાવી રહ્યા છીએ...');
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const poweredLabel = 'Powered by ';
      const companyLabel = 'Kharsan Properties';
      const pWidth = doc.getTextWidth(poweredLabel);
      const cWidth = doc.getTextWidth(companyLabel);
      const totalPWidth = pWidth + cWidth;
      const poweredX = pageWidth - 20 - totalPWidth;
      const poweredY = 12;

      doc.setTextColor(100, 116, 139);
      doc.text(poweredLabel, poweredX, poweredY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(201, 168, 76);
      doc.text(companyLabel, poweredX + pWidth, poweredY);
      doc.link(poweredX, poweredY - 3, totalPWidth, 5, { url: 'https://properties.kharsan.com' });

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(201, 168, 76);
      doc.text('Area Conversion Report', pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(26, 35, 64);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 28, { align: 'center' });

      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.8);
      doc.line(20, 32, pageWidth - 20, 32);

      const filteredUnits = orderedUnits.filter(unit => values[unit.value] && values[unit.value] !== '');

      let yPos = 40;
      const lineHeight = 8;
      const col1Width = 90;
      const col2Width = 50;
      const col3Width = 40;
      const startX = 20;
      const tableStartY = yPos - 5;

      doc.setFillColor(26, 35, 64);
      doc.rect(startX, tableStartY, col1Width + col2Width + col3Width, lineHeight + 2, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);

      doc.text('Unit Name', startX + 3, yPos + 2);
      const valHeaderWidth = doc.getTextWidth('Value');
      doc.text('Value', startX + col1Width + col2Width - 5 - valHeaderWidth, yPos + 2);
      const unitHeaderWidth = doc.getTextWidth('Unit');
      doc.text('Unit', startX + col1Width + col2Width + (col3Width / 2) - (unitHeaderWidth / 2), yPos + 2);

      yPos += lineHeight + 2;

      doc.setFontSize(10);
      filteredUnits.forEach((unit, index) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(startX, yPos - 5, col1Width + col2Width + col3Width, lineHeight, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(unit.label.substring(0, 35), startX + 3, yPos + 2);

        doc.setFont('helvetica', 'bold');
        const valueText = values[unit.value];
        const valueWidth = doc.getTextWidth(valueText);
        doc.text(valueText, startX + col1Width + col2Width - 5 - valueWidth, yPos + 2);

        doc.setFont('helvetica', 'normal');
        const unitCode = unit.value.replace('vigha', 'bigha').replace('_', ' ').toUpperCase();
        const unitCodeWidth = doc.getTextWidth(unitCode);
        doc.text(unitCode, startX + col1Width + col2Width + (col3Width / 2) - (unitCodeWidth / 2), yPos + 2);

        yPos += lineHeight;
      });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(startX, tableStartY, col1Width + col2Width + col3Width, yPos - tableStartY);

      const calculatedTotal = parseFloat(totalPrice);
      if (totalPrice && calculatedTotal > 0 && values.guntha && parseFloat(values.guntha) > 0) {
        yPos += 15;
        if (yPos > pageHeight - 65) {
          doc.addPage();
          yPos = 25;
        }

        doc.setFillColor(250, 249, 245);
        doc.setDrawColor(201, 168, 76);
        doc.setLineWidth(0.3);
        doc.rect(startX, yPos - 5, col1Width + col2Width + col3Width, 45, 'FD');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(201, 168, 76);
        doc.text('Valuation & Unit Rates', startX + 5, yPos + 2);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(startX + 5, yPos + 5, startX + col1Width + col2Width + col3Width - 5, yPos + 5);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 64);
        const totalFormatted = 'Rs. ' + calculatedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        doc.text(`Total Property Price: ${totalFormatted}`, startX + 5, yPos + 11);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'oblique');
        doc.setTextColor(100, 116, 139);
        doc.text('Equivalent rates for major units:', startX + 5, yPos + 17);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 35, 64);
        doc.setFontSize(9.5);

        const formatRateValue = (val) => {
          if (val % 1 === 0) return val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
          else if (val < 1) return val.toLocaleString('en-IN', { maximumFractionDigits: 4, minimumFractionDigits: 2 });
          else return val.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
        };

        const leftRates = ['guntha', 'hectare', 'aare'];
        leftRates.forEach((uKey, idx) => {
          const uLabel = orderedUnits.find(ou => ou.value === uKey)?.label || uKey;
          const cleanLabel = uLabel.replace(/\([^)]*\)/g, '').split('/')[0].trim();
          const uPrice = calculateUnitPrice(uKey);
          const formattedPrice = formatRateValue(uPrice);
          doc.text(`• Rate per 1 ${cleanLabel}: Rs. ${formattedPrice}`, startX + 8, yPos + 23 + idx * 6);
        });

        const rightRates = ['acre', 'sqft'];
        rightRates.forEach((uKey, idx) => {
          const uLabel = orderedUnits.find(ou => ou.value === uKey)?.label || uKey;
          const cleanLabel = uLabel.replace(/\([^)]*\)/g, '').split('/')[0].trim();
          const uPrice = calculateUnitPrice(uKey);
          const formattedPrice = formatRateValue(uPrice);
          doc.text(`• Rate per 1 ${cleanLabel}: Rs. ${formattedPrice}`, startX + 95, yPos + 23 + idx * 6);
        });
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);

        doc.setFontSize(8.5);
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'bold');
        const playText = 'Kharsan Properties App is available on Google Play Store';
        const playWidth = doc.getTextWidth(playText);
        doc.text(playText, pageWidth / 2, pageHeight - 11, { align: 'center' });
        doc.link(pageWidth / 2 - playWidth / 2, pageHeight - 14, playWidth, 4, { url: 'https://play.google.com/store/apps/details?id=com.kharsan.properties' });

        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const dateStr = `${dd}_${mm}_${yyyy}`;
      const filename = `Kharsan_Properties_Report_${dateStr}.pdf`;

      await savePdfCrossPlatform(doc, filename, {
        shareTitle: 'Area Conversion Report',
        shareText: 'Here is your area conversion report',
      });
      toast.update(toastId, { render: language === 'en' ? 'PDF downloaded!' : 'PDF ડાઉનલોડ થયું!', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.update(toastId, { render: language === 'en' ? 'PDF export failed' : 'PDF નિકાસ નિષ્ફળ', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-['Nunito_Sans',sans-serif] pb-16 antialiased">
      <SEO
        title={language === 'en' ? "Smart Land Area Converter & Calculator" : "સ્માર્ટ જમીન ક્ષેત્રફળ કન્વર્ટર અને કેલ્ક્યુલેટર"}
        description="Convert land measurements instantly between Sq. Ft, Sq. Yards, Gaj, Acres, Hectares, and Sq. Meters."
      />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Nunito_Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Top Gold Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-10">

        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-700 font-extrabold text-xs uppercase tracking-wider mb-4 sm:mb-8 hover:text-[#c9a84c] transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft size={16} /> {language === 'en' ? 'Back to Home' : 'હોમ પેજ પર પાછા'}
        </Link>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="relative inline-block mb-2 sm:mb-3">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-[#c9a84c]/15 border border-[#c9a84c]/40 text-[#b8933a] text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full cursor-pointer hover:bg-[#c9a84c]/20 transition-colors"
            >
              {language === 'en' ? 'Presented by www.kharsan.com' : 'ખારસણ ડોટ કોમ દ્વારા પ્રસ્તુત'}
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />

                <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[200px] overflow-hidden">
                  <a
                    href="https://www.kharsan.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    {language === 'en' ? '🌐 Visit Website' : '🌐 વેબસાઇટની મુલાકાત લો'}
                  </a>
                </div>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1 sm:mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {t('tools_page.converter_title')}
          </h1>
          <p className="text-slate-500 text-xs sm:text-base font-semibold max-w-2xl mx-auto leading-relaxed">
            {t('tools_page.converter_desc')}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center mb-6 sm:mb-8">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-extrabold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs text-xs sm:text-sm cursor-pointer"
          >
            <RotateCcw size={14} />
            {language === 'en' ? 'Reset All' : 'બધું ફરીથી સેટ કરો'}
          </button>

          {/* Reorder Toggle */}
          <button
            onClick={() => setReorderEnabled(prev => !prev)}
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 font-extrabold rounded-xl transition-all shadow-xs text-xs sm:text-sm border cursor-pointer ${
              reorderEnabled
                ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title={reorderEnabled ? 'Click to lock unit order' : 'Click to enable drag reordering'}
          >
            <GripVertical size={15} />
            <span>{language === 'en' ? 'Reorder Units' : 'એકમોનો ક્રમ બદલો'}</span>
            <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-300 ${reorderEnabled ? 'bg-slate-900/30' : 'bg-slate-200'}`}>
              <span className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${reorderEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-[#1a2340] hover:from-blue-600 hover:to-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md text-xs sm:text-sm cursor-pointer"
          >
            <Download size={15} />
            {language === 'en' ? 'Export as PDF' : 'PDF તરીકે ડાઉનલોડ કરો'}
          </button>
        </div>

        {/* Main Live Converter Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-lg p-4 sm:p-7 mb-8 space-y-5">

          {/* Quick Reference Top Bar — Compound Editable Inputs */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {[
              { key: 'hectare', label: language === 'en' ? 'Hectare' : 'હેક્ટર' },
              { key: 'aare', label: language === 'en' ? 'Aare' : 'આરે' },
              { key: 'sqm', label: language === 'en' ? 'Sq. Meter' : 'ચોરસ મીટર' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:p-3 transition-colors focus-within:border-blue-500 focus-within:bg-blue-50/20">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
                <input
                  type="number"
                  step="any"
                  value={topInputs[key]}
                  onChange={(e) => handleTopInputChange(key, e.target.value)}
                  className="w-full text-center text-sm sm:text-base font-extrabold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300 font-mono"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {/* Sum label — visible when multiple top inputs are filled */}
          {Object.values(topInputs).filter(v => v !== '' && parseFloat(v) > 0).length > 1 && (
            <div className="flex justify-end">
              <span className="text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1 shadow-2xs">
                ∑ {language === 'en' ? 'Combined Total =' : 'સંયુક્ત કુલ ='} {(
                  (parseFloat(topInputs.hectare) || 0) * toBase.hectare +
                  (parseFloat(topInputs.aare) || 0) * toBase.aare +
                  (parseFloat(topInputs.sqm) || 0) * toBase.sqm
                ).toFixed(3).replace(/\.?0+$/, '')} {language === 'en' ? 'Guntha' : 'ગુન્ટા'}
              </span>
            </div>
          )}

          {/* Price Calculator Input */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/20 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Field 1: Total Price */}
              <div className="text-left">
                <label className="block text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Total Land Price (₹)' : 'જમીનની કુલ કિંમત (₹)'}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-black text-sm sm:text-base">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={totalPrice}
                    onChange={(e) => handleTotalPriceChange(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-extrabold focus:outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 font-mono shadow-2xs"
                    placeholder={language === 'en' ? 'Enter total price' : 'કુલ કિંમત દાખલ કરો'}
                  />
                </div>
              </div>

              {/* Field 2: Rate per Unit */}
              <div className="text-left">
                <label className="block text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Price Rate per Unit (₹)' : '૧ નો ભાવ (₹)'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex items-center flex-1">
                    <span className="absolute left-3.5 text-slate-400 font-black text-sm sm:text-base">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={unitRate}
                      onChange={(e) => handleUnitRateChange(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm font-extrabold focus:outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 font-mono shadow-2xs"
                      placeholder={language === 'en' ? 'Enter rate' : 'ભાવ દાખલ કરો'}
                    />
                  </div>
                  <select
                    value={priceUnit}
                    onChange={(e) => handlePriceUnitChange(e.target.value)}
                    className="px-3 h-11 border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-extrabold focus:outline-none bg-white text-slate-800 shrink-0 cursor-pointer shadow-2xs"
                  >
                    {orderedUnits.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {language === 'en' ? `per ${getShortLabel(unit.value)}` : `પ્રતિ ${getShortLabel(unit.value)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Reorder hint banner */}
          {reorderEnabled && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
              <GripVertical size={15} className="text-amber-600 shrink-0" />
              {language === 'en' ? 'Drag units to reorder list. Toggle off when complete.' : 'એકમોનો ક્રમ બદલવા માટે ખેંચો.'}
            </div>
          )}

          {/* Units Stack List */}
          {reorderEnabled ? (
            <Reorder.Group axis="y" values={orderedUnits} onReorder={setOrderedUnits} className="space-y-2.5">
              {orderedUnits.map((unit) => (
                <Reorder.Item
                  key={unit.value}
                  value={unit}
                  className="flex items-center justify-between group bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-200 hover:border-blue-400 transition-colors cursor-grab active:cursor-grabbing shadow-2xs"
                >
                  <div className="flex-1 min-w-0 pr-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400 group-hover:text-blue-600 shrink-0">
                        <GripVertical size={18} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <label className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {unitLabels[language]?.[unit.value] || unit.label}
                        </label>
                        {totalPrice && values.guntha && parseFloat(values.guntha) > 0 && (
                          <span className="text-[10px] sm:text-xs font-bold text-blue-700 mt-0.5 whitespace-nowrap">
                            1 {getShortLabel(unit.value)} = {formatCurrency(calculateUnitPrice(unit.value))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-36 sm:w-80 shrink-0 flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={values[unit.value] || ''}
                      onChange={(e) => handleInputChange(unit.value, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm sm:text-base font-extrabold text-right focus:outline-none focus:border-blue-600 bg-white font-mono shadow-2xs"
                      placeholder="0.00"
                    />
                    <div className="hidden sm:block w-20 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
                      {unit.value.replace('vigha_', '').toUpperCase()}
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div className="space-y-2.5">
              {orderedUnits.map((unit) => (
                <div
                  key={unit.value}
                  className="flex items-center justify-between bg-slate-50/70 rounded-2xl p-3 sm:p-4 border border-slate-200/80 hover:border-blue-400 transition-colors shadow-2xs"
                >
                  <div className="flex-1 min-w-0 pr-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="text-slate-300 shrink-0">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <label className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {unitLabels[language]?.[unit.value] || unit.label}
                        </label>
                        {totalPrice && values.guntha && parseFloat(values.guntha) > 0 && (
                          <span className="text-[10px] sm:text-xs font-bold mt-0.5 whitespace-nowrap">
                            <span className="text-amber-700 font-bold">1 {getShortLabel(unit.value)} = </span>
                            <span className="text-blue-700 font-black">{formatCurrency(calculateUnitPrice(unit.value))}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-36 sm:w-80 shrink-0 flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={values[unit.value] || ''}
                      onChange={(e) => handleInputChange(unit.value, e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-slate-200 rounded-xl text-sm sm:text-base font-extrabold text-right focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white font-mono shadow-2xs text-slate-900"
                      placeholder="0.00"
                    />
                    <div className="hidden sm:block w-20 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
                      {unit.value.replace('vigha_', '').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <section className="mb-10">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <History size={18} className="text-amber-500" /> {language === 'en' ? 'Recent Conversions' : 'તાજેતરના રૂપાંતરણો'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.slice(0, 6).map((h, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 shadow-2xs flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-extrabold mb-0.5">{h.timestamp}</div>
                    <div>
                      {h.fromValue} {h.fromUnit} = <span className="text-blue-600 font-black">{h.value} {h.unit}</span>
                    </div>
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