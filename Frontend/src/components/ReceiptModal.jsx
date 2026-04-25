import React from 'react';
import { toast } from 'react-toastify';
import { X, CheckCircle2, Printer, Download, Shield, FileText } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, receiptData }) => {
    if (!isOpen || !receiptData) return null;

    const fallbackReceipt = receiptData._id?.slice(-8) || receiptData.gatewayOrderId?.slice(-8) || 'UNAVAILABLE';
    const receiptNumber    = (receiptData.receiptNumber || fallbackReceipt).toUpperCase();
    const transactionId    = receiptData.razorpayPaymentId || receiptData.gatewayPaymentId || receiptData.paymentDetails?.razorpay_payment_id || 'TXN_VERIFIED_770';
    const orderId          = receiptData.razorpayOrderId   || receiptData.gatewayOrderId   || receiptData.paymentDetails?.razorpay_order_id   || 'N/A';
    const propertyTitle    = receiptData.listingTitle  || receiptData.listingId?.title    || 'Verified Property Reservation';
    const propertyLocation = receiptData.listingId?.location || receiptData.location      || 'LandSelling Verified Listing';
    const sellerName       = receiptData.sellerName    || receiptData.sellerId?.name      || 'Authorized Seller';
    const buyerName        = receiptData.buyerName     || receiptData.buyerId?.name       || 'Authorized Buyer';
    const sellerPhone      = receiptData.sellerPhone   || receiptData.sellerId?.phone     || '-';
    const buyerPhone       = receiptData.buyerPhone    || receiptData.buyerId?.phone      || '-';
    const sellerEmail      = receiptData.sellerEmail   || receiptData.sellerId?.email     || '-';
    const buyerEmail       = receiptData.buyerEmail    || receiptData.buyerId?.email      || '-';
    const createdAtText    = receiptData.date || (receiptData.createdAt ? new Date(receiptData.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : '-');
    const amountText       = `₹${Number(receiptData.amount || 0).toLocaleString('en-IN')}`;
    const agreementDate    = receiptData.createdAt ? new Date(receiptData.createdAt).toLocaleDateString('en-IN') : '-';
    const agreementTime    = receiptData.createdAt ? new Date(receiptData.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';

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
    const handlePrintReceipt = () => window.print();

    /* ── Open Agreement in new tab + auto trigger print (Save as PDF) ── */
    const handleDownloadAgreement = () => {
        try {
            const html = getAgreementDocument();
            const newWin = window.open('', '_blank');
            if (!newWin) {
                toast.error('Popup blocked — please allow popups and try again.');
                return;
            }
            newWin.document.open();
            newWin.document.write(html);
            newWin.document.close();
            newWin.focus();
            // Small delay to let the page render before print dialog
            setTimeout(() => {
                newWin.print();
            }, 800);
            toast.info('Use "Save as PDF" in the print dialog to download the agreement.');
        } catch (err) {
            console.error('Agreement open error:', err);
            toast.error('Could not open agreement. Try the Download button instead.');
        }
    };

    /* ── Fallback: download raw HTML file (user opens in browser → print as PDF) ── */
    const handleDownloadHTML = () => {
        try {
            const html = getAgreementDocument();
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Agreement_to_Sell_${receiptNumber}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Downloaded! Open the file in Chrome and print as PDF.');
        } catch (err) {
            console.error(err);
            toast.error('Download failed.');
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
                                <p className="text-[10px] text-[#c9a84c] font-bold uppercase tracking-wider">Payment Verified ✓</p>
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
                                <span className="text-[9px] font-bold bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                                    Active ✓
                                </span>
                            </div>
                        </div>

                        {/* Seller / Buyer */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[
                                { label: 'Seller', name: sellerName, phone: sellerPhone, email: sellerEmail },
                                { label: 'Buyer',  name: buyerName,  phone: buyerPhone,  email: buyerEmail },
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
                                <strong className="font-black">Agreement to Sell</strong> — Click <em>"Agreement PDF"</em> to open the legal token agreement document. In the browser print dialog, choose <strong>"Save as PDF"</strong> to download it.
                            </p>
                        </div>

                        {/* Verified footer */}
                        <div className="text-center py-2.5 bg-[#f8f5ee] border border-[#e2d9c5] rounded-lg mb-5">
                            <div className="flex items-center justify-center gap-1.5 text-[#9ca3af]">
                                <Shield size={11} />
                                <p className="text-[9px] font-bold uppercase tracking-widest">
                                    Splus Properties Authenticated · Verified at {agreementTime}
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

                            {/* Download HTML fallback */}
                            <button
                                onClick={handleDownloadHTML}
                                className="flex-1 py-3 bg-[#c9a84c] hover:bg-[#b8933a] text-[#1a1200] rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all uppercase tracking-widest shadow-md"
                            >
                                <Download size={13} /> Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReceiptModal;