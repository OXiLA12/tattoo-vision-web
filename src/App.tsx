import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { supabase } from './lib/supabaseClient';
import ImageUpload from './components/ImageUpload';
import Editor from './components/Editor';
import Export from './components/Export';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import History from './components/History';
import Library from './components/Library';
import Profile from './components/Profile';
import Extract from './components/Extract';
import OnboardingSurvey from './components/OnboardingSurvey';
import PaywallWrapper from './components/PaywallWrapper';
import Analytics from './pages/Analytics';

import { ImageData, TattooTransform } from './types';

function AppContent() {
  const { user, loading } = useAuth();
  // Start directly at 'library' for mobile app feel (or 'upload' if you prefer)
  const [page, setPage] = useState<'auth' | 'upload' | 'editor' | 'export' | 'history' | 'library' | 'profile' | 'extract' | 'analytics'>('library');
  const [showSurvey, setShowSurvey] = useState(false);
  const [bodyImage, setBodyImage] = useState<ImageData | null>(null);
  const [tattooImage, setTattooImage] = useState<ImageData | null>(null);
  const [tattooTransform, setTattooTransform] = useState<TattooTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
  });
  const [exportedImage, setExportedImage] = useState<string | null>(null);

  // Check if user needs to do survey
  useEffect(() => {
    async function checkSurveyStatus() {
      if (!user) return;

      try {
        // Check if user has answered the survey (marketing_source is not null)
        const { data, error } = await supabase
          .from('profiles')
          .select('marketing_source')
          .eq('id', user.id)
          .single<any>();

        if (!error && data && !data.marketing_source) {
          // If they haven't answered, and don't have the 'welcome bonus' transaction
          //Double check transaction just in case
          const { count } = await supabase
            .from('credit_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('type', 'bonus')
            .eq('description', 'Welcome bonus');

          if (count === 0) {
            setShowSurvey(true);
          }
        }
      } catch (err) {
        console.error("Error checking survey status:", err);
      }
    }

    checkSurveyStatus();
  }, [user]);

  // Show loading state with app-like splash screen
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src="/logo.png" alt="Tattoo Vision" className="w-full h-full object-contain animate-pulse" />
          </div>
          <div className="w-8 h-1 bg-[#00D4FF] rounded-full mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated - direct to auth (no welcome page)
  if (!user) {
    return (
      <div className="animate-fade-in">
        <Auth onSuccess={(isNewUser) => {
          if (isNewUser) setShowSurvey(true);
          setPage('library'); // Start at library for app-like experience
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {showSurvey && (
        <OnboardingSurvey onComplete={() => setShowSurvey(false)} />
      )}

      {/* Paywall - shown when subscription is required */}
      <PaywallWrapper />

      {user && page !== 'auth' && (
        <Navigation currentPage={page} onNavigate={(p) => setPage(p)} />
      )}

      {/* Main Content Area - Push content on desktop to account for sidebar */}
      <div className={`transition-all duration-300 ${user && page !== 'auth' ? 'md:pl-64 pb-20 md:pb-0' : ''}`}>

        {/* Auth page is handled above - no need for it here */}

        {page === 'history' && (
          <div key="history">
            <History onLoad={(body, tattoo, transform) => {
              setBodyImage(body);
              setTattooImage(tattoo);
              setTattooTransform(transform);
              setPage('editor');
            }} />
          </div>
        )}

        {page === 'library' && (
          <div key="library">
            <Library onSelect={(tattoo) => {
              setTattooImage(tattoo);
              // Check if we have a body image, if not go to upload, else editor
              if (bodyImage) {
                setPage('editor');
              } else {
                setPage('upload');
                // Ideally we'd show a message "Please upload a body photo first"
                // Or navigate to upload with the tattoo selected state
              }
            }} />
          </div>
        )}

        {page === 'profile' && (
          <div key="profile">
            <Profile />
          </div>
        )}

        {page === 'analytics' && (
          <div key="analytics">
            <Analytics />
          </div>
        )}

        {page === 'extract' && (
          <div key="extract">
            <Extract />
          </div>
        )}



        {page === 'upload' && (
          <div key="upload" className="animate-fade-in">
            <ImageUpload
              bodyImage={bodyImage}
              tattooImage={tattooImage}
              onBodyImageChange={setBodyImage}
              onTattooImageChange={setTattooImage}
              onNext={() => setPage('editor')}
            />
          </div>
        )}

        {page === 'editor' && bodyImage && tattooImage && (
          <div key="editor" className="animate-fade-in">
            <Editor
              bodyImage={bodyImage}
              tattooImage={tattooImage}
              transform={tattooTransform}
              onTransformChange={setTattooTransform}
              onTattooImageChange={setTattooImage}
              onBack={() => setPage('upload')}
              onNext={(exportedUrl) => {
                setExportedImage(exportedUrl);
                setPage('export');
              }}
              onRealistic={() => {
                setPage('export');
              }}
            />
          </div>
        )}

        {page === 'export' && exportedImage && (
          <div key="export" className="animate-fade-in">
            <Export
              exportedImage={exportedImage}
              bodyImage={bodyImage}
              tattooImage={tattooImage}
              transform={tattooTransform}
              onBack={() => setPage('editor')}
              onStartOver={() => {
                setBodyImage(null);
                setTattooImage(null);
                setExportedImage(null);
                setTattooTransform({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
                setPage('upload');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AppContent />
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
