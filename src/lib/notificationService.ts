import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 'like' | 'comment' | 'approval' | 'rejection' | 'moderation' | 'admin_alert';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function sendNotification({ userId, type, title, message, link }: SendNotificationParams) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      link: link || '',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function notifyAdmins(title: string, message: string, link: string) {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    const adminUids = snap.docs.map(doc => doc.id);
    
    // Also include the hardcoded admin just in case their role isn't set in DB yet
    // (though it should be after their first login)
    
    const uniqueAdmins = [...new Set(adminUids)];
    
    const notifications = uniqueAdmins.map(uid => sendNotification({
      userId: uid,
      type: 'admin_alert',
      title,
      message,
      link
    }));

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}
