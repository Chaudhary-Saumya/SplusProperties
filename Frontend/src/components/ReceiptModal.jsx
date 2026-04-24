import React from 'react';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, CheckCircle, Printer, Download } from 'lucide-react';

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

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

        const getAgreementDocument = () => `<!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Agreement to Sell - ${escapeHtml(receiptNumber)}</title>
        
          <style>
            body {and html {
              font-family: "Times New Roman", serif;
              margin: 40px;
              color: #000;
              line-height: 1.6;
              font-size: 14px;
            }
        
            h1 {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 25px;
            }
        
            .section-title {
              font-weight: bold;
              margin-top: 20px;
              text-transform: uppercase;
            }
        
            .content {
              margin-top: 10px;
              text-align: justify;
            }
        
            .signature {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
        
            .sign-box {
              width: 40%;
              text-align: center;
            }
        
            .line {
              margin-top: 50px;
              border-top: 1px solid black;
            }
        
            .witness {
              margin-top: 40px;
            }
          </style>
        </head>
        
        <body>
        
          <h1>AGREEMENT TO SELL (TOKEN AGREEMENT)</h1>
        
          <p>
            This Agreement to Sell is made and executed at <b>${escapeHtml(propertyLocation)}</b> 
            on this <b>${escapeHtml(agreementDate)}</b>.
          </p>
        
          <p class="section-title">BETWEEN</p>
        
          <p>
            <b>${escapeHtml(sellerName)}</b> (hereinafter referred to as the “SELLER”)
          </p>
        
          <p style="text-align:center;"><b>AND</b></p>
        
          <p>
            <b>${escapeHtml(buyerName)}</b> (hereinafter referred to as the “BUYER”)
          </p>
        
          <p class="section-title">WHEREAS</p>
        
          <p class="content">
            1. The Seller is the lawful and absolute owner of the property situated at 
            <b>${escapeHtml(propertyLocation)}</b>.
          </p>
        
          <p class="content">
            2. The Seller has agreed to sell and the Buyer has agreed to purchase the said property.
          </p>
        
          <p class="section-title">TOTAL SALE CONSIDERATION</p>
        
          <p class="content">
            ₹ ${escapeHtml(receiptData.amount)} (Rupees only)
          </p>
        
          <p class="section-title">TOKEN PAYMENT (CONFIRMATION)</p>
        
          <p class="content">
            On this day, the Buyer has paid a token amount of 
            <b>${escapeHtml(amountText)}</b> to the Seller as confirmation of this deal.
            The Seller hereby acknowledges receipt of the same.
          </p>
        
          <p class="section-title">BALANCE PAYMENT</p>
        
          <p class="content">
            The remaining amount shall be paid by the Buyer at the time of final registration.
          </p>
        
          <p class="section-title">NOTE</p>
        
          <p class="content">
            This agreement confirms that the Buyer has given token money to the Seller for the above property.
          </p>
        
          <div class="signature">
            <div class="sign-box">
              <div class="line"></div>
              Seller Signature
            </div>
        
            <div class="sign-box">
              <div class="line"></div>
              Buyer Signature
            </div>
          </div>
        
          <div class="witness">
            <p><b>WITNESSES</b></p>
            <p>1. __________________________</p>
            <p>2. __________________________</p>
          </div>
        
        </body>
        </html>`;

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('payment-receipt');
        html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`receipt_${receiptNumber}.pdf`);
        }).catch((err) => {
            console.error('PDF generation error:', err);
            toast.error('PDF download failed, please print instead.');
        });
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col md:flex-row">
                {/* Brand Side (Visible on Desktop) */}
                <div className="hidden md:flex md:w-1/3 bg-blue-600 p-10 flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                    
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <CheckCircle size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold font-['Outfit'] leading-tight">Verification Successful</h2>
                        <div className="w-12 h-1.5 bg-blue-400 rounded-full mt-4"></div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Transaction Node</p>
                            <p className="text-xs font-mono break-all">{transactionId}</p>
                        </div>
                        <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest leading-relaxed">
                            Secured by LandSelling <br /> P2P Protocol v2.0
                        </p>
                    </div>
                </div>

                {/* Content Side */}
                <div className="flex-1 p-8 md:p-12 bg-white relative">
                    <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-xl transition-all hover:rotate-90 print:hidden">
                        <X size={20} />
                    </button>

                    <div id="payment-receipt" className="print-container">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 font-['Outfit'] mb-1">Transaction Receipt</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Officially Tokened</p>
                                </div>
                                <p className="text-xs font-semibold text-blue-700 mt-2">Property Token Agreement</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt No.</p>
                                <p className="text-sm font-mono font-bold text-slate-900">#{receiptNumber}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Timestamp</p>
                                    <p className="text-sm font-bold text-slate-900">{createdAtText}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Amount Paid</p>
                                    <p className="text-xl font-black text-blue-600">{amountText}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 relative group">
                                <div className="absolute top-4 right-6 bg-white px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-blue-600 shadow-sm transition-transform group-hover:scale-110">ACTIVE RESERVATION</div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Secured Property</p>
                                <h4 className="text-lg font-extrabold text-slate-900 mb-1">{propertyTitle}</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed italic wrap-break-word">
                                    {propertyLocation}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registrar (Seller)</p>
                                    <p className="text-sm font-bold text-slate-800">{sellerName}</p>
                                    <p className="text-xs text-slate-600 mt-1">{sellerPhone}</p>
                                    <p className="text-xs text-slate-600 break-all">{sellerEmail}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Buyer Entity</p>
                                    <p className="text-sm font-bold text-slate-800">{buyerName}</p>
                                    <p className="text-xs text-slate-600 mt-1">{buyerPhone}</p>
                                    <p className="text-xs text-slate-600 break-all">{buyerEmail}</p>
                                </div>
                                <div className="col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-1">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Payment Method</p>
                                    <p className="text-xs font-bold text-blue-800">Razorpay P2P Gateway (Verified)</p>
                                    <p className="text-xs text-blue-900"><span className="font-semibold">Order ID:</span> {orderId}</p>
                                    <p className="text-xs text-blue-900"><span className="font-semibold">Transaction ID:</span> {transactionId}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4 print:hidden">
                            <button 
                                onClick={handlePrintReceipt}
                                className="flex-1 bg-white text-slate-900 border-2 border-slate-200 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                                <Printer size={18} /> Print Record
                            </button>
                            <button 
                                onClick={handleDownloadPDF}
                                className="flex-1 bg-linear-to-r from-[#c9a84c] to-[#b8933a] text-[#1a1200] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:from-[#b8933a] hover:to-[#a67c00] transition-all shadow-lg active:scale-95"
                            >
                                <Download size={18} /> Download PDF
                            </button>
                        </div>
                        
                        <div className="mt-8 text-center bg-slate-50 p-3 rounded-xl border border-dotted border-slate-200">
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
                                LandSelling Authenticated Digital Record <br />
                                Direct Transfer verified at {agreementTime}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
