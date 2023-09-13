import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';

export default async function getAllPrompts(app: FastifyInstance) {
  app.get('/prompts', async () => prisma.prompt.findMany());
}
