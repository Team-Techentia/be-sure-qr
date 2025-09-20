import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ZodSchema } from "zod";

export function withValidation<T extends ZodSchema<any>>(schema: T,handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    schema.parse(req.body);
    return handler(req, res);
  };
}
