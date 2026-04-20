import { z } from "zod";

export const CreateAdSchema = z.object({
  title: z.string().min(5, "Título deve ter ao menos 5 caracteres").max(100),
  category: z.enum(["Novilhas", "Bezerras", "Bezerros", "Garrotes", "Vacas gordas", "Vacas magras", "Touros"]),
  breed: z.string().min(2, "Raça obrigatória"),
  quantity: z.number().min(1, "Quantidade deve ser no mínimo 1").max(10000),
  weight: z.number().min(50, "Peso deve ser no mínimo 50 kg").max(2000),
  pricePerHead: z.number().min(100, "Preço deve ser no mínimo R$ 100"),
  pricePerArroba: z.number().optional(),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "Estado deve ser sigla"),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido"),
  description: z.string().min(10, "Descrição deve ter ao menos 10 caracteres").max(2000),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type CreateAdInput = z.infer<typeof CreateAdSchema>;

export function validateCreateAd(data: any) {
  try {
    return { valid: true, data: CreateAdSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error.errors.map(e => ({ field: e.path.join("."), message: e.message })) };
    }
    return { valid: false, errors: [{ field: "unknown", message: "Erro na validação" }] };
  }
}
