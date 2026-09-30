import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { X, AlertTriangle } from 'lucide-react';
import { notifyAdmins } from '../lib/notificationService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  type: 'story' | 'comment';
  parentId?: string;
  targetName: string;
}

export default function ReportModal({ isOpen, onClose, targetId, type, parentId, targetName }: ReportModalProps) {
  const { user, profile } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'reports'), {
        type,
        targetId,
        parentId: parentId || '',
        targetName,
        reason,
        reporterId: user.uid,
        reporterName: profile?.displayName || 'অজানা ব্যবহারকারী',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // Notify Admins
      await notifyAdmins(
        'নতুন রিপোর্ট জমা হয়েছে',
        `"${targetName}" ${type === 'story' ? 'গল্পটির' : 'মতামতটির'} বিরুদ্ধে একটি রিপোর্ট জমা দেওয়া হয়েছে।`,
        '/admin'
      );

      alert('আপনার রিপোর্টটি সফলভাবে জমা দেওয়া হয়েছে। অ্যাডমিন এটি পর্যালোচনা করবেন।');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('রিপোর্ট জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={20} />
            <h2 className="text-xl font-bold font-serif">রিপোর্ট করুন</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            আপনি <span className="font-bold text-slate-900 dark:text-white">"{targetName}"</span> {type === 'story' ? 'গল্পটি' : 'মতামতটি'} রিপোর্ট করছেন। কেন এটি রিপোর্ট করছেন তা নিচে বিস্তারিত লিখুন:
          </p>

          <textarea
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="অপ্রাসঙ্গিক বা কুরুচিপূর্ণ বিষয়বস্তুর কারণ লিখুন..."
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
          />

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              বাতিল
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {loading ? 'জমা হচ্ছে...' : 'রিপোর্ট জমা দিন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
