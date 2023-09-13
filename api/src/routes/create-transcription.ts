import { FastifyInstance } from 'fastify';
import { createReadStream } from 'fs';
import { z } from 'zod';
import prisma from '../lib/prisma';

export default async function createTranscription(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (req, res) => {
    const paramsSchema = z.object({ videoId: z.string().uuid() });

    const { videoId } = paramsSchema.parse(req.params);

    const bodySchema = z.object({
      prompt: z.string(),
    });

    const { prompt } = bodySchema.parse(req.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: { id: videoId },
    });

    const videoPath = video.path;

    const audioReadStream = createReadStream(videoPath);

    return {
      prompt,
      videoId,
      videoPath,
    };
  });
}
