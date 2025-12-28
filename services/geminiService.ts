
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Modality,
  Type,
  Video,
} from '@google/genai';
import {GenerateVideoParams, GroundingSource, TutorialType, VideoGenerationResult, ContentCategory} from '../types';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateTutorial = async (
  params: GenerateVideoParams,
): Promise<VideoGenerationResult> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  if (params.tutorialType === TutorialType.BASIC_SLIDESHOW) {
    return generateBasicSlideshow(ai, params);
  } else {
    return generateProVideo(ai, params);
  }
};

async function generateBasicSlideshow(ai: any, params: GenerateVideoParams): Promise<VideoGenerationResult> {
  const currentFullDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isDrama = params.category === ContentCategory.DRAMA_REVIEW;
  const isPriceBD = params.category === ContentCategory.PRICE_IN_BD;
  
  const stepCount = isDrama ? 35 : (isPriceBD ? 20 : (params.isDeepDive ? 15 : 8));
  
  let groundingSources: GroundingSource[] = [];
  let researchContext = "";

  // 1. Research Step with Google Search
  const researchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Research the latest information for: "${params.prompt}" in the context of ${params.category}. 
               If it's a product, find current Price in Bangladesh (Official/Unofficial), full specifications, and key competitors.
               If it's a drama, find latest review summaries and viewership ratings.
               Current Date: ${currentFullDate}. 
               Provide a detailed summary to be used for a 10-22 minute video script.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  researchContext = researchResponse.text;
  
  // Extract grounding chunks
  const chunks = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    groundingSources = chunks
      .filter((c: any) => c.web)
      .map((c: any) => ({
        title: c.web.title || 'Source',
        uri: c.web.uri
      }));
  }

  let scriptDetail = "";
  if (isDrama) {
    scriptDetail = "ACT AS A BROADCAST TELEVISION CRITIC. This is a 22-MINUTE DRAMA REVIEW. Each of the 35 segments MUST have a lengthy, professional script (180-220 words per segment). Total word count MUST exceed 6,000 words.";
  } else if (isPriceBD) {
    scriptDetail = "ACT AS A TECH ANALYST IN BANGLADESH. This is a 10-MINUTE PRODUCT VIDEO focused on 'Price in BD'. Each of the 20 segments MUST have a script of 150-170 words. Mention the current price in BDT (Bangladeshi Taka) in every scene. Use the researched latest prices.";
  } else if (params.isDeepDive) {
    scriptDetail = "Provide a very detailed, comprehensive explanation (170-200 words per segment).";
  } else {
    scriptDetail = "Provide a concise professional explanation (60-90 words per segment).";
  }

  const planResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Create a massive ${stepCount}-segment production storyboard for: "${params.prompt}" based on this researched context:
               
               CONTEXT: ${researchContext}

               Storyboard Layout:
               1. THUMBNAIL: High-impact cinematic composite. ${isPriceBD ? 'Must show large BDT price text.' : ''}
               2. INTRO: Professional hook.
               3-${stepCount - 2}. CORE ANALYTICAL ARC: Extreme visual and narrative depth.
               ${stepCount - 1}. FINAL VERDICT / PRICE SUMMARY.
               ${stepCount}. OUTRO & CTA.

               ${scriptDetail}

               Provide metadata: Title, Description (with timestamps), and 20 Tags.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          storyboard: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                imagePrompt: { type: Type.STRING },
                script: { type: Type.STRING }
              },
              required: ["imagePrompt", "script"]
            }
          },
          youtubeMetadata: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "description", "tags"]
          }
        },
        required: ["storyboard", "youtubeMetadata"]
      }
    }
  });

  const { storyboard, youtubeMetadata } = JSON.parse(planResponse.text);
  const slideshowImages: string[] = [];
  let fullScript = "";
  let thumbnailUrl = "";

  for (let i = 0; i < storyboard.length; i++) {
    const step = storyboard[i];
    const promptPrefix = i === 0 
      ? `Ultra-HD YouTube thumbnail, DSLR quality. ${isPriceBD ? 'Include visual price tags and BDT symbols.' : ''} Subject:` 
      : `High-fidelity professional cinematography, sharp focus. Context:`;
    
    const imgResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: `${promptPrefix} ${step.imagePrompt}` }],
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    const part = imgResponse.candidates[0].content.parts.find((p: any) => p.inlineData);
    if (part) {
      const b64 = `data:image/png;base64,${part.inlineData.data}`;
      if (i === 0) {
        thumbnailUrl = b64;
      } else {
        slideshowImages.push(b64);
        fullScript += step.script + " ... [pause] ... ";
      }
    }
  }

  const speechResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Speak at a steady, professional informative pace: ${fullScript}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: params.voiceName || 'Zephyr' } },
      },
    },
  });

  const base64Audio = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  let audioUrl: string | undefined;
  if (base64Audio) {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
    const wavBlob = await audioBufferToWav(audioBuffer);
    audioUrl = URL.createObjectURL(wavBlob);
  }

  return {
    slideshowImages,
    thumbnailUrl,
    audioUrl,
    tutorialType: TutorialType.BASIC_SLIDESHOW,
    fullScript,
    youtubeMetadata,
    sources: groundingSources
  };
}

