'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface UpiQrCodeProps {
  upiId: string;
  amount: number;
  name?: string;
  qrImageUrl?: string;
}

export default function UpiQrCode({ upiId, amount, name = "Hack0'Clock", qrImageUrl }: UpiQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || qrImageUrl) return;

    // Build UPI deep link per NPCI specification
    const upiLink =
      `upi://pay?pa=${encodeURIComponent(upiId)}` +
      `&pn=${encodeURIComponent(name)}` +
      `&am=${amount}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent("Hack0'Clock Registration Fee")}`;

    QRCode.toCanvas(canvasRef.current, upiLink, {
      width: 220,
      margin: 2,
      color: {
        dark: '#06b6d4',
        light: '#111113',
      },
      errorCorrectionLevel: 'H',
    });
  }, [upiId, amount, name, qrImageUrl]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Canvas */}
      <div
        className="p-4 rounded-2xl"
        style={{
          background: '#111113',
          border: '1px solid rgba(6, 182, 212,0.2)',
          boxShadow: '0 0 30px rgba(6, 182, 212,0.1)',
        }}
      >
        {qrImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={qrImageUrl} 
            alt="Payment QR Code" 
            className="w-[220px] h-[220px] object-contain rounded-lg" 
          />
        ) : (
          <canvas ref={canvasRef} className="rounded-lg" />
        )}
      </div>

      {/* Payment info */}
      <div className="text-center">
        <p className="text-sm text-zinc-400">Paying To</p>
        <p className="font-semibold text-white mb-2">{name}</p>
        <p className="text-sm text-zinc-400">UPI ID</p>
        <p className="font-mono font-semibold text-cyan-400 text-sm">{upiId}</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-zinc-500 text-xs">Amount:</span>
          <span className="text-white font-bold text-lg">₹{amount}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">One-time registration fee</p>
      </div>

      {/* Instructions */}
      <div
        className="w-full text-xs text-zinc-400 space-y-1 p-3 rounded-xl"
        style={{ background: 'rgba(6, 182, 212,0.04)', border: '1px solid rgba(6, 182, 212,0.1)' }}
      >
        <p className="font-semibold text-zinc-300 mb-2">Payment Steps:</p>
        <p>1. Open any UPI app (GPay, PhonePe, Paytm, etc.)</p>
        <p>2. Scan the QR code or enter UPI ID manually</p>
        <p>3. Pay exactly <span className="text-cyan-400 font-semibold">₹{amount}</span></p>
        <p>4. Screenshot the payment confirmation</p>
        <p>5. Upload the screenshot below</p>
      </div>
    </div>
  );
}
