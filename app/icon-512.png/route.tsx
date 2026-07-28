import { ImageResponse } from "next/og";

export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 320,
          fontWeight: 700,
          background: "linear-gradient(135deg, #006f38 0%, #ff723a 100%)",
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
    { width: 512, height: 512 }
  );
}
