
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import GoogleAuthDialog from './components/GoogleAuthDialog';
import {CurvedArrowDownIcon, TvIcon} from './components/icons';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateTutorial} from './services/geminiService';
import {
  AppState,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VideoFile,
  GroundingSource,
  TutorialType,
  YouTubeMetadata
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [user, setUser] = useState<{name: string, email: string, avatar: string} | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [youtubeMetadata, setYoutubeMetadata] = useState<YouTubeMetadata | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(null);
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<GenerateVideoParams | null>(null);

  const handleAccountSelect = (selectedUser: { name: string; email: string; avatar: string }) => {
    setUser(selectedUser);
    setIsAuthDialogOpen(false);
    setAppState(AppState.IDLE);
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    if (params.tutorialType === TutorialType.PRO_VIDEO && window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          setLastConfig(params);
          return;
        }
      } catch (error) {
        setShowApiKeyDialog(true);
        setLastConfig(params);
        return;
      }
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    setInitialFormValues(null);

    try {
      const result = await generateTutorial(params);
      if (result.tutorialType === TutorialType.PRO_VIDEO) {
        setVideoUrl(result.objectUrl || null);
        setSlideshowImages([]);
        setThumbnailUrl(null);
        setLastVideoBlob(result.blob || null);
        setLastVideoObject(result.video || null);
      } else {
        setSlideshowImages(result.slideshowImages || []);
        setThumbnailUrl(result.thumbnailUrl || null);
        setVideoUrl(null);
      }
      
      setAudioUrl(result.audioUrl || null);
      setGroundingSources(result.sources || []);
      setYoutubeMetadata(result.youtubeMetadata);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error('Production failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setErrorMessage(errorMessage);
      setAppState(AppState.ERROR);
      if (params.tutorialType === TutorialType.PRO_VIDEO && (errorMessage.includes('entity was not found') || errorMessage.includes('API key'))) {
        setShowApiKeyDialog(true);
      }
    }
  }, []);

  const handleRetry = useCallback(() => lastConfig && handleGenerate(lastConfig), [lastConfig, handleGenerate]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) await window.aistudio.openSelectKey();
    if (lastConfig) handleGenerate(lastConfig);
  };

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setSlideshowImages([]);
    setThumbnailUrl(null);
    setAudioUrl(null);
    setGroundingSources([]);
    setYoutubeMetadata(undefined);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null);
  }, []);

  return (
    <div className="h-screen bg-black text-gray-200 flex flex-col font-sans overflow-hidden">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      {isAuthDialogOpen && <GoogleAuthDialog onSelect={handleAccountSelect} onClose={() => setIsAuthDialogOpen(false)} />}
      
      {appState === AppState.AUTH ? (
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-10 rounded-[2.5rem] shadow-2xl text-center animate-fade-in">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl mx-auto mb-8 flex items-center justify-center">
              <TvIcon className="w-10 h-10 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-bold mb-3 tracking-tight">Veo Production Studio</h1>
            <p className="text-gray-400 mb-10 leading-relaxed text-sm">Professional AI-powered How-To and Drama Serial Review production suite.</p>
            <button 
              onClick={() => setIsAuthDialogOpen(true)}
              className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </button>
            <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secure Professional Production</p>
          </div>
        </div>
      ) : (
        <>
          <header className="py-6 flex flex-col items-center px-8 relative z-10">
            <h1 className="text-5xl font-semibold tracking-wide text-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Veo Studio
            </h1>
            <div className="flex items-center gap-4 mt-2">
               <div className="flex items-center gap-2">
                 <img src={user?.avatar} className="w-5 h-5 rounded-full" alt="Avatar" />
                 <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{user?.name}</p>
               </div>
               <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
               <button onClick={() => setAppState(AppState.AUTH)} className="text-indigo-400 text-[10px] uppercase font-bold hover:underline">Sign Out</button>
            </div>
          </header>
          <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4 overflow-y-auto custom-scrollbar">
            {appState === AppState.IDLE ? (
              <>
                <div className="flex-grow flex items-center justify-center min-h-[40vh]">
                  <div className="relative text-center">
                    <h2 className="text-2xl text-gray-600 font-medium tracking-tight">Enter your topic or serial title to start production</h2>
                    <CurvedArrowDownIcon className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-20 h-20 text-gray-700 opacity-40" />
                  </div>
                </div>
                <div className="pb-8">
                  <PromptForm onGenerate={handleGenerate} initialValues={initialFormValues} />
                </div>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center p-4">
                {appState === AppState.LOADING && <LoadingIndicator />}
                {appState === AppState.SUCCESS && (videoUrl || slideshowImages.length > 0) && (
                  <VideoResult
                    videoUrl={videoUrl || undefined}
                    slideshowImages={slideshowImages}
                    thumbnailUrl={thumbnailUrl || undefined}
                    audioUrl={audioUrl || undefined}
                    sources={groundingSources}
                    youtubeMetadata={youtubeMetadata}
                    onRetry={handleRetry}
                    onNewVideo={handleNewVideo}
                    onExtend={() => {}} 
                    canExtend={false}
                  />
                )}
                {appState === AppState.ERROR && errorMessage && (
                   <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg max-w-md animate-fade-in">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Production Error</h2>
                    <p className="text-red-300">{errorMessage}</p>
                    <button onClick={() => setAppState(AppState.IDLE)} className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                      Back to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
