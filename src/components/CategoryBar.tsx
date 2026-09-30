import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const categories = [
  { id: 'Love', name: 'ভালোবাসা', color: 'bg-rose-100 text-rose-600', icon: '❤️' },
  { id: 'Horror', name: 'ভৌতিক', color: 'bg-slate-100 text-slate-600', icon: '👻' },
  { id: 'Comedy', name: 'হাস্যরস', color: 'bg-amber-100 text-amber-600', icon: '😂' },
  { id: 'Mystery', name: 'রহস্য', color: 'bg-indigo-100 text-indigo-600', icon: '🔍' },
  { id: 'Fantasy', name: 'কল্পকাহিনী', color: 'bg-purple-100 text-purple-600', icon: '✨' },
  { id: 'Emotional', name: 'আবেগপ্রবণ', color: 'bg-emerald-100 text-emerald-600', icon: '😢' },
  { id: 'Adventure', name: 'অ্যাডভেঞ্চার', color: 'bg-orange-100 text-orange-600', icon: '🏔️' },
  { id: 'Kids', name: 'ছোটদের গল্প', color: 'bg-cyan-100 text-cyan-600', icon: '👶' },
];

export default function CategoryBar() {
  const navigate = useNavigate();

  return (
    <div className="py-8 overflow-x-auto no-scrollbar">
      <div className="flex gap-4 min-w-max px-4">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/category/${cat.id}`)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${cat.color} bg-white dark:bg-slate-800`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
