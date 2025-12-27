
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VeoModel,
  TutorialType,
  ContentCategory
} from '../types';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
} from './icons';

const voices = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div>
    <label className={`text-[10px] uppercase tracking-wider block mb-1.5 font-bold ${disabled ? 'text-gray-500' : 'text-gray-400'}`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{icon}</div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-[#1f1f1f] border border-gray-700 rounded-xl pl-10 pr-8 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-sm">
        {children}
      </select>
      <ChevronDownIcon className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${disabled ? 'text-gray-600' : 'text-gray-400'}`} />
    </div>
  </div>
);

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
}

const PromptForm: React.FC<PromptFormProps> = ({onGenerate, initialValues}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [category, setCategory] = useState<ContentCategory>(initialValues?.category ?? ContentCategory.HOW_TO);
  const [model, setModel] = useState<VeoModel>(initialValues?.model ?? VeoModel.VEO_FAST);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialValues?.aspectRatio ?? AspectRatio.LANDSCAPE);
  const [resolution, setResolution] = useState<Resolution>(initialValues?.resolution ?? Resolution.P1080);
  const [tutorialType, setTutorialType] = useState<TutorialType>(initialValues?.tutorialType ?? TutorialType.BASIC_SLIDESHOW);
  
  const [isSmartTutorial, setIsSmartTutorial] = useState(initialValues?.isSmartTutorial ?? true);
  const [isDeepDive, setIsDeepDive] = useState(initialValues?.isDeepDive ?? false);
  const [hasVoiceover, setHasVoiceover] = useState(initialValues?.hasVoiceover ?? true);
  const [voiceName, setVoiceName] = useState(initialValues?.voiceName ?? 'Zephyr');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      prompt, category, model, aspectRatio, resolution, mode: GenerationMode.TEXT_TO_VIDEO,
      tutorialType, isSmartTutorial, isDeepDive, hasVoiceover, voiceName
    });
  };

  return (
    <div className="relative w-full">
      {isSettingsOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-4 p-6 bg-[#121214] rounded-3xl border border-gray-800 shadow-2xl z-20 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Studio Pipeline</h3>
              <CustomSelect label="Production Type" value={category} onChange={e => setCategory(e.target.value as ContentCategory)} icon={<SparklesIcon className="w-4 h-4" />}>
                <option value={ContentCategory.HOW_TO}>{ContentCategory.HOW_TO}</option>
                <option value={ContentCategory.DRAMA_REVIEW}>{ContentCategory.DRAMA_REVIEW}</option>
                <option value={ContentCategory.PRICE_IN_BD}>{ContentCategory.PRICE_IN_BD}</option>
              </CustomSelect>

              <div className="flex gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setTutorialType(TutorialType.BASIC_SLIDESHOW)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${tutorialType === TutorialType.BASIC_SLIDESHOW ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                  Slides (Rapid)
                </button>
                <button
                  type="button"
                  onClick={() => setTutorialType(TutorialType.PRO_VIDEO)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${tutorialType === TutorialType.PRO_VIDEO ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                  Veo (Cine)
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Mastering Settings</h3>
              <div className="flex items-center justify-between p-3.5 bg-gray-900 rounded-xl border border-gray-800">
                <div>
                  <p className="text-xs font-bold">Extended Narrative</p>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mt-0.5">
                    {category === ContentCategory.DRAMA_REVIEW ? 'FORCE ON (22+ MIN)' : (category === ContentCategory.PRICE_IN_BD ? 'FORCE ON (10 MIN)' : 'OPTIONAL (10+ MIN)')}
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  disabled={category !== ContentCategory.HOW_TO}
                  checked={category !== ContentCategory.HOW_TO || isDeepDive} 
                  onChange={e => setIsDeepDive(e.target.checked)} 
                  className="w-5 h-5 text-indigo-600 rounded-lg bg-black border-gray-700 focus:ring-indigo-500 disabled:opacity-50" 
                />
              </div>
              <CustomSelect label="Narrator Profile" value={voiceName} onChange={e => setVoiceName(e.target.value)} icon={<SparklesIcon className="w-4 h-4" />}>
                {voices.map(v => <option key={v} value={v}>{v}</option>)}
              </CustomSelect>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-end gap-3 bg-[#161618] border border-gray-800 rounded-[2rem] p-3 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={
              category === ContentCategory.DRAMA_REVIEW ? "e.g. Analysis of Succession Season 4 Finale..." : 
              (category === ContentCategory.PRICE_IN_BD ? "e.g. Samsung S25 Ultra Full Specs & Price BD..." : "e.g. Ultimate Guide to 3D Printing in 2025...")
            }
            className="flex-grow bg-transparent focus:outline-none resize-none text-base text-gray-200 placeholder-gray-700 max-h-48 py-3 px-5 leading-relaxed"
            rows={1}
          />
          <button
            type="button"
            onClick={() => setIsSettingsOpen(p => !p)}
            className={`p-4 rounded-2xl hover:bg-gray-800 transition-colors ${isSettingsOpen ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-500'}`}>
            <SlidersHorizontalIcon className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="p-4 bg-white text-black rounded-2xl hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-700 transition-all shadow-xl">
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-5 mt-4 ml-6">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.1em]">{category}</p>
          </div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.1em]">{tutorialType}</p>
          {(category === ContentCategory.DRAMA_REVIEW) && (
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] border-b border-indigo-500/30 pb-0.5">22+ MIN PRODUCTION</p>
          )}
          {(category === ContentCategory.PRICE_IN_BD) && (
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] border-b border-indigo-500/30 pb-0.5">10 MIN PRODUCTION</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default PromptForm;
