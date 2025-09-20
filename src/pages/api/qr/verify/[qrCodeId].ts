import type { NextApiRequest, NextApiResponse } from "next";
import { qrUtils, AppError } from "@/lib/utils";
import { withErrorHandler } from "@/lib/middleware";
import { ApiResponse } from "@/lib/types";

const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    const { qrCodeId } = req.query as { qrCodeId: string };

    switch (req.method) {
        case "GET": {
            const result = await qrUtils.verify(qrCodeId);
            return res.status(200).json(result);
        }
        default:
            throw new AppError(`Method ${req.method} Not Allowed`, 405);
    }
};

export default withErrorHandler(handler);