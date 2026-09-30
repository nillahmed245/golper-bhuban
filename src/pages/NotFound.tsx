import { Link } from 'react-router-dom';
import { Ghost, Home } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <SEO title="পেজটি পাওয়া যায়নি" noindex={true} />
      
      <div className="mb-8 relative inline-block">
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
        <Ghost size={80} className="text-emerald-500 relative z-10 mx-auto" />
      </div>

      <h1 className="text-4xl font-bold font-serif mb-4 text-slate-900 dark:text-white">পেজটি পাওয়া যায়নি</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-12 leading-relaxed">
        দুঃখিত, আপনি যে পাতাটি খুঁজছেন তা আমরা খুঁজে পাইনি। হয়তো এটি সরিয়ে ফেলা হয়েছে অথবা লিংকটি ভুল।
      </p>

      <Link 
        to="/" 
        className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
      >
        <Home size={20} />
        <span>হোমে ফিরে যান</span>
      </Link>
    </div>
  );
}
