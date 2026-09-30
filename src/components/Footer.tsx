import { Link } from 'react-router-dom';
import { BookOpen, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-4 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white mb-4">
              <span className="text-2xl font-bold tracking-tight font-serif">গল্পের ভুবন</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              আপনার প্রিয় গল্প পড়ার এবং শেয়ার করার জন্য বাংলাদেশের অন্যতম বড় প্ল্যাটফর্ম। আমাদের সাথে থাকুন সাহিত্যের সুন্দর সফরে।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">দ্রুত লিঙ্ক</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">হোম</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">বিভাগসমূহ</Link></li>
              <li><Link to="/trending" className="hover:text-white transition-colors">ট্রেন্ডিং গল্প</Link></li>
              <li><Link to="/new" className="hover:text-white transition-colors">নতুন গল্প</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-6">সহায়তা</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">যোগাযোগ</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">গোপনীয়তা নীতি</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">শর্তাবলী</Link></li>
            </ul>
          </div>

          {/* Newsletter / Social */}
          <div>
            <h3 className="text-white font-semibold mb-6">যুক্ত থাকুন</h3>
            <div className="flex gap-4 mb-6">
              <a href="#" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"><Twitter size={18} /></a>
              <a href="#" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"><Github size={18} /></a>
              <a href="#" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"><Mail size={18} /></a>
            </div>
            <div className="relative">
              <input 
                type="email" 
                placeholder="ইমেইল দিন..." 
                className="w-full bg-slate-800 border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-500 transition-colors">
                সাবস্ক্রাইব
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {currentYear} গল্পের ভুবন। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-6">
            <span>মেইড উইথ ❤️ বাংলাদেশে</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
