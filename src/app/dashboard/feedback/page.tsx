'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';

const feedbackTypes = [
  { value: 'suggestion', label: '💡 Góp ý tính năng' },
  { value: 'bug', label: '🐛 Báo lỗi' },
  { value: 'complaint', label: '😤 Khiếu nại' },
  { value: 'other', label: '📝 Khác' },
];

export default function FeedbackPage() {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('suggestion');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.submitFeedback({ message, type });
      setSent(true);
      setMessage('');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Cảm ơn bạn!</h2>
        <p className="text-slate-400 mb-6">Ý kiến của bạn đã được gửi. Chúng tôi sẽ xem xét và phản hồi sớm nhất.</p>
        <button onClick={() => setSent(false)}
          className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 font-medium transition-colors">
          Gửi ý kiến khác
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare size={24} className="text-teal-400" />
        <h1 className="text-2xl font-bold">Đóng góp ý kiến</h1>
      </div>

      <p className="text-slate-400 mb-6">
        Chúng tôi luôn lắng nghe! Hãy chia sẻ ý kiến, góp ý hoặc báo lỗi để PetLog ngày càng tốt hơn.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Loại phản hồi</label>
          <div className="grid grid-cols-2 gap-3">
            {feedbackTypes.map((t) => (
              <button key={t.value} type="button" onClick={() => setType(t.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                  type === t.value
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300 border'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-500'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Nội dung</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required
            rows={5} placeholder="Mô tả chi tiết ý kiến của bạn..."
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors resize-none" />
        </div>

        <button type="submit" disabled={sending || !message.trim()}
          className="w-full py-3.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2">
          <Send size={16} />
          {sending ? 'Đang gửi...' : 'Gửi ý kiến'}
        </button>
      </form>
    </div>
  );
}
