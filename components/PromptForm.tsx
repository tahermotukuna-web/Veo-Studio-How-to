
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  VeoModel,
  VideoFile,
  TutorialType
} from '../types';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FilmIcon,
  FramesModeIcon,
  PlusIcon,
  RectangleStackIcon,
  ReferencesModeIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  XMarkIcon,
} from './icons';

const voices = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.FRAMES_TO_VIDEO]: <FramesModeIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: <ReferencesModeIcon className="w-5 h-5" />,
  [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div>
    <label className={`text-xs block mb-1.5 font-medium ${disabled ? 'text-gray-500' : 'text-gray-400'}`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{icon}</div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-10 pr-8 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50">
        {children}
      </select>
      <ChevronDownIcon className={`w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${disabled ? 'text-gray-600' : 'text-gray-400'}`} />
    </div>
  </div>
);

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
}

const PromptForm: React.FC<PromptFormProps> = ({onGenerate, initialValues}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(initialValues?.model ?? VeoModel.VEO_FAST);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialValues?.aspectRatio ?? AspectRatio.LANDSCAPE);
  const [resolution, setResolution] = useState<Resolution>(initialValues?.resolution ?? Resolution.P720);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO);
  const [tutorialType, setTutorialType] = useState<TutorialType>(initialValues?.tutorialType ?? TutorialType.BASIC_SLIDESHOW);
  
  // Studio features
  const [isSmartTutorial, setIsSmartTutorial] = useState(initialValues?.isSmartTutorial ?? (tutorialType === TutorialType.PRO_VIDEO));
  const [hasVoiceover, setHasVoiceover] = useState(initialValues?.hasVoiceover ?? true);
  const [voiceName, setVoiceName] = useState(initialValues?.voiceName ?? 'Zephyr');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt ?? '');
      setTutorialType(initialValues.tutorialType ?? TutorialType.BASIC_SLIDESHOW);
      setIsSmartTutorial(initialValues.isSmartTutorial ?? false);
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      prompt, model, aspectRatio, resolution, mode: generationMode,
      tutorialType, isSmartTutorial, hasVoiceover, voiceName
    });
  };

  return (
    <div className="relative w-full">
      {isSettingsOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-3 p-6 bg-[#2c2c2e] rounded-2xl border border-gray-700 shadow-2xl z-20 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Tutorial Quality</h3>
              <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTutorialType(TutorialType.BASIC_SLIDESHOW)}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${tutorialType === TutorialType.BASIC_SLIDESHOW ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                  Basic (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setTutorialType(TutorialType.PRO_VIDEO)}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${tutorialType === TutorialType.PRO_VIDEO ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                  Pro (Veo - Paid)
                </button>
              </div>
              
              {tutorialType === TutorialType.PRO_VIDEO && (
                 <div className="grid grid-cols-2 gap-4">
                    <CustomSelect label="Resolution" value={resolution} onChange={e => setResolution(e.target.value as Resolution)} icon={<TvIcon className="w-4 h-4" />}>
                      <option value={Resolution.P720}>720p</option>
                      <option value={Resolution.P1080}>1080p</option>
                    </CustomSelect>
                    <CustomSelect label="Aspect Ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} icon={<RectangleStackIcon className="w-4 h-4" />}>
                      <option value={AspectRatio.LANDSCAPE}>16:9</option>
                      <option value={AspectRatio.PORTRAIT}>9:16</option>
                    </CustomSelect>
                 </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Enhancements</h3>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <p className="text-sm font-medium">Advanced Research</p>
                  <p className="text-[10px] text-gray-500">Enable Google Search analysis</p>
                </div>
                <input type="checkbox" checked={isSmartTutorial} onChange={e => setIsSmartTutorial(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded bg-gray-900" />
              </div>
              <CustomSelect label="Narrator Voice" value={voiceName} onChange={e => setVoiceName(e.target.value)} icon={<SparklesIcon className="w-4 h-4" />}>
                {voices.map(v => <option key={v} value={v}>{v}</option>)}
              </CustomSelect>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-end gap-2 bg-[#1f1f1f] border border-gray-600 rounded-3xl p-3 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. How to create a YouTube account"
            className="flex-grow bg-transparent focus:outline-none resize-none text-base text-gray-200 placeholder-gray-600 max-h-48 py-2 px-4"
            rows={1}
          />
          <button
            type="button"
            onClick={() => setIsSettingsOpen(p => !p)}
            className={`p-3 rounded-full hover:bg-gray-700 transition-colors ${isSettingsOpen ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400'}`}>
            <SlidersHorizontalIcon className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="p-3 bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 transition-all shadow-lg hover:shadow-indigo-500/20">
            <ArrowRightIcon className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 ml-4">
          {tutorialType === TutorialType.BASIC_SLIDESHOW ? 'Using Basic Mode (Standard Tier)' : 'Using Pro Mode (Requires Paid Veo Key)'}
        </p>
      </form>
    </div>
  );
};

export default PromptForm;
