import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Home = lazy(() => import('./pages/Home'));
const WriteStory = lazy(() => import('./pages/WriteStory'));
const StoryDetails = lazy(() => import('./pages/StoryDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const StoryList = lazy(() => import('./pages/StoryList'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={
              <div className="container mx-auto px-4 py-20 text-center">
                <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium font-serif">লোড হচ্ছে...</p>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/write" element={<WriteStory />} />
                <Route path="/write/:id" element={<WriteStory />} />
                <Route path="/story/:id" element={<StoryDetails />} />
                <Route path="/category/:categoryId" element={<StoryList />} />
                <Route path="/categories" element={<StoryList />} />
                <Route path="/search" element={<StoryList />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="*" element={<NotFound />} />
                {/* Add more routes as needed */}
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}
