
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import {CurvedArrowDownIcon} from './components/icons';
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
  TutorialType
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(null);
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<GenerateVideoParams | null>(null);

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
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error('Tutorial generation failed:', error);
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
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null);
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      const file = new File([lastVideoBlob], 'last_video.mp4', {type: lastVideoBlob.type});
      setInitialFormValues({
        ...lastConfig,
        mode: GenerationMode.EXTEND_VIDEO,
        prompt: '',
        inputVideo: {file, base64: ''},
        inputVideoObject: lastVideoObject,
        resolution: Resolution.P720,
        startFrame: null,
        endFrame: null,
        referenceImages: [],
        styleImage: null,
        isLooping: false,
      });
      setAppState(AppState.IDLE);
      setVideoUrl(null);
      setAudioUrl(null);
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  return (
    <div className="h-screen bg-black text-gray-200 flex flex-col font-sans overflow-hidden">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      <header className="py-6 flex flex-col items-center px-8 relative z-10">
        <h1 className="text-5xl font-semibold tracking-wide text-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Veo Studio
        </h1>
        <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">Director's Cut</p>
      </header>
      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4 overflow-y-auto custom-scrollbar">
        {appState === AppState.IDLE ? (
          <>
            <div className="flex-grow flex items-center justify-center min-h-[40vh]">
              <div className="relative text-center">
                <h2 className="text-3xl text-gray-600">Enter a tutorial topic to start</h2>
                <CurvedArrowDownIcon className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-24 h-24 text-gray-700 opacity-60" />
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
                onRetry={handleRetry}
                onNewVideo={handleNewVideo}
                onExtend={handleExtend}
                canExtend={lastConfig?.resolution === Resolution.P720 && !!videoUrl}
              />
            )}
            {appState === AppState.ERROR && errorMessage && (
               <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg max-w-md animate-fade-in">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
                <p className="text-red-300">{errorMessage}</p>
                <button onClick={handleTryAgainFromError} className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
