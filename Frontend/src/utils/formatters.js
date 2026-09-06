/**
 * Formats land area units cleanly (e.g. "1 vigha_bada" -> "1 Bigha (Big)" / "1 મોટું વીઘું")
 */
export const formatDisplayArea = (areaStr, lang = 'en') => {
  if (!areaStr) return 'N/A';
  const str = String(areaStr).trim();
  
  if (str.includes('vigha_bada')) {
    return lang === 'gu' 
      ? str.replace('vigha_bada', 'મોટું વીઘું') 
      : str.replace('vigha_bada', 'Bigha (Big)');
  }
  if (str.includes('vigha_chhota')) {
    return lang === 'gu' 
      ? str.replace('vigha_chhota', 'નાનું વીઘું') 
      : str.replace('vigha_chhota', 'Bigha (Small)');
  }
  if (str.includes('vigha') || str.includes('bigha')) {
    return lang === 'gu' 
      ? str.replace(/vigha|bigha/gi, 'વીઘું') 
      : str.replace(/vigha|bigha/gi, 'Vigha');
  }
  if (str.includes('guntha')) {
    return lang === 'gu' 
      ? str.replace('guntha', 'ગુન્ટા') 
      : str.replace('guntha', 'Guntha');
  }
  if (str.includes('acre')) {
    return lang === 'gu' 
      ? str.replace('acre', 'એકર') 
      : str.replace('acre', 'Acre');
  }
  if (str.includes('sqyd') || str.includes('gaj') || str.includes('yard')) {
    return lang === 'gu' 
      ? str.replace(/sqyd|gaj|yard/gi, 'વાર') 
      : str.replace(/sqyd|gaj|yard/gi, 'Sq. Yards');
  }
  if (str.includes('sqft')) {
    return lang === 'gu' 
      ? str.replace('sqft', 'ચોરસ ફૂટ') 
      : str.replace('sqft', 'Sq. Ft');
  }
  return str.replace(/_/g, ' ');
};

/**
 * Calculates a sensible price subtext (e.g., "₹4,500 /sqyd" or "Total Price")
 */
export const getPriceSubtext = (listing, lang = 'en') => {
  if (!listing) return '';
  if (listing.pricePerSqYd && listing.pricePerSqYd > 0) {
    return `₹${listing.pricePerSqYd.toLocaleString('en-IN')} /sqyd`;
  }
  const areaStr = String(listing.area || '').toLowerCase();
  if (areaStr.includes('vigha') || areaStr.includes('bigha') || areaStr.includes('acre') || areaStr.includes('guntha')) {
    return lang === 'gu' ? 'કુલ કિંમત' : 'Total Price';
  }
  if (listing.numericArea && listing.numericArea > 0) {
    if (areaStr.includes('sqyd') || areaStr.includes('gaj') || areaStr.includes('yard')) {
      const perSqyd = Math.round(listing.price / listing.numericArea);
      return `₹${perSqyd.toLocaleString('en-IN')} /sqyd`;
    }
    if (areaStr.includes('sqft')) {
      const perSqft = Math.round(listing.price / listing.numericArea);
      return `₹${perSqft.toLocaleString('en-IN')} /sqft`;
    }
  }
  return lang === 'gu' ? 'કુલ કિંમત' : 'Total Price';
};
