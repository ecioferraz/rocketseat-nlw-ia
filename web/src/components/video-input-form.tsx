import { FileVideo, Upload } from 'lucide-react';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import getFFmpeg from '@/lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import api from '@/lib/axios';

type Status = 'converting' | 'generating' | 'success' | 'uploading' | 'waiting';

const statusMessages = {
  converting: 'Convertendo...',
  generating: 'Transcrevendo...',
  success: 'Sucesso!',
  uploading: 'Carregando...',
};

export default function VideoInputForm() {
  const [status, setStatus] = useState<Status>('waiting');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelected = ({
    currentTarget: { files },
  }: ChangeEvent<HTMLInputElement>) => files && setVideoFile(files.item(0));

  const convertVideoToAudio = async (video: File) => {
    console.log('Conversion started.');

    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile('input.mp4', await fetchFile(video));

    // ffmpeg.on('log', (log) => console.log(log)); /* if any error */

    ffmpeg.on('progress', ({ progress }) =>
      console.log(`Convert progress: ${Math.round(progress * 100)}%`),
    );

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3',
    ]);

    const data = await ffmpeg.readFile('output.mp3');

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' });
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg',
    });

    console.log('Conversion finished.');

    return audioFile;
  };

  const handleUploadVideo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) return;

    setStatus('converting');

    const audioFile = await convertVideoToAudio(videoFile);

    const data = new FormData();

    data.append('file', audioFile);

    setStatus('uploading');

    const {
      data: {
        video: { id },
      },
    } = await api.post('/videos', data);

    setStatus('generating');

    await api.post(`/videos/${id}/transcription`, { prompt });

    setStatus('success');
  };

  const previewURL = useMemo(
    () => (videoFile ? URL.createObjectURL(videoFile) : null),
    [videoFile],
  );

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        htmlFor="video"
        className="relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-primary/5"
      >
        {previewURL ? (
          <video
            src={previewURL}
            className="pointer-events-none absolute inset-0 aspect-video object-cover"
          />
        ) : (
          <>
            <FileVideo className="h-4 w-4" />
            Selecione um vídeo
          </>
        )}
      </label>
      <input
        type="file"
        id="video"
        accept="video/mp4"
        onFocus={() => setStatus('waiting')}
        onChange={handleFileSelected}
        className="sr-only"
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea
          disabled={status !== 'waiting'}
          id="transcription_prompt"
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)"
          ref={promptInputRef}
          className="h-20 resize-none leading-relaxed"
        />
      </div>

      <Button
        data-success={status === 'success'}
        disabled={status !== 'waiting'}
        type="submit"
        className="w-full data-[success=true]:bg-emerald-400"
      >
        {status === 'waiting' ? (
          <>
            Carregar vídeo
            <Upload className="ml-2 h-4 w-4" />
          </>
        ) : (
          statusMessages[status]
        )}
      </Button>
    </form>
  );
}
