'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine, Camera, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanQR();
      }
    } catch {
      setError('Không thể truy cập camera. Cần HTTPS hoặc localhost để sử dụng camera.');
    }
  };

  const scanQR = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if ('BarcodeDetector' in window) {
            const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: ImageData) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({ formats: ['qr_code'] });
            detector.detect(imageData).then((codes: { rawValue: string }[]) => {
              if (codes.length > 0) {
                handleQRResult(codes[0].rawValue);
              }
            }).catch(() => { /* ignore */ });
          }
        } catch { /* ignore */ }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const handleQRResult = async (value: string) => {
    stopCamera();
    setProcessing(true);

    let qrToken = value;
    try {
      const url = new URL(value);
      const roomMatch = url.pathname.match(/\/room\/([a-zA-Z0-9-]+)/);
      if (roomMatch) qrToken = roomMatch[1];
    } catch { /* not a URL, use raw value */ }

    qrToken = qrToken.trim();
    if (!qrToken || qrToken.length < 6) {
      setError(`QR không hợp lệ: ${value}`);
      setProcessing(false);
      return;
    }

    try {
      const roomInfo = await api.getRoomInfo(qrToken);

      if (roomInfo.active_booking?.diary_token) {
        router.push(`/dashboard/diary/${roomInfo.active_booking.diary_token}`);
      } else {
        router.push(`/room/${qrToken}`);
      }
    } catch {
      router.push(`/room/${qrToken}`);
    }
    setProcessing(false);
  };

  const [manualToken, setManualToken] = useState('');
  const handleManualGo = () => {
    if (manualToken.trim()) {
      const match = manualToken.match(/\/room\/([a-zA-Z0-9-]+)/);
      const token = match ? match[1] : manualToken.trim();
      handleQRResult(token);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
        <ScanLine size={24} className="text-teal-400" /> Quét QR phòng
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        {user?.role === 'staff'
          ? 'Quét mã QR phòng để mở nhật ký và cập nhật tình trạng thú cưng.'
          : 'Quét mã QR trên phòng để mở trang check-in hoặc nhật ký.'}
      </p>

      {/* Camera view */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 mb-4 aspect-[4/3]">
        {processing ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mb-3" />
            <p className="text-sm text-slate-400">Đang tìm thông tin phòng...</p>
          </div>
        ) : scanning ? (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-teal-400 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
                <div className="absolute left-2 right-2 h-0.5 bg-teal-400/80 animate-bounce" style={{ top: '50%' }} />
              </div>
            </div>
            <button onClick={stopCamera} className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
              <XCircle size={20} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Camera size={48} className="text-slate-600 mb-4" />
            <button onClick={startCamera}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-medium transition-colors flex items-center gap-2 active:scale-[0.98]">
              <ScanLine size={18} /> Mở camera quét QR
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Manual input fallback */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
        <p className="text-sm text-slate-400 mb-2">Hoặc nhập link/mã phòng thủ công:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Dán link QR hoặc mã phòng..."
            className="flex-1 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleManualGo()}
          />
          <button onClick={handleManualGo} disabled={!manualToken.trim() || processing}
            className="px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-sm font-medium transition-colors shrink-0">
            Đi
          </button>
        </div>
      </div>
    </div>
  );
}
