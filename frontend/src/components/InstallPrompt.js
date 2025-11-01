import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroidDevice = /Android/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    setIsIOS(isIOSDevice && !isInStandaloneMode);
    setIsAndroid(isAndroidDevice && !isInStandaloneMode);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsIOS(false);
    setIsAndroid(false);
  };

  if (!showPrompt && !isIOS && !isAndroid) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-lg border-2 border-primary p-4 z-50 animate-slide-up">
      <button onClick={handleDismiss} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-primary-text text-sm mb-1">Installa Match Point</h3>
          
          {isIOS && (
            <p className="text-xs text-secondary-text mb-2">
              Tocca <span className="inline-flex items-center mx-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/>
                </svg>
              </span> poi "Aggiungi a Home"
            </p>
          )}
          
          {isAndroid && !deferredPrompt && (
            <p className="text-xs text-secondary-text mb-2">
              Tocca Menu (⋮) poi "Aggiungi a schermata Home"
            </p>
          )}
          
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="mt-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-2xl hover:bg-primary-hover transition-colors"
            >
              Installa App
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
