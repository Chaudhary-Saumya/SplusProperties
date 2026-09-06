import React from 'react';
import { toast } from 'react-toastify';
import { X, CheckCircle2, Printer, Download, Shield, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { savePdfCrossPlatform } from '../utils/pdfDownloader';

const ReceiptModal = ({ isOpen, onClose, receiptData }) => {
    if (!isOpen || !receiptData) return null;

    const fallbackReceipt = receiptData._id?.slice(-8) || receiptData.gatewayOrderId?.slice(-8) || 'UNAVAILABLE';
    const receiptNumber = (receiptData.receiptNumber || fallbackReceipt).toUpperCase();
    const transactionId = receiptData.razorpayPaymentId || receiptData.gatewayPaymentId || receiptData.paymentDetails?.razorpay_payment_id || 'TXN_VERIFIED_770';
    const orderId = receiptData.razorpayOrderId || receiptData.gatewayOrderId || receiptData.paymentDetails?.razorpay_order_id || 'N/A';
    const propertyTitle = receiptData.listingTitle || receiptData.listingId?.title || 'Verified Property Reservation';
    const propertyLocation = receiptData.listingId?.location || receiptData.location || 'LandSelling Verified Listing';
    const sellerName = receiptData.sellerName || receiptData.sellerId?.name || 'Authorized Seller';
    const buyerName = receiptData.buyerName || receiptData.buyerId?.name || 'Authorized Buyer';
    const sellerPhone = receiptData.sellerPhone || receiptData.sellerId?.phone || '-';
    const buyerPhone = receiptData.buyerPhone || receiptData.buyerId?.phone || '-';
    const sellerEmail = receiptData.sellerEmail || receiptData.sellerId?.email || '-';
    const buyerEmail = receiptData.buyerEmail || receiptData.buyerId?.email || '-';
    const createdAtText = receiptData.date || (receiptData.createdAt ? new Date(receiptData.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : '-');
    const amountText = `₹${Number(receiptData.amount || 0).toLocaleString('en-IN')}`;
    const agreementDate = receiptData.createdAt ? new Date(receiptData.createdAt).toLocaleDateString('en-IN') : '-';
    const agreementTime = receiptData.createdAt ? new Date(receiptData.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';

    const escapeHtml = (v) => String(v ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    /* ─────────────────────────────────────────────────────────────────────
       Agreement to Sell HTML — this is the legal document that gets
       opened in a new tab so the user can Save as PDF via the browser
    ───────────────────────────────────────────────────────────────────── */
    const getAgreementDocument = () => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Agreement to Sell - ${escapeHtml(receiptNumber)}</title>
  <style>
    body { font-family: "Times New Roman", serif; margin: 40px; color: #000; line-height: 1.6; font-size: 14px; }
    h1 { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin-bottom: 25px; }
    .section-title { font-weight: bold; margin-top: 20px; text-transform: uppercase; }
    .content { margin-top: 10px; text-align: justify; }
    .signature { margin-top: 60px; display: flex; justify-content: space-between; }
    .sign-box { width: 40%; text-align: center; }
    .line { margin-top: 50px; border-top: 1px solid black; }
    .witness { margin-top: 40px; }
  </style>
</head>
<body>

  <h1>AGREEMENT TO SELL (TOKEN AGREEMENT)</h1>

  <p>This Agreement to Sell is made and executed at <b>${escapeHtml(propertyLocation)}</b> on this <b>${escapeHtml(agreementDate)}</b>.</p>

  <p class="section-title">BETWEEN</p>
  <p><b>${escapeHtml(sellerName)}</b> (hereinafter referred to as the "SELLER")</p>
  <p style="text-align:center;"><b>AND</b></p>
  <p><b>${escapeHtml(buyerName)}</b> (hereinafter referred to as the "BUYER")</p>

  <p class="section-title">WHEREAS</p>
  <p class="content">1. The Seller is the lawful and absolute owner of the property situated at <b>${escapeHtml(propertyLocation)}</b>.</p>
  <p class="content">2. The Seller has agreed to sell and the Buyer has agreed to purchase the said property.</p>

  <p class="section-title">TOTAL SALE CONSIDERATION</p>
  <p class="content">&#8377; ${escapeHtml(String(receiptData.amount))} (Rupees only)</p>

  <p class="section-title">TOKEN PAYMENT (CONFIRMATION)</p>
  <p class="content">On this day, the Buyer has paid a token amount of <b>${escapeHtml(amountText)}</b> to the Seller as confirmation of this deal. The Seller hereby acknowledges receipt of the same.</p>

  <p class="section-title">BALANCE PAYMENT</p>
  <p class="content">The remaining amount shall be paid by the Buyer at the time of final registration.</p>

  <p class="section-title">NOTE</p>
  <p class="content">This agreement confirms that the Buyer has given token money to the Seller for the above property.</p>

  <div class="signature">
    <div class="sign-box"><div class="line"></div>Seller Signature</div>
    <div class="sign-box"><div class="line"></div>Buyer Signature</div>
  </div>

  <div class="witness">
    <p><b>WITNESSES</b></p>
    <p>1. __________________________</p>
    <p>2. __________________________</p>
  </div>

</body>
</html>`;

    /* ── Print the receipt modal ── */
    const handlePrintReceipt = () => {
        if (Capacitor.isNativePlatform()) {
            // On native, print is not available — generate a receipt PDF instead
            handleDownloadReceiptPDF();
        } else {
            window.print();
        }
    };

    /* ── Helper: build the Agreement to Sell PDF using jsPDF ── */
    const buildAgreementPDF = (doc) => {
        const pw = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pw - margin * 2;
        let y = 20;

        // Title
        doc.setFont('times', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('AGREEMENT TO SELL (TOKEN AGREEMENT)', pw / 2, y, { align: 'center' });
        y += 2;
        doc.setLineWidth(0.5);
        doc.line(margin + 20, y, pw - margin - 20, y);
        y += 12;

        // Body helper
        const addParagraph = (text, options = {}) => {
            const fontSize = options.fontSize || 11;
            const fontStyle = options.fontStyle || 'normal';
            doc.setFont('times', fontStyle);
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, contentWidth);
            const lineHeight = fontSize * 0.5;
            // Check if we need a new page
            if (y + lines.length * lineHeight > 275) {
                doc.addPage();
                y = 20;
            }
            doc.text(lines, margin, y);
            y += lines.length * lineHeight + 4;
        };

        const addSectionTitle = (text) => {
            y += 4;
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text(text, margin, y);
            y += 8;
        };

        addParagraph(`This Agreement to Sell is made and executed at ${propertyLocation} on this ${agreementDate}.`);

        addSectionTitle('BETWEEN');
        addParagraph(`${sellerName} (hereinafter referred to as the "SELLER")`, { fontStyle: 'bold' });
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text('AND', pw / 2, y, { align: 'center' });
        y += 8;
        addParagraph(`${buyerName} (hereinafter referred to as the "BUYER")`, { fontStyle: 'bold' });

        addSectionTitle('WHEREAS');
        addParagraph(`1. The Seller is the lawful and absolute owner of the property situated at ${propertyLocation}.`);
        addParagraph('2. The Seller has agreed to sell and the Buyer has agreed to purchase the said property.');

        addSectionTitle('TOTAL SALE CONSIDERATION');
        addParagraph(`Rs. ${Number(receiptData.amount || 0).toLocaleString('en-IN')} (Rupees only)`);

        addSectionTitle('TOKEN PAYMENT (CONFIRMATION)');
        addParagraph(`On this day, the Buyer has paid a token amount of ${amountText} to the Seller as confirmation of this deal. The Seller hereby acknowledges receipt of the same.`);

        addSectionTitle('BALANCE PAYMENT');
        addParagraph('The remaining amount shall be paid by the Buyer at the time of final registration.');

        addSectionTitle('NOTE');
        addParagraph('This agreement confirms that the Buyer has given token money to the Seller for the above property.');

        // Signatures
        y += 20;
        if (y > 240) { doc.addPage(); y = 30; }
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + 60, y);
        doc.line(pw - margin - 60, y, pw - margin, y);
        y += 5;
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text('Seller Signature', margin + 10, y);
        doc.text('Buyer Signature', pw - margin - 50, y);

        // Witnesses
        y += 20;
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text('WITNESSES', margin, y);
        y += 8;
        doc.setFont('times', 'normal');
        doc.text('1. __________________________', margin, y);
        y += 8;
        doc.text('2. __________________________', margin, y);

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Agreement to Sell - ${receiptNumber} | Kharsan Properties`, pw / 2, 290, { align: 'center' });
        }
    };

    /* ── Download Agreement as a real PDF (works on web + Android) ── */
    const handleDownloadAgreement = async () => {
        const toastId = toast.loading('Generating Agreement PDF...');
        try {
            const doc = new jsPDF();
            buildAgreementPDF(doc);
            const filename = `Agreement_to_Sell_${receiptNumber}.pdf`;
            await savePdfCrossPlatform(doc, filename, {
                shareTitle: 'Agreement to Sell',
                shareText: `Token Agreement - ${propertyTitle}`,
            });
            toast.update(toastId, { render: 'Agreement PDF downloaded!', type: 'success', isLoading: false, autoClose: 3000 });
        } catch (err) {
            console.error('Agreement PDF error:', err);
            toast.update(toastId, { render: 'Failed to generate agreement PDF.', type: 'error', isLoading: false, autoClose: 3000 });
        }
    };

    /* ── Download Receipt as a real PDF (works on web + Android) ── */
    const handleDownloadReceiptPDF = async () => {
        const toastId = toast.loading('Generating Receipt PDF...');
        try {
            const doc = new jsPDF();
            const pw = doc.internal.pageSize.getWidth();
            const margin = 15;
            let y = 15;

            // Header bar
            doc.setFillColor(26, 35, 64);
            doc.rect(0, 0, pw, 38, 'F');
            doc.setTextColor(201, 168, 76);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Kharsan Properties', pw / 2, 18, { align: 'center' });
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text('TRANSACTION RECEIPT · PAYMENT VERIFIED', pw / 2, 27, { align: 'center' });
            doc.setFontSize(8);
            doc.text(`Receipt #${receiptNumber}`, pw / 2, 34, { align: 'center' });

            y = 48;

            // Amount banner
            doc.setFillColor(26, 35, 64);
            doc.roundedRect(margin, y, pw - margin * 2, 20, 3, 3, 'F');
            doc.setTextColor(201, 168, 76);
            doc.setFontSize(8);
            doc.text('AMOUNT PAID', margin + 5, y + 8);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(`Rs. ${Number(receiptData.amount || 0).toLocaleString('en-IN')}`, margin + 5, y + 16);
            doc.setFontSize(8);
            doc.setTextColor(201, 168, 76);
            doc.text('TOKEN PAID', pw - margin - 5, y + 12, { align: 'right' });
            y += 28;

            // Helper for rows
            const addRow = (label, value) => {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(107, 114, 128);
                doc.text(label, margin, y);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(26, 35, 64);
                const valLines = doc.splitTextToSize(String(value), pw - margin * 2 - 55);
                doc.text(valLines, margin + 55, y);
                y += Math.max(valLines.length * 5, 6) + 2;
            };

            // Property details
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(156, 163, 175);
            doc.text('PROPERTY DETAILS', margin, y);
            y += 6;
            addRow('Property', propertyTitle);
            addRow('Location', propertyLocation);
            addRow('Date & Time', createdAtText);

            y += 4;
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, pw - margin, y);
            y += 6;

            // Seller & Buyer
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(156, 163, 175);
            doc.text('PARTIES', margin, y);
            y += 6;
            addRow('Seller', sellerName);
            addRow('Seller Phone', sellerPhone);
            addRow('Seller Email', sellerEmail);
            y += 2;
            addRow('Buyer', buyerName);
            addRow('Buyer Phone', buyerPhone);
            addRow('Buyer Email', buyerEmail);

            y += 4;
            doc.line(margin, y, pw - margin, y);
            y += 6;

            // Payment details
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(156, 163, 175);
            doc.text('PAYMENT GATEWAY DETAILS', margin, y);
            y += 6;
            addRow('Gateway', 'Razorpay P2P (Verified)');
            addRow('Order ID', orderId);
            addRow('Transaction ID', transactionId);

            // Footer
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(`Kharsan Properties Authenticated | Verified at ${agreementTime}`, pw / 2, 285, { align: 'center' });

            const filename = `Receipt_${receiptNumber}.pdf`;
            await savePdfCrossPlatform(doc, filename, {
                shareTitle: 'Transaction Receipt',
                shareText: `Payment Receipt - ${propertyTitle}`,
            });
            toast.update(toastId, { render: 'Receipt PDF downloaded!', type: 'success', isLoading: false, autoClose: 3000 });
        } catch (err) {
            console.error('Receipt PDF error:', err);
            toast.update(toastId, { render: 'Failed to generate receipt PDF.', type: 'error', isLoading: false, autoClose: 3000 });
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');
                @media print {
                    body > *:not(#receipt-print-wrapper) { display: none !important; }
                    #receipt-print-wrapper { display: block !important; }
                    .print-hidden { display: none !important; }
                }
            `}</style>

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2340]/70 backdrop-blur-sm">
                <div
                    id="receipt-print-wrapper"
                    className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative flex flex-col"
                    style={{ fontFamily: "'Nunito Sans', sans-serif", maxHeight: '90vh' }}
                >
                    {/* Gold top accent */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#c9a84c] via-[#f0d080] to-[#c9a84c] flex-shrink-0" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ebe0] flex-shrink-0 bg-[#1a2340]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/20 border border-[#c9a84c]/40 flex items-center justify-center">
                                <CheckCircle2 size={16} className="text-[#c9a84c]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Transaction Receipt</h3>
                                <p className="text-[10px] text-[#c9a84c] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={11} /> Payment Verified</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="print-hidden text-white/60 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="overflow-y-auto flex-1 p-6">

                        {/* Receipt ID + Date */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-0.5">Receipt No.</div>
                                <div className="text-sm font-mono font-black text-[#1a2340]">#{receiptNumber}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-0.5">Date & Time</div>
                                <div className="text-xs font-bold text-[#1a2340]">{createdAtText}</div>
                            </div>
                        </div>

                        {/* Amount Banner */}
                        <div className="bg-[#1a2340] rounded-xl px-5 py-4 flex items-center justify-between mb-4">
                            <div>
                                <div className="text-[9px] font-bold text-[#c9a84c]/70 uppercase tracking-widest mb-0.5">Amount Paid</div>
                                <div className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{amountText}</div>
                            </div>
                            <span className="text-[9px] font-bold bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#f0d080] px-3 py-1.5 rounded-full uppercase tracking-widest">
                                Token Paid
                            </span>
                        </div>

                        {/* Property */}
                        <div className="bg-[#fdfaf5] border border-[#e2d9c5] rounded-xl p-4 mb-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Secured Property</div>
                                    <div className="text-sm font-bold text-[#1a2340] leading-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {propertyTitle}
                                    </div>
                                    <div className="text-xs text-[#6b7280] font-600">{propertyLocation}</div>
                                </div>
                                <span className="text-[9px] font-bold bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Active
                                </span>
                            </div>
                        </div>

                        {/* Seller / Buyer */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[
                                { label: 'Seller', name: sellerName, phone: sellerPhone, email: sellerEmail },
                                { label: 'Buyer', name: buyerName, phone: buyerPhone, email: buyerEmail },
                            ].map(({ label, name, phone, email }) => (
                                <div key={label} className="bg-[#fdfaf5] border border-[#e2d9c5] rounded-xl p-3">
                                    <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">{label}</div>
                                    <div className="text-sm font-black text-[#1a2340] mb-0.5">{name}</div>
                                    <div className="text-[10px] text-[#6b7280] font-600">{phone}</div>
                                    <div className="text-[10px] text-[#6b7280] font-600 truncate">{email}</div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Details */}
                        <div className="bg-[#fffbf0] border border-[#e2d9c5] rounded-xl p-4 mb-4">
                            <div className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Payment Gateway Details</div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#6b7280] font-600">Gateway</span>
                                    <span className="font-bold text-[#1a2340]">Razorpay P2P (Verified)</span>
                                </div>
                                <div className="flex justify-between text-xs gap-4">
                                    <span className="text-[#6b7280] font-600 flex-shrink-0">Order ID</span>
                                    <span className="font-mono text-[10px] font-bold text-[#1a2340] truncate">{orderId}</span>
                                </div>
                                <div className="flex justify-between text-xs gap-4">
                                    <span className="text-[#6b7280] font-600 flex-shrink-0">Txn ID</span>
                                    <span className="font-mono text-[10px] font-bold text-[#1a2340] truncate">{transactionId}</span>
                                </div>
                            </div>
                        </div>

                        {/* Agreement Notice */}
                        <div className="bg-[#fffbf0] border border-[#c9a84c]/50 rounded-xl p-3 mb-5 flex items-start gap-2">
                            <FileText size={14} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-[#b8933a] font-600 leading-relaxed">
                                <strong className="font-black">Agreement to Sell</strong> — Click <em>"Agreement PDF"</em> to download the legal token agreement document. Click <em>"Receipt PDF"</em> to download the payment receipt.
                            </p>
                        </div>

                        {/* Verified footer */}
                        <div className="text-center py-2.5 bg-[#f8f5ee] border border-[#e2d9c5] rounded-lg mb-5">
                            <div className="flex items-center justify-center gap-1.5 text-[#9ca3af]">
                                <Shield size={11} />
                                <p className="text-[9px] font-bold uppercase tracking-widest">
                                    Kharsan Properties Authenticated · Verified at {agreementTime}
                                </p>
                            </div>
                        </div>

                        {/* ── 3 Action Buttons ── */}
                        <div className="flex gap-2 print-hidden">
                            {/* Print Receipt */}
                            <button
                                onClick={handlePrintReceipt}
                                className="flex-1 py-3 bg-white border-2 border-[#e2d9c5] hover:border-[#1a2340] text-[#1a2340] rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all uppercase tracking-widest"
                            >
                                <Printer size={13} /> Print Receipt
                            </button>

                            {/* Open Agreement → Save as PDF */}
                            <button
                                onClick={handleDownloadAgreement}
                                className="flex-1 py-3 bg-[#1a2340] hover:bg-[#c9a84c] hover:text-[#1a1200] text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all uppercase tracking-widest shadow-md"
                            >
                                <FileText size={13} /> Agreement PDF
                            </button>

                            {/* Download Receipt PDF */}
                            <button
                                onClick={handleDownloadReceiptPDF}
                                className="flex-1 py-3 bg-[#c9a84c] hover:bg-[#b8933a] text-[#1a1200] rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all uppercase tracking-widest shadow-md"
                            >
                                <Download size={13} /> Receipt PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReceiptModal;