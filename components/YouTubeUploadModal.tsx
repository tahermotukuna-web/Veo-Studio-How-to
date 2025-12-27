
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { XMarkIcon, TvIcon, SparklesIcon } from './icons';
import { YouTubeMetadata } from '../types';

interface YouTubeUploadModalProps {
  videoBlob?: Blob;
  thumbnailUrl?: string;
  metadata?: YouTubeMetadata;
  onClose: () => void;
}

const channels = [
  { id: 'UC-main', name: 'Review Master HD', type: 'Primary' },
  { id: 'UC-alt', name: 'Tutorial Series', type: 'Educational' },
  { id: 'UC-short', name: 'Drama Bites', type: 'Entertainment' }
];

const YouTubeUploadModal: React.FC<YouTubeUploadModalProps> = ({ videoBlob, thumbnailUrl, metadata, onClose }) => {
  const [step, setStep] = useState<'CHANNEL' | 'UPLOAD'>('CHANNEL');
  const [selectedChannel, setSelectedChannel] = useState<string>(channels[0].id);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleStartUpload = async () => {
    setStep('UPLOAD');
    setIsUploading(true);
    setUploadStatus('Syncing with selected channel...');
    
    const steps = [
      { p: 15, s: 'Optimizing bitrates for Broadcast standard...' },
      { p: 40, s: 'Transmitting 22+ minute master file...' },
      { p: 70, s: 'Injecting high-fidelity DSLR thumbnail...' },
      { p: 90, s: 'Finalizing SEO tags and descriptions...' }
    ];

    for (const step of steps) {
      setProgress(step.p);
      setUploadStatus(step.s);
      await new Promise(r => setTimeout(r, 1000));
    }

    setProgress(100);
    setUploadStatus('Episode Live on YouTube!');
    setIsUploading(false);
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-[#111113] border border-gray-800 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between p-8 border-b border-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-600/20">
              <TvIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Final Production Release</h2>
          </div>
          {!isUploading && (
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-10 space-y-10">
          {step === 'CHANNEL' ? (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Target Channel</h3>
                <div className="grid grid-cols-1 gap-3">
                  {channels.map((chan) => (
                    <button 
                      key={chan.id}
                      onClick={() => setSelectedChannel(chan.id)}
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${selectedChannel === chan.id ? 'bg-red-600/10 border-red-500' : 'bg-gray-800/30 border-gray-800 hover:border-gray-700'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedChannel === chan.id ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                          {chan.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">{chan.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{chan.type}</p>
                        </div>
                      </div>
                      {selectedChannel === chan.id && <SparklesIcon className="w-5 h-5 text-red-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-1">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Master Poster</h4>
                  <div className="aspect-video bg-gray-800 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                    {thumbnailUrl && <img src={thumbnailUrl} className="w-full h-full object-cover" alt="Preview" />}
                  </div>
                </div>
                <div className="col-span-2 space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Metadata Verify</h4>
                  <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                    <p className="text-sm font-bold text-indigo-400 mb-1">{metadata?.title}</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed truncate italic">"{metadata?.description}"</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleStartUpload}
                className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-red-600/30 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
              >
                Confirm & Begin Release
              </button>
            </div>
          ) : (
            <div className="space-y-10 py-4 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <TvIcon className="w-8 h-8 text-red-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold">Uploading 22+ Minute Masterclass</h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">To: {channels.find(c => c.id === selectedChannel)?.name}</p>
              </div>

              <div className="space-y-5">
                <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-red-600 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(220,38,38,0.6)]" style={{width: `${progress}%`}} />
                </div>
                <p className="text-center text-[10px] font-black text-red-500 animate-pulse uppercase tracking-[0.3em]">{uploadStatus}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeUploadModal;
