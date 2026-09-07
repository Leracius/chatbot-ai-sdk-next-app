export interface AIModel {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    description: "Última generación. Ultra rápido, eficiente e inteligente",
    badge: "Recomendado",
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    description: "Modelo híbrido con capacidades avanzadas de razonamiento",
    badge: "Razonamiento",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    description: "Versión de alta estabilidad para chat continuo",
    badge: "Estable",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro (Preview)",
    description: "Máxima capacidad analítica (requiere cuota Pro habilitada)",
    badge: "Pro",
  },
];

export const DEFAULT_MODEL_ID = "gemini-3.8-flash";

export function getModelById(id: string): AIModel {
  return (
    AVAILABLE_MODELS.find((model) => model.id === id) || AVAILABLE_MODELS[0]
  );
}

export function isValidModelId(id: string): boolean {
  return AVAILABLE_MODELS.some((model) => model.id === id);
}
