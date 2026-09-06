/**
 * WhatsApp Lead & Inquiry Generator Utility
 * Pre-fills property details, verification IDs, and deep links
 */

import { getWebsiteBaseUrl } from './url';

export const openWhatsAppInquiry = ({
  phone,
  title,
  listingId,
  price,
  area,
  location}) => {
  if (!phone) return;

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const baseUrl = getWebsiteBaseUrl();
  const listingUrl = listingId ? `${baseUrl}/listings/${listingId}` : baseUrl;

  let message = `Hello! I am interested in your property listed on *Kharsan Properties*:\n\n`;
  if (title) message += `📍 *Property:* ${title}\n`;
  if (listingId) message += `🏷️ *Ref ID:* #${listingId.substring(0, 8).toUpperCase()}\n`;
  if (price) message += `💰 *Price:* ₹${price.toLocaleString('en-IN')}\n`;
  if (area) message += `📐 *Area:* ${area}\n`;
  if (location) message += `🗺️ *Location:* ${location}\n`;
  message += `\n🔗 *Link:* ${listingUrl}\n\nPlease share further details and site visit availability.`;

  const encodedUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, '_blank');
};

export default openWhatsAppInquiry;
