import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, CopyCheck, History, Zap, ArrowLeftRight, RotateCcw, Download, GripVertical } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

const AreaConverter = () => {
  const [values, setValues] = useState({});
  const [history, setHistory] = useState([]);
  const [topInputs, setTopInputs] = useState({ hectare: '', aare: '', sqm: '' });

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
      newValues[u.value] = converted === 0 ? '' : converted.toFixed(8).replace(/\.?0+$/, '');
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#1a2340] font-bold text-xs uppercase tracking-wider mb-8 hover:text-[#c9a84c] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block bg-[#c9a84c]/15 border border-[#c9a84c]/40 text-[#b8933a] text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full mb-3">
            Property Tool
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a2340] mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Area Converter
          </h1>
          <p className="text-[#6b7280] text-base font-medium">
            Live Converter — Values update instantly as you type
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#e2d9c5] text-[#1a2340] font-bold rounded-xl hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all shadow-sm text-sm"
          >
            <RotateCcw size={16} />
            Reset All
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1a2340] to-[#2a3454] text-white font-bold rounded-xl hover:from-[#c9a84c] hover:to-[#b8933a] transition-all shadow-md text-sm"
          >
            <Download size={16} />
            Export as PDF
          </button>
        </div>

        {/* Main Live Converter Section */}
        <div className="bg-white border border-[#e2d9c5] rounded-2xl shadow-lg p-6 mb-10">

          {/* Quick Reference Top Bar — Compound Editable Inputs */}
          <div className="flex justify-end gap-3 mb-5 flex-wrap">
            {[
              { key: 'hectare', label: 'Hectare' },
              { key: 'aare',    label: 'Aare' },
              { key: 'sqm',     label: 'Sq. Meter' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center bg-[#faf7f0] border border-[#e2d9c5] rounded-xl py-2 min-w-[100px]">
                <span className="text-[9px] font-extrabold text-[#b8933a] uppercase tracking-widest mb-1">{label}</span>
                <input
                  type="number"
                  step="any"
                  value={topInputs[key]}
                  onChange={(e) => handleTopInputChange(key, e.target.value)}
                  className="w-full text-center text-sm font-extrabold text-[#1a2340] bg-transparent border-[#e2d9c5] focus:border-[#c9a84c] focus:outline-none transition-colors pb-0.5 placeholder:text-[#d0c5b0]"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          {/* Sum label — visible when multiple top inputs are filled */}
          {Object.values(topInputs).filter(v => v !== '' && parseFloat(v) > 0).length > 1 && (
            <div className="flex justify-end mb-4">
              <span className="text-[10px] font-bold text-[#b8933a] bg-[#fdf8ee] border border-[#e2d9c5] rounded-lg px-3 py-1">
                ∑ Combined = {(
                  (parseFloat(topInputs.hectare) || 0) * toBase.hectare +
                  (parseFloat(topInputs.aare)    || 0) * toBase.aare +
                  (parseFloat(topInputs.sqm)     || 0) * toBase.sqm
                ).toFixed(3).replace(/\.?0+$/, '')} Guntha
              </span>
            </div>
          )}

          <Reorder.Group axis="y" values={orderedUnits} onReorder={setOrderedUnits} className="space-y-4">
            {orderedUnits.map((unit) => (
              <Reorder.Item 
                key={unit.value} 
                value={unit}
                className="flex flex-col sm:flex-row sm:items-center gap-3 group bg-white rounded-xl p-1"
              >
                <div className="flex items-center gap-3 sm:w-56">
                  <div className="cursor-grab active:cursor-grabbing text-[#e2d9c5] hover:text-[#c9a84c] transition-colors">
                    <GripVertical size={18} />
                  </div>
                  <label className="text-base font-bold text-[#1a2340] block">
                    {unit.label}
                  </label>
                </div>

                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="any"
                    value={values[unit.value] || ''}
                    onChange={(e) => handleInputChange(unit.value, e.target.value)}
                    className="w-full px-5 py-3 border-2 border-[#f0ebe0] rounded-xl text-lg font-bold text-right focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/10 transition-all bg-[#faf9f6]"
                    placeholder="0.00"
                  />
                </div>

                <div className="sm:w-24 text-right text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  {unit.value.replace('vigha_', '').toUpperCase()}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        {/* You can keep your Popular Conversions, History, and Formulas sections here */}
        {/* For now, I'm including a minimal History section */}

        {history.length > 0 && (
          <section className="mb-10">
            <h3 className="text-lg font-bold text-[#1a2340] mb-4 flex items-center gap-2">
              <History size={18} className="text-[#c9a84c]" /> Recent Conversions
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