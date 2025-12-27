
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useEffect, useState } from 'react';
import {ArrowPathIcon, PlusIcon, SparklesIcon, TvIcon, FilmIcon} from './icons';
import {GroundingSource} from '../types';

interface VideoResultProps {
  videoUrl?: string;
  slideshowImages?: string[];
  thumbnailUrl?: string;
  audioUrl?: string;
  sources?: GroundingSource[];
  onRetry: () => void;
  onNewVideo: () => void;
  onExtend: () => void;
  canExtend: boolean;
}

const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  slideshowImages = [],
  thumbnailUrl,
  audioUrl,
  sources,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // Slideshow Timing Logic
  useEffect(() => {
    if (slideshowImages.length > 0 && audioUrl) {
      const audio = audioRef.current;
      if (!audio) return;

      const updateSlide = () => {
        if (audio.duration) {
          const progress = audio.currentTime / audio.duration;
          const index = Math.min(
            Math.floor(progress * slideshowImages.length),
            slideshowImages.length - 1
          );
          setCurrentSlide(index);
        }
      };

      audio.addEventListener('timeupdate', updateSlide);
      return () => audio.removeEventListener('timeupdate', updateSlide);
    }
  }, [slideshowImages, audioUrl]);

  // Sync logic for Pro Mode
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const syncPlayback = () => {
      if (video.paused) audio.pause();
      else audio.play().catch(() => {});
    };

    const syncTime = () => {
      if (Math.abs(video.currentTime - audio.currentTime) > 0.2) {
        audio.currentTime = video.currentTime;
      }
    };

    video.addEventListener('play', syncPlayback);
    video.addEventListener('pause', syncPlayback);
    video.addEventListener('timeupdate', syncTime);

    return () => {
      video.removeEventListener('play', syncPlayback);
      video.removeEventListener('pause', syncPlayback);
      video.removeEventListener('timeupdate', syncTime);
    };
  }, [audioUrl, videoUrl]);

  const handleExportHD = async () => {
    if (!audioUrl || slideshowImages.length === 0 || !canvasRef.current) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1920; // 1080p
    canvas.height = 1080;
    
    const audio = new Audio(audioUrl);
    await audio.play();
    
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setExportedVideoUrl(URL.createObjectURL(blob));
      setIsExporting(false);
      audio.pause();
    };

    mediaRecorder.start();

    const renderFrame = () => {
      if (audio.paused || audio.ended) {
        mediaRecorder.stop();
        return;
      }

      const progress = audio.currentTime / audio.duration;
      const index = Math.min(Math.floor(progress * slideshowImages.length), slideshowImages.length - 1);
      const img = new Image();
      img.src = slideshowImages[index];
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setExportProgress(Math.floor(progress * 100));
        requestAnimationFrame(renderFrame);
      };
    };

    renderFrame();
  };

  const handleDownloadThumbnail = () => {
    if (!thumbnailUrl) return;
    const link = document.createElement('a');
    link.href = thumbnailUrl;
    link.download = 'tutorial_thumbnail_hd.png';
    link.click();
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 p-6 bg-gray-900/60 rounded-3xl border border-gray-700 shadow-2xl backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between w-full px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 italic">
            {videoUrl ? 'Pro Video Master' : 'Basic Tutorial Master'}
          </h2>
        </div>
        {thumbnailUrl && (
          <button 
            onClick={handleDownloadThumbnail}
            className="text-[10px] px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-indigo-400 font-bold tracking-tighter transition-all"
          >
            DOWNLOAD HD THUMBNAIL
          </button>
        )}
      </div>

      <div className="w-full relative group aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-gray-800">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full relative">
            <img 
              src={slideshowImages[currentSlide]} 
              alt={`Step ${currentSlide + 1}`} 
              className="w-full h-full object-cover transition-opacity duration-1000"
            />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/10">
              SLIDE {currentSlide + 1} OF {slideshowImages.length}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent flex items-end p-6">
              <div className="w-full flex items-center gap-4">
                <div className="flex-grow h-1.5 bg-gray-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500 transition-all duration-300" 
                     style={{ width: `${((currentSlide + 1) / slideshowImages.length) * 100}%` }}
                   />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {audioUrl && (
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            autoPlay 
            controls={!videoUrl} 
            className={videoUrl ? "hidden" : "absolute bottom-12 right-6 opacity-60 hover:opacity-100 transition-all scale-75 origin-right"} 
          />
        )}

        {isExporting && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-indigo-500 transition-all" style={{width: `${exportProgress}%`}}></div>
            </div>
            <p className="text-white font-bold animate-pulse text-sm">RENDERING HD MASTER: {exportProgress}%</p>
          </div>
        )}
      </div>

      {exportedVideoUrl && (
        <div className="w-full p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-xl flex items-center justify-between animate-fade-in">
          <p className="text-sm font-medium text-indigo-300">Video Master Exported Successfully</p>
          <a href={exportedVideoUrl} download="tutorial_master_hd.webm" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all">
            DOWNLOAD MP4 (WEBM)
          </a>
        </div>
      )}

      {sources && sources.length > 0 && (
        <div className="w-full bg-black/40 p-4 rounded-xl border border-gray-800">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Verified Grounding</h3>
          <div className="flex flex-wrap gap-3">
            {sources.map((source, i) => (
              <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 underline transition-colors">
                {source.title.length > 40 ? source.title.substring(0, 40) + '...' : source.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-wrap justify-center gap-3 w-full">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-2xl transition-all border border-gray-700">
          <ArrowPathIcon className="w-4 h-4" />
          Regenerate
        </button>
        {!videoUrl && !exportedVideoUrl && (
          <button
            onClick={handleExportHD}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30">
            <TvIcon className="w-4 h-4" />
            Export HD Video
          </button>
        )}
        {videoUrl && canExtend && (
          <button
            onClick={onExtend}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30">
            <FilmIcon className="w-4 h-4" />
            Extend Video
          </button>
        )}
        <button
          onClick={onNewVideo}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-purple-500/30">
          <PlusIcon className="w-4 h-4" />
          Create New
        </button>
      </div>
    </div>
  );
};

export default VideoResult;