async function generateProVideo(ai: any, params: GenerateVideoParams): Promise<VideoGenerationResult> {
  const currentFullDate = new Date().toLocaleDateString('en-US');
  let refinedPrompt = params.prompt;
  let ttsText = params.prompt;
  let youtubeMetadata: any;
  let groundingSources: GroundingSource[] = [];

  const researchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `High-End Studio Production Research for: "${params.prompt}" (${params.category}). 
               TODAY: ${currentFullDate}.
               Gather latest information and then output:
               PROMPT: [Ultra detailed cinematic scene prompt for Veo] 
               SCRIPT: [Exhaustive narration script] 
               YOUTUBE_TITLE: [Title]
               YOUTUBE_DESC: [Description]
               YOUTUBE_TAGS: [Tags]`,
    config: { tools: [{googleSearch: {}}] },
  });

  const text = researchResponse.text || '';
  
  // Extract chunks
  const chunks = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    groundingSources = chunks
      .filter((c: any) => c.web)
      .map((c: any) => ({
        title: c.web.title || 'Source',
        uri: c.web.uri
      }));
  }

  const promptMatch = text.match(/PROMPT:\s*([\s\S]*?)(?=SCRIPT:|$)/i);
  const scriptMatch = text.match(/SCRIPT:\s*([\s\S]*?)(?=YOUTUBE_|$)/i);
  const yTitle = text.match(/YOUTUBE_TITLE:\s*(.*)/i)?.[1];
  const yDesc = text.match(/YOUTUBE_DESC:\s*([\s\S]*?)(?=YOUTUBE_TAGS|$)/i)?.[1];
  const yTags = text.match(/YOUTUBE_TAGS:\s*(.*)/i)?.[1]?.split(',').map(t => t.trim());

  if (promptMatch) refinedPrompt = promptMatch[1].trim();
  if (scriptMatch) ttsText = scriptMatch[1].trim();
  if (yTitle && yDesc && yTags) {
    youtubeMetadata = { title: yTitle.trim(), description: yDesc.trim(), tags: yTags };
  }

  const generateVideoPayload: any = {
    model: params.model,
    config: { numberOfVideos: 1, resolution: params.resolution, aspectRatio: params.aspectRatio },
    prompt: refinedPrompt,
  };

  let operation = await ai.models.generateVideos(generateVideoPayload);
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoObject = operation.response?.generatedVideos?.[0]?.video;
  if (!videoObject?.uri) throw new Error('Generation timeout or failure.');
  const videoRes = await fetch(`${videoObject.uri}&key=${process.env.API_KEY}`);
  const videoBlob = await videoRes.blob();
  const objectUrl = URL.createObjectURL(videoBlob);

  let audioUrl: string | undefined;
  if (params.hasVoiceover) {
    const speechResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak at a steady professional pace: ${ttsText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: params.voiceName || 'Zephyr' } } },
      },
    });
    const base64Audio = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
      const wavBlob = await audioBufferToWav(audioBuffer);
      audioUrl = URL.createObjectURL(wavBlob);
    }
  }

  return {
    objectUrl,
    blob: videoBlob,
    uri: videoObject.uri,
    video: videoObject,
    audioUrl,
    tutorialType: TutorialType.PRO_VIDEO,
    youtubeMetadata,
    sources: groundingSources
  };
}

async function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i, sample, offset = 0, pos = 0;
  function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: number) { view.setUint32(pos, pos, true); pos += 4; }
  setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan); setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan); setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);
  for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      view.setInt16(pos, sample, true); pos += 2;
    }
    offset++;
  }
  return new Blob([bufferArray], {type: 'audio/wav'});
}
