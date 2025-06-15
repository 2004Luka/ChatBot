import { marked } from 'marked';

const markdownCache = new Map<string, string>();

export function markdownToPlainText(markdown: string): string {
  if (markdownCache.has(markdown)) {
    return markdownCache.get(markdown)!;
  }

  const html = marked.parse(markdown, { async: false });
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const result = tempDiv.textContent || tempDiv.innerText || '';
  
  markdownCache.set(markdown, result);
  return result;
}

const codingKeywords = new Set([
  'code', 'function', 'class', 'variable', 'loop', 'array', 'object',
  'method', 'api', 'database', 'server', 'client', 'frontend', 'backend',
  'algorithm', 'debug', 'error', 'exception', 'compile', 'runtime',
  'javascript', 'python', 'java', 'typescript', 'react', 'node',
  'write', 'create', 'implement', 'develop', 'program', 'script',
  'def', 'import', 'print', 'return', 'if', 'else', 'for', 'while'
]);

const researchKeywords = new Set([
  'research', 'study', 'analysis', 'investigate', 'explore', 'examine',
  'compare', 'contrast', 'evaluate', 'assess', 'review', 'literature',
  'methodology', 'findings', 'conclusion', 'hypothesis', 'theory',
  'data', 'statistics', 'survey', 'experiment', 'observation'
]);

export const detectTaskType = (message: string): 'coding' | 'research' | 'general' => {
  const words = message.toLowerCase().split(/\s+/);
  let codingScore = 0;
  let researchScore = 0;

  if (message.toLowerCase().includes('write code') || 
      message.toLowerCase().includes('create code') ||
      message.toLowerCase().includes('implement') ||
      message.toLowerCase().includes('program')) {
    return 'coding';
  }

  for (const word of words) {
    if (codingKeywords.has(word)) codingScore++;
    if (researchKeywords.has(word)) researchScore++;
  }

  if (codingScore > researchScore) return 'coding';
  if (researchScore > codingScore) return 'research';
  return 'general';
};

export const getModelForTask = (taskType: 'coding' | 'research' | 'general'): string => {
  switch (taskType) {
    case 'coding':
      return "deepseek/deepseek-r1-0528:free";
    case 'research':
      return "meta-llama/llama-4-maverick:free";
    default:
      return "mistralai/mistral-7b-instruct:free";
  }
};

const modelDisplayNames = new Map([
  ["deepseek/deepseek-r1-0528:free", "Deepseek"],
  ["meta-llama/llama-4-maverick:free", "Llama 4 Maverick"],
  ["mistralai/mistral-7b-instruct:free", "Mistral"]
]);

export const getModelDisplayName = (modelId: string): string => {
  return modelDisplayNames.get(modelId) || modelId;
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<any> => {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      if (retries >= maxRetries || error.status !== 429) {
        throw error;
      }
      
      retries++;
      await sleep(delay);
      delay *= 2; 
    }
  }
}; 