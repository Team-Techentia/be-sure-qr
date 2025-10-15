import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const headers = ["qrCodeId", "url"];
  const example = ["QR123", "https://example.com"];

  res.status(200).json({
    success: true,
    data: {
      headers,
      example: { qrCodeId: example[0], url: example[1] },
    },
  });
}
