import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Heart, MessageSquare, CheckCircle, XCircle, AlertTriangle, Shield, CheckCheck } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(list);
      setUnreadCount(list.filter((n: any) => !n.isRead).length);
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
    
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="text-rose-500 fill-rose-500/10" size={16} />;
      case 'comment': return <MessageSquare className="text-blue-500" size={16} />;
      case 'approval': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'rejection': return <XCircle className="text-rose-600" size={16} />;
      case 'moderation': return <Shield className="text-amber-500" size={16} />;
      case 'admin_alert': return <AlertTriangle className="text-amber-600" size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold font-serif text-slate-900 dark:text-white">নোটিফিকেশন</h3>
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <CheckCheck size={12} />
                  সব পড়ুন
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {notifications.map((n) => (
                      <Link 
                        key={n.id}
                        to={n.link || '#'}
                        onClick={() => {
                          markAsRead(n.id);
                          setIsOpen(false);
                        }}
                        className={`flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.isRead ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{n.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">{formatDate(n.createdAt)}</span>
                        </div>
                        {!n.isRead && <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0"></div>}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <Bell size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm">কোনো নতুন নোটিফিকেশন নেই</p>
                  </div>
                )}
              </div>

              <Link 
                to="/notifications" 
                onClick={() => setIsOpen(false)}
                className="block text-center py-3 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                সব নোটিফিকেশন দেখুন
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
