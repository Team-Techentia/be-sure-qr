import type { NextApiRequest, NextApiResponse } from "next";
import { qrUtils, AppError } from "@/lib/utils";
import { withErrorHandler, withValidation } from "@/lib/middleware";
import { qrSchema } from "@/lib/schema";
import { ApiResponse } from "@/lib/types";

const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    switch (req.method) {
        case "POST": {
            const result = await qrUtils.create(req.body);
            return res.status(200).json(result);
        }
        case "GET": {
            const result = await qrUtils.list();
            return res.status(200).json(result);
        }
        default:
            throw new AppError(`Method ${req.method} Not Allowed`, 405);
    }
};

export default withErrorHandler((req, res) => {
    return req.method === "POST" ? withValidation(qrSchema.qrCreateSchema, handler)(req, res) : handler(req, res);
});