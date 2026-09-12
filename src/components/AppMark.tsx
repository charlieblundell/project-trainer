/**
 * The app's icon: a white barbell on systemBlue. Built from
 * plain boxes rather than text, because generated icons don't reliably have
 * the brand fonts — and a shape reads at 32px where lettering wouldn't.
 *
 * Only inline styles and flex layout, since this is rendered by ImageResponse.
 */
const BLUE = "#007aff";
const WHITE = "#ffffff";

/** Width of the whole barbell in design units; everything scales from it. */
const DESIGN_WIDTH = 400;

export function AppMark({ size, inset = 0.1 }: { size: number; inset?: number }) {
  const unit = (size * (1 - inset * 2)) / DESIGN_WIDTH;
  const px = (n: number) => Math.max(1, Math.round(n * unit));

  const plate = (width: number, height: number) => (
    <div style={{ width: px(width), height: px(height), background: WHITE, borderRadius: px(10) }} />
  );

  return (
    <div
      style={{
        width: size,
        height: size,
        background: BLUE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: px(6) }}>
        {plate(30, 140)}
        {plate(44, 200)}
        <div style={{ width: px(220), height: px(22), background: WHITE, borderRadius: px(4) }} />
        {plate(44, 200)}
        {plate(30, 140)}
      </div>
    </div>
  );
}
