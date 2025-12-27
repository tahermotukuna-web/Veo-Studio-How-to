
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useEffect, useState } from 'react';
import {ArrowPathIcon, PlusIcon, SparklesIcon, TvIcon, FilmIcon, TvIcon as YoutubeIcon, XMarkIcon} from './icons';
import {GroundingSource, YouTubeMetadata} from '../types';
import YouTubeUploadModal from './YouTubeUploadModal';

interface VideoResultProps {
  videoUrl?: string;
  slideshowImages?: string[];
  thumbnailUrl?: string;
  audioUrl?: string;
  sources?: GroundingSource[];
  youtubeMetadata?: YouTubeMetadata;
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
  youtubeMetadata,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  // Sync slides with audio playback
  useEffect(() => {
    if (slideshowImages.length > 0 && audioUrl && isPlaying) {
      const audio = audioRef.current;
      if (!audio) return;

      const updateSlide = () => {
        if (audio.duration && audio.duration > 0) {
          const progress = audio.currentTime / audio.duration;
          const index = Math.min(
            Math.floor(progress * slideshowImages.length),
            slideshowImages.length - 1
          );
          if (index !== currentSlide) setCurrentSlide(index);
        }
      };

      audio.addEventListener('timeupdate', updateSlide);
      return () => audio.removeEventListener('timeupdate', updateSlide);
    }
  }, [slideshowImages, audioUrl, isPlaying, currentSlide]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Playback failed:", err);
          alert("Interaction required: Please click the play button to enable audio.");
        });
    }
  };

  const handleExportHD = async () => {
    if (!audioUrl || slideshowImages.length === 0 || !canvasRef.current) return;
    
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus("Loading production assets...");
      
      // Pre-load images to avoid flickers during export
      const bitmaps: ImageBitmap[] = await Promise.all(
        slideshowImages.map(async (src, i) => {
          setExportStatus(`Caching scene ${i + 1}/${slideshowImages.length}...`);
          const response = await fetch(src);
          const blob = await response.blob();
          return await createImageBitmap(blob);
        })
      );

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false })!;
      canvas.width = 1920; 
      canvas.height = 1080;
      
      const exportAudio = new Audio(audioUrl);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sourceNode = audioContext.createMediaElementSource(exportAudio);
      const destination = audioContext.createMediaStreamDestination();
      sourceNode.connect(destination);

      // Start audio specifically for recorder context
      await exportAudio.play();
      
      const EXPORT_FPS = 15; 
      const videoStream = canvas.captureStream(EXPORT_FPS);
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) videoStream.addTrack(audioTrack);

      const mimeType = 'video/webm;codecs=vp9,opus';
      const recorderOptions = { 
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: 12000000 // 12Mbps for extreme clarity
      };
      
      const mediaRecorder = new MediaRecorder(videoStream, recorderOptions);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: 'video/webm' });
        setExportedBlob(finalBlob);
        setExportedVideoUrl(URL.createObjectURL(finalBlob));
        setIsExporting(false);
        exportAudio.pause();
        audioContext.close();
        bitmaps.forEach(b => b.close());
      };

      mediaRecorder.start();

      const renderLoop = () => {
        if (exportAudio.paused || exportAudio.ended) {
          if (mediaRecorder.state === 'recording') mediaRecorder.stop();
          return;
        }

        const progress = exportAudio.currentTime / exportAudio.duration;
        const index = Math.min(Math.floor(progress * bitmaps.length), bitmaps.length - 1);
        
        ctx.drawImage(bitmaps[index], 0, 0, canvas.width, canvas.height);
        
        setExportProgress(Math.floor(progress * 100));
        setExportStatus(`Rendering Master Copy: ${Math.floor(exportAudio.currentTime)}s / ${Math.floor(exportAudio.duration)}s`);
        requestAnimationFrame(renderLoop);
      };

      renderLoop();
    } catch (err) {
      console.error("Export failed:", err);
      setIsExporting(false);
      alert("Export failed. Ensure you are using a modern desktop browser for large file renders.");
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 p-6 bg-gray-900/80 rounded-[2.5rem] border border-gray-700 shadow-2xl backdrop-blur-xl animate-fade-in overflow-hidden">
      {showYoutubeModal && (
        <YouTubeUploadModal 
          videoBlob={exportedBlob || undefined}
          thumbnailUrl={thumbnailUrl || undefined}
          metadata={youtubeMetadata}
          onClose={() => setShowYoutubeModal(false)}
        />
      )}

      <div className="flex items-center justify-between w-full px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100 tracking-tight">
              {videoUrl ? 'Veo Master Cut' : 'Studio Generation Ready'}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Production Verified • 1080p Assets
            </p>
          </div>
        </div>
        {exportedVideoUrl && (
          <button 
            onClick={() => setShowYoutubeModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
          >
            <YoutubeIcon className="w-4 h-4" />
            Publish Episode
          </button>
        )}
      </div>

      <div className="w-full relative group aspect-video rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-gray-800">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full relative cursor-pointer" onClick={togglePlayback}>
            <img 
              src={slideshowImages[currentSlide]} 
              alt="Scene" 
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm transition-all group-hover:bg-black/30">
                <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl scale-110 active:scale-95 transition-all">
                   <PlusIcon className="w-8 h-8 rotate-45" />
                </div>
                <p className="mt-6 text-white font-black uppercase tracking-[0.4em] text-[10px]">Preview Broadcast</p>
              </div>
            )}
            <div className="absolute top-6 left-6 flex gap-2">
              <div className="bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white border border-white/10 shadow-xl uppercase tracking-widest">
                SCENE {currentSlide + 1} / {slideshowImages.length}
              </div>
            </div>
            {isPlaying && (
              <div className="absolute bottom-6 left-6 right-6">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300" 
                    style={{width: `${(currentSlide / slideshowImages.length) * 100}%`}}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} className="hidden" onEnded={() => setIsPlaying(false)} />
        )}

        {isExporting && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-12 text-center">
            <div className="w-full max-w-sm space-y-8">
              <div className="relative">
                <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.6)]" style={{width: `${exportProgress}%`}}></div>
                </div>
                <div className="mt-4 flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Rendering</span>
                  <span>{exportProgress}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold text-sm tracking-tight">{exportStatus}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold animate-pulse">Encoding high-fidelity broadcast master...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {exportedVideoUrl && (
        <div className="w-full p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs">HQ</div>
            <div>
              <p className="text-sm font-bold text-indigo-300">Broadcast Master Ready</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Final encoded file available</p>
            </div>
          </div>
          <a href={exportedVideoUrl} download={`studio_production_${Date.now()}.webm`} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">
            Download Final
          </a>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-wrap justify-center gap-4 w-full">
        <button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all border border-gray-700 uppercase text-[10px] tracking-widest">
           <ArrowPathIcon className="w-4 h-4" /> Regenerate
        </button>
        {!videoUrl && !exportedVideoUrl && (
          <button onClick={handleExportHD} className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-2xl hover:shadow-indigo-500/40 uppercase text-[10px] tracking-widest">
            <TvIcon className="w-4 h-4" />
            Export High-Speed Master
          </button>
        )}
        <button onClick={onNewVideo} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-transparent border border-gray-800 hover:bg-gray-800 text-gray-400 font-bold rounded-2xl transition-all uppercase text-[10px] tracking-widest">
          <PlusIcon className="w-4 h-4" /> New Studio Project
        </button>
      </div>
    </div>
  );
};

export default VideoResult;
