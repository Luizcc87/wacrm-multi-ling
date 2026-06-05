import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Replaces the default Next.js favicon with the system mark. Next.js
// renders this at build time and auto-injects <link rel="icon"> into <head>.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const svg = readFileSync(join(process.cwd(), "public", "brand", "logo.svg"), "utf8");
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#081c3b",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <img src={dataUrl} alt="" width={32} height={32} />
      </div>
    ),
    { ...size },
  );
}
