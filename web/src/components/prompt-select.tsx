import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Prompts {
  id: string;
  template: string;
  title: string;
}

interface PromptSelectProps {
  onPromptSelected: (template: string) => void;
}

export default function PromptSelect({ onPromptSelected }: PromptSelectProps) {
  const [prompts, setPrompts] = useState<Prompts[]>([]);

  const handlePromptSelected = (promptId: string) => {
    const promptSelected = prompts.find(({ id }) => id === promptId);

    if (!promptSelected) return;

    onPromptSelected(promptSelected.template);
  };

  useEffect(() => {
    (async () => setPrompts((await api.get('/prompts')).data))();
  }, []);

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt..." />
      </SelectTrigger>
      <SelectContent>
        {prompts.map(({ id, title }) => (
          <SelectItem key={id} value={id}>
            {title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
