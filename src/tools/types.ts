import { z } from "zod";

export interface Tool<TInput, TOutput> {
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  execute(input: TInput): Promise<TOutput>;
}
