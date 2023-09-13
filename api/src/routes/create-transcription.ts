import { FastifyInstance } from 'fastify';
import { createReadStream } from 'fs';
import { z } from 'zod';
import openai from '../lib/openai';
import prisma from '../lib/prisma';

export default async function createTranscription(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (req) => {
    const paramsSchema = z.object({ videoId: z.string().uuid() });

    const { videoId } = paramsSchema.parse(req.params);

    const bodySchema = z.object({ prompt: z.string() });

    const { prompt } = bodySchema.parse(req.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: { id: videoId },
    });

    const videoPath = video.path;

    const file = createReadStream(videoPath);

    const { text: transcription } = await openai.audio.transcriptions.create({
      file,
      language: 'pt',
      model: 'whisper-1',
      prompt,
      response_format: 'json',
      temperature: 0,
    });

    await prisma.video.update({
      where: { id: videoId },
      data: { transcription },
    });

    return { transcription };
  });
}
