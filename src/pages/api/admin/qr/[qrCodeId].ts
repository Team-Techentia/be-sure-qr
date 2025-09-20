import type { NextApiRequest, NextApiResponse } from "next";
import { qrUtils,AppError } from "@/lib/utils";
import { withErrorHandler, withValidation } from "@/lib/middleware";
import { qrSchema } from "@/lib/schema";
import { ApiResponse } from "@/lib/types";

const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    const { qrCodeId } = req.query as { qrCodeId: string };

    switch (req.method) {
        case "GET": {
            const result = await qrUtils.get(qrCodeId);
            return res.status(200).json(result);
        }
        case "PUT": {
            const result = await qrUtils.update(qrCodeId, req.body);
            return res.status(200).json(result);
        }
        case "DELETE": {
            const result = await qrUtils.softDelete(qrCodeId);
            return res.status(200).json(result);
        }
        default:
            throw new AppError(`Method ${req.method} Not Allowed`, 405);
    }
};

export default withErrorHandler((req, res) => {
    return req.method === "PUT" ? withValidation(qrSchema.qrUpdateSchema, handler)(req, res) : handler(req, res);
});
