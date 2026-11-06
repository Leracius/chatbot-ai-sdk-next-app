export interface AIModel {
  id: string;
  name: string;
  description: string;
  badge?: string;
}
// Verified 2026-11-05: https://firebase.google.com/docs/ai-logic/models?api=dev
// Account availability still requires the provider's models.list preflight.
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    description: "Asistente comercial",
    badge: "Recomendado",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    description: "Consultas de bajo costo",
  },
];
export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;
export function getModelById(id: string) {
  return AVAILABLE_MODELS.find((m) => m.id === id) || AVAILABLE_MODELS[0];
}
export function isValidModelId(id: string) {
  return AVAILABLE_MODELS.some((m) => m.id === id);
}
