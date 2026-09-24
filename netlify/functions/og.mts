import { GET } from "../../api/og.js";

export default async (request: Request) => GET(request);

export const config = {
  path: "/api/og",
  method: ["GET", "HEAD"],
};
