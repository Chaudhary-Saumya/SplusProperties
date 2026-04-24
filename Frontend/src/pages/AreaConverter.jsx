import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, CopyCheck, History, Zap, ArrowLeftRight, RotateCcw, Download } from 'lucide-react';
import jsPDF from 'jspdf';

const AreaConverter = () => {
  const [values, setValues] = useState({});
  // const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  const units = [
    { value: 'sqft', label: 'Square Feet (Sqft)', type: 'area' },
    { value: 'sqm', label: 'Square Meter (Sqm)', type: 'area' },
    { value: 'gaj', label: 'Gaj / Yard', type: 'area' },
    { value: 'acre', label: 'Acre', type: 'area' },
    { value: 'hectare', label: 'Hectare', type: 'area' },
    { value: 'sqyd', label: 'Square Yard (Sqyd)', type: 'area' },
    { value: 'cent', label: 'Cent', type: 'area' },
    { value: 'bigha', label: 'Bigha (UP std 27,200 sqft)', type: 'area' },
    { value: 'katha', label: 'Katha', type: 'area' },
    { value: 'guntha', label: 'Guntha', type: 'area' },
    { value: 'biswa', label: 'Biswa', type: 'area' },
    { value: 'decimal', label: 'Decimal', type: 'area' },
    { value: 'marla', label: 'Marla', type: 'area' },
    { value: 'kanaal', label: 'Kanaal', type: 'area' },
    { value: 'square_inch', label: 'Square Inch', type: 'area' },
    { value: 'square_km', label: 'Square Kilometer', type: 'area' },
    { value: 'square_mile', label: 'Square Mile', type: 'area' },
  ];

  // All conversions to square feet (base unit)
  const toSqft = {
    sqft: 1,
    sqm: 10.7639104,
    gaj: 9,
    acre: 43560,
    hectare: 107639.104,
    sqyd: 9,
    cent: 435.6,
    bigha: 27200,
    katha: 1361,
    guntha: 1089,
    biswa: 1360,
    decimal: 435.6,
    marla: 272.25,
    kanaal: 5445,
    square_inch: 0.00694444,
    square_km: 10763910.4,
    square_mile: 27878400,
  };

  const convertToBase = (unit, value) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue === 0) return 0;
    
    // Convert from the input unit to square feet
    const factor = toSqft[unit];
    if (!factor) return 0;
    
    return numValue * factor;
  };

  const convertFromBase = (baseValue, targetUnit) => {
    if (baseValue === 0) return 0;
    
    // Convert from square feet to the target unit
    const factor = toSqft[targetUnit];
    if (!factor) return 0;
    
    return baseValue / factor;
  };

  const handleInputChange = (unit, newValue) => {
    // Handle empty input
    if (newValue === '' || newValue === '-') {
      const clearedValues = {};
      units.forEach(u => {
        clearedValues[u.value] = '';
      });
      setValues(clearedValues);
      return;
    }

    const baseValue = convertToBase(unit, newValue);
    const newValues = {};

    units.forEach(u => {
      const converted = convertFromBase(baseValue, u.value);
      if (converted === 0) {
        newValues[u.value] = '';
      } else {
        // Format with appropriate precision
        const formatted = converted.toFixed(8).replace(/\.?0+$/, '');
        newValues[u.value] = formatted;
      }
    });

    setValues(newValues);

    // Add to history
    const numValue = parseFloat(newValue);
    if (numValue > 0) {
      const entry = {
        value: parseFloat(newValues[unit]).toLocaleString('en-IN', { maximumFractionDigits: 4 }),
        unit: unit,
        fromValue: numValue.toLocaleString('en-IN'),
        fromUnit: unit,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [entry, ...prev.slice(0, 9)]);
    }
  };

  // Initialize with default value
  useEffect(() => {
    const initialValues = {};
    units.forEach(u => {
      initialValues[u.value] = u.value === 'sqft' ? '1000' : '';
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
    units.forEach(u => {
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
    doc.setTextColor(37, 99, 235);
    doc.text('Area Conversion Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 28, { align: 'center' });
    
    // Add line
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(20, 32, pageWidth - 20, 32);
    
    // Prepare data
    const filteredUnits = units.filter(unit => values[unit.value] && values[unit.value] !== '');
    
    // Table settings
    let yPos = 40;
    const lineHeight = 8;
    const col1Width = 90;
    const col2Width = 50;
    const col3Width = 40;
    const startX = 20;
    
    // Table header
    doc.setFillColor(37, 99, 235);
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
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="h-1 w-full bg-gradient-to-r from-[#2563eb] via-[#60a5fa] to-[#2563eb]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#0f172a] font-bold text-sm uppercase tracking-wider mb-10 hover:text-[#2563eb] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-[#2563eb]/15 border border-[#2563eb]/40 text-[#1d4ed8] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Property Tool
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0f172a] mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Area Converter
          </h1>
          <p className="text-[#6b7280] text-lg font-medium">
            Live Converter — Type in any field and all values will update instantly
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#e2e8f0] text-[#0f172a] font-bold rounded-2xl hover:border-[#2563eb] hover:text-[#2563eb] transition-all shadow-sm hover:shadow-md"
          >
            <RotateCcw size={18} />
            Reset All
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white font-bold rounded-2xl hover:from-[#1d4ed8] hover:to-[#2563eb] transition-all shadow-lg hover:shadow-xl"
          >
            <Download size={18} />
            Export as PDF
          </button>
        </div>

        {/* Main Live Converter Section */}
        <div className="bg-white border border-[#e2e8f0] rounded-3xl shadow-lg p-8 mb-12">
          <div className="space-y-6">
            {units.map((unit) => (
              <div key={unit.value} className="flex flex-col sm:flex-row sm:items-center gap-4 group">
                <div className="sm:w-64">
                  <label className="text-xl font-bold text-[#0f172a] block">
                    {unit.label}
                  </label>
                </div>

                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="any"
                    value={values[unit.value] || ''}
                    onChange={(e) => handleInputChange(unit.value, e.target.value)}
                    className="w-full px-6 py-5 border-2 border-[#e2e8f0] rounded-2xl text-2xl font-bold text-right focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                    placeholder="0.00"
                  />
                  {/* <button
                    onClick={() => copyResult(unit.value)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#2563eb] p-2 rounded-xl hover:bg-[#f1f5f9] transition-all"
                  >
                    {copied === unit.value ? <CopyCheck size={20} className="text-green-600" /> : <Copy size={20} />}
                  </button> */}
                </div>

                <div className="sm:w-28 text-right text-sm font-semibold text-[#64748b] uppercase tracking-wider">
                  {unit.value.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* You can keep your Popular Conversions, History, and Formulas sections here */}
        {/* For now, I'm including a minimal History section */}

        {history.length > 0 && (
          <section className="mb-12">
            <h3 className="text-xl font-bold text-[#0f172a] mb-5 flex items-center gap-2">
              <History size={20} className="text-[#2563eb]" /> Recent Conversions
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