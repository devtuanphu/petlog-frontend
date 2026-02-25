'use client';

import { useEffect, useState, useRef } from 'react';
import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { Room } from '@/types';

function getCheckinUrl(qrToken: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/room/${qrToken}`;
  }
  return `/room/${qrToken}`;
}

/**
 * Generate a standalone SVG string for a QR code using the qrcode.react library
 * by rendering to a hidden container, extracting SVG markup, then cleaning up.
 */
function generateQRSvgString(value: string, size: number): string {
  // We'll use a data URL approach via canvas for the print window
  // Instead, use inline SVG by creating a temporary React root
  // Simplest approach: render SVG via the ReactDOMServer-free method (manual QR via canvas)
  // Actually let's just serialize the SVG from existing DOM elements
  return ''; // Placeholder — we'll use a different approach
}

function printRoomsHTML(roomsData: { name: string; token: string; url: string; svgHTML: string }[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert('Trình duyệt chặn popup! Hãy cho phép popup.'); return; }

  const pages = roomsData.map(r => `
    <div class="page">
      <div class="card">
        <h2>${r.name}</h2>
        <div class="qr">${r.svgHTML}</div>
        <p class="token">${r.token}</p>
        <p class="hint">Quét để check-in pet</p>
      </div>
    </div>
  `).join('');

  printWindow.document.write(`
    <html><head><title>PetLog QR</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, sans-serif; }
      .page {
        width: 100%; min-height: 100vh;
        display: flex; justify-content: center; align-items: center;
        page-break-after: always;
      }
      .page:last-child { page-break-after: auto; }
      .card { text-align: center; padding: 40px; }
      .card h2 { font-size: 32px; margin-bottom: 20px; font-weight: 700; }
      .qr { display: flex; justify-content: center; margin-bottom: 16px; }
      .qr svg { width: 260px; height: 260px; }
      .token { font-family: monospace; color: #666; font-size: 13px; }
      .hint { color: #999; font-size: 14px; margin-top: 6px; }
      @media print { .page { min-height: 100vh; } }
    </style></head><body>
    ${pages}
    <script>
      window.onload = function() { setTimeout(function() { window.print(); }, 200); };
    </script>
    </body></html>
  `);
  printWindow.document.close();
}

export default function QrPrintPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api.getRooms().then(setRooms).finally(() => setLoading(false)); }, []);

  /** Extract SVG HTML from the rendered QR codes on the page */
  const getSvgForRoom = (roomId: number): string => {
    const container = qrContainerRef.current;
    if (!container) return '';
    const card = container.querySelector(`[data-room-id="${roomId}"]`);
    if (!card) return '';
    const svg = card.querySelector('svg');
    if (!svg) return '';
    return svg.outerHTML;
  };

  const handlePrintSingle = (room: Room) => {
    const svgHTML = getSvgForRoom(room.id);
    if (!svgHTML) { alert('QR chưa sẵn sàng'); return; }
    printRoomsHTML([{
      name: room.room_name,
      token: room.qr_token,
      url: getCheckinUrl(room.qr_token),
      svgHTML,
    }]);
  };

  const handlePrintAll = () => {
    const roomsData = rooms.map(r => ({
      name: r.room_name,
      token: r.qr_token,
      url: getCheckinUrl(r.qr_token),
      svgHTML: getSvgForRoom(r.id),
    })).filter(r => r.svgHTML);

    if (roomsData.length === 0) { alert('QR chưa sẵn sàng'); return; }
    printRoomsHTML(roomsData);
  };

  if (loading) return <div className="animate-pulse text-teal-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold">In mã QR</h1>
        <button onClick={handlePrintAll} className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg bg-teal-600 hover:bg-teal-500 font-medium transition-colors flex items-center gap-2 text-sm md:text-base">
          <Printer size={16} /> In tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" ref={qrContainerRef}>
        {rooms.map((room: Room) => (
          <div key={room.id} data-room-id={room.id} className="rounded-xl bg-white p-5 md:p-6 text-center text-gray-900 group relative">
            <p className="text-base md:text-lg font-bold mb-3">{room.room_name}</p>
            <div className="flex justify-center mb-3">
              <QRCodeSVG
                value={getCheckinUrl(room.qr_token)}
                size={160}
                level="M"
                includeMargin
              />
            </div>
            <p className="text-xs text-gray-500 font-mono">{room.qr_token}</p>
            <p className="text-xs text-gray-400 mt-1">Quét để check-in pet</p>

            {/* Print single button */}
            <button
              onClick={() => handlePrintSingle(room)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-all"
              title="In phòng này"
            >
              <Printer size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
