import { ImageResponse } from "next/og";

export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          fontWeight: 700,
          background: "#2563eb",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        پ
      </div>
    ),
    { width: 192, height: 192 }
  );
}
