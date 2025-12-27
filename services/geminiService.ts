
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
import {GenerateVideoParams, GroundingSource, TutorialType, VideoGenerationResult} from '../types';

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
  console.log('Generating Professional Basic Slideshow...');

  // 1. Generate Storyboard including a Thumbnail
  const planResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a professional 7-part video tutorial storyboard for: "${params.prompt}". 
               The video must be comprehensive and follow this exact sequence:
               1. THUMBNAIL: A single high-impact prompt for a video thumbnail.
               2. INTRODUCTION: Define context, brand (e.g. Google/YouTube ecosystem), and value proposition.
               3-5. PROCESS: 3 detailed, logical steps for the tutorial.
               6. SUMMARY: Recapping what we learned.
               7. OUTRO: Warm closing words, wishing the user better luck, success in their project, and an inspiring sign-off.
               
               For each step (1-7), provide:
               1. A descriptive image generation prompt (visualizing UI or concepts).
               2. A thorough script for the narrator (2-4 sentences for slides 2-7).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            imagePrompt: { type: Type.STRING },
            script: { type: Type.STRING }
          },
          required: ["imagePrompt", "script"]
        }
      }
    }
  });

  const storyboard = JSON.parse(planResponse.text);
  const slideshowImages: string[] = [];
  let fullScript = "";
  let thumbnailUrl = "";

  // 2. Generate Images
  for (let i = 0; i < storyboard.length; i++) {
    const step = storyboard[i];
    console.log(`Generating image for slide ${i + 1}: ${step.imagePrompt}`);
    const imgResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: `High-quality 4K digital art, clean UI, vibrant: ${step.imagePrompt}` }],
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    const part = imgResponse.candidates[0].content.parts.find((p: any) => p.inlineData);
    if (part) {
      const b64 = `data:image/png;base64,${part.inlineData.data}`;
      if (i === 0) {
        thumbnailUrl = b64; // First prompt is specifically for the thumbnail
      } else {
        slideshowImages.push(b64);
        fullScript += step.script + " ... ";
      }
    }
  }

  // 3. Generate Narrator Audio
  let audioUrl: string | undefined;
  const speechResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: fullScript }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: params.voiceName || 'Zephyr' } },
      },
    },
  });

  const base64Audio = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
    fullScript
  };
}

async function generateProVideo(ai: any, params: GenerateVideoParams): Promise<VideoGenerationResult> {
  let refinedPrompt = params.prompt;
  let groundingSources: GroundingSource[] = [];
  let ttsText = params.prompt;

  if (params.isSmartTutorial) {
    const researchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Detailed tutorial for: "${params.prompt}". Intro context, steps, and warm outro. Output: PROMPT: [descriptive prompt] SCRIPT: [voiceover]`,
      config: { tools: [{googleSearch: {}}] },
    });
    const text = researchResponse.text || '';
    const promptMatch = text.match(/PROMPT:\s*([\s\S]*?)(?=SCRIPT:|$)/i);
    const scriptMatch = text.match(/SCRIPT:\s*([\s\S]*?)$/i);
    if (promptMatch) refinedPrompt = promptMatch[1].trim();
    if (scriptMatch) ttsText = scriptMatch[1].trim();
    const chunks = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      groundingSources = chunks.filter((c: any) => c.web).map((c: any) => ({
        title: c.web.title || 'Source',
        uri: c.web.uri,
      }));
    }
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
  if (!videoObject?.uri) throw new Error('Failed to generate video.');
  const videoRes = await fetch(`${videoObject.uri}&key=${process.env.API_KEY}`);
  const videoBlob = await videoRes.blob();
  const objectUrl = URL.createObjectURL(videoBlob);

  let audioUrl: string | undefined;
  if (params.hasVoiceover) {
    const speechResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsText }] }],
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
    sources: groundingSources,
    tutorialType: TutorialType.PRO_VIDEO
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
  function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
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
