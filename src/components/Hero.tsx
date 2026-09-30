import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="relative h-[600px] flex items-center overflow-hidden">
      {/* Background Image with Scrim */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/src/assets/images/hero_reading_bengali_1790797539035.jpg" 
          alt="Bengali Reading Room" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent dark:from-slate-950/95"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif leading-tight">
              তোমার পছন্দের গল্প পড়ুন 📖
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
              সাহিত্যের এক মায়াবী জগত, যেখানে হাজারো গল্প আপনার অপেক্ষায়। রোমাঞ্চ, প্রেম, রহস্য বা কল্পনা—সবই পাবেন এখানে।
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="আপনার প্রিয় গল্পটি খুঁজুন..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-slate-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] whitespace-nowrap"
              >
                খুঁজুন
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="text-slate-400">জনপ্রিয়:</span>
              <button onClick={() => navigate('/category/Horror')} className="text-white hover:text-emerald-400 transition-colors">ভৌতিক</button>
              <button onClick={() => navigate('/category/Mystery')} className="text-white hover:text-emerald-400 transition-colors">রহস্য</button>
              <button onClick={() => navigate('/category/Love')} className="text-white hover:text-emerald-400 transition-colors">রোমান্টিক</button>
              <button onClick={() => navigate('/category/Kids')} className="text-white hover:text-emerald-400 transition-colors">ছোটদের গল্প</button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
