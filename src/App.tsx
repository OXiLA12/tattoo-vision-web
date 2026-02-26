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
import UpdatePassword from './components/UpdatePassword';
import OnboardingSurvey from './components/OnboardingSurvey';
import PaywallWrapper from './components/PaywallWrapper';
import Analytics from './pages/Analytics';
import ClippeurDashboard from './pages/ClippeurDashboard';
import BrandMark from './components/BrandMark';
import { LanguageProvider } from './contexts/LanguageContext';

import { ImageData, TattooTransform } from './types';

function AppContent() {
  const { user, loading } = useAuth();
  // Start directly at 'upload' for easy onboarding
  const [page, setPage] = useState<'auth' | 'upload' | 'editor' | 'export' | 'history' | 'library' | 'profile' | 'extract' | 'analytics' | 'clippeurs' | 'update-password'>('upload');
  const [showSurvey, setShowSurvey] = useState(false);
  const [bodyImage, setBodyImage] = useState<ImageData | null>(null);
  const [tattooImage, setTattooImage] = useState<ImageData | null>(null);
  const [tattooTransform, setTattooTransform] = useState<TattooTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 0.75,
  });
  const [exportedImage, setExportedImage] = useState<string | null>(null);

  // Listen for password reset URL
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event == "PASSWORD_RECOVERY") {
        setPage('update-password');
      }
    });

    // Also check URL hash directly on load just in case
    const hash = window.location.hash;
    const pathname = window.location.pathname;

    if (pathname === '/update-password' || (hash && hash.includes('type=recovery'))) {
      setPage('update-password');
    }

    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('tv_referral_code', ref);
    }

    // --- Stripe success redirect: restore state and go to export ---
    if (params.get('success') === 'true' && sessionStorage.getItem('tv_pending_render') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      try {
        const savedExported = sessionStorage.getItem('tv_exported_image');
        const savedBody = sessionStorage.getItem('tv_body_image');
        const savedTattoo = sessionStorage.getItem('tv_tattoo_image');
        const savedTransform = sessionStorage.getItem('tv_transform');
        if (savedExported) {
          setExportedImage(savedExported);
          if (savedBody) setBodyImage(JSON.parse(savedBody));
          if (savedTattoo) setTattooImage(JSON.parse(savedTattoo));
          if (savedTransform) setTattooTransform(JSON.parse(savedTransform));
          setPage('export');
          // Keep tv_pending_render so Export.tsx auto-triggers the render
        }
      } catch (e) {
        console.error('Failed to restore session state after Stripe redirect', e);
      }
    }
  }, []);

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
        <div className="flex flex-col items-center">
          <div className="animate-pulse">
            <BrandMark />
          </div>
          <div className="w-12 h-1 bg-[#0091FF] rounded-full mt-8 animate-pulse shadow-[0_0_10px_rgba(0,145,255,0.5)]"></div>
        </div>
      </div>
    );
  }

  // Show update password screen if requested
  if (page === 'update-password') {
    return (
      <div className="animate-fade-in">
        <UpdatePassword onComplete={() => setPage('upload')} />
      </div>
    );
  }

  // Show auth page if not authenticated - direct to auth (no welcome page)
  if (!user) {
    return (
      <div className="animate-fade-in">
        <Auth onSuccess={(isNewUser) => {
          if (isNewUser) setShowSurvey(true);
          setPage('upload'); // Start at upload for easy onboarding
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

      {user && page !== 'auth' && page !== 'editor' && page !== 'export' && (
        <Navigation currentPage={page} onNavigate={(p) => setPage(p)} />
      )}

      {/* Main Content Area - Push content on desktop to account for sidebar */}
      <div className={`transition-all duration-300 h-full ${user && page !== 'auth' ? 'md:pl-64' : ''}`}>

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
            <Profile onNavigate={(p: 'analytics' | 'clippeurs') => setPage(p)} />
          </div>
        )}

        {page === 'analytics' && (
          <div key="analytics">
            <Analytics />
          </div>
        )}

        {page === 'clippeurs' && (
          <div key="clippeurs" className="animate-fade-in">
            <ClippeurDashboard />
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
                setTattooTransform({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 0.75 });
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
      <LanguageProvider>
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
