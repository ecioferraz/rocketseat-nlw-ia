import { FastifyInstance } from 'fastify';
import { OpenAIStream, streamToResponse } from 'ai';
import { z } from 'zod';
import openai from '../lib/openai';
import prisma from '../lib/prisma';

export default async function generateAICompletion(app: FastifyInstance) {
  app.post('/ai/complete', async (req, res) => {
    const bodySchema = z.object({
      temperature: z.number().min(0).max(1).default(0.5),
      template: z.string(),
      videoId: z.string().uuid(),
    });

    const { temperature, template, videoId } = bodySchema.parse(req.body);

    const { transcription } = await prisma.video.findUniqueOrThrow({
      where: { id: videoId },
    });

    if (!transcription) {
      return res
        .status(400)
        .send({ error: 'Video transcription was not generated yet.' });
    }

    const content = template.replace('{transcription}', transcription);

    const response = await openai.chat.completions.create({
      messages: [{ content, role: 'user' }],
      model: 'gpt-3.5-turbo-16k',
      stream: true,
      temperature,
    });

    const stream = OpenAIStream(response);

    streamToResponse(stream, res.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    });
  });
}
