import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Heart, MessageSquare, CheckCircle, XCircle, Shield, AlertTriangle, Trash2, CheckCheck } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { isRead: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="text-rose-500" size={24} />;
      case 'comment': return <MessageSquare className="text-blue-500" size={24} />;
      case 'approval': return <CheckCircle className="text-emerald-500" size={24} />;
      case 'rejection': return <XCircle className="text-rose-600" size={24} />;
      case 'moderation': return <Shield className="text-amber-500" size={24} />;
      case 'admin_alert': return <AlertTriangle className="text-amber-600" size={24} />;
      default: return <Bell size={24} />;
    }
  };

  if (!user) return <div className="container mx-auto px-4 py-20 text-center font-serif">দয়া করে লগইন করুন।</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO title="নোটিফিকেশন" noindex={true} />
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
            <Bell size={32} />
          </div>
          <h1 className="text-3xl font-bold font-serif">আপনার নোটিফিকেশন</h1>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
          >
            <CheckCheck size={18} />
            <span>সবগুলো পড়া হয়েছে হিসেবে মার্ক করুন</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 h-24 rounded-3xl"></div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n.id}
              className={`flex items-start gap-6 p-6 rounded-3xl border transition-all ${!n.isRead ? 'bg-emerald-50/30 dark:bg-emerald-900/5 border-emerald-100 dark:border-emerald-900/30 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
            >
              <div className={`p-4 rounded-2xl shrink-0 ${!n.isRead ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800'}`}>
                {getIcon(n.type)}
              </div>
              
              <div className="flex-1">
                <Link to={n.link || '#'} onClick={() => markAsRead(n.id)}>
                  <h3 className={`text-lg font-bold mb-1 ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {n.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    {n.message}
                  </p>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{formatDate(n.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        পড়া হয়েছে
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(n.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
          <Bell size={64} className="mx-auto mb-6 text-slate-300" />
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white mb-2">এখনও কোনো নোটিফিকেশন নেই</h2>
          <p className="text-slate-500">আপনার গল্পের লাইক বা কমেন্ট এলে এখানে জানানো হবে।</p>
        </div>
      )}
    </div>
  );
}
