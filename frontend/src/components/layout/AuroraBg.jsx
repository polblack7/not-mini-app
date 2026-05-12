import React from "react";

const PALETTES = {
  idle: ["#6552FE", "#9D50FF", "#3C288C", "#48D49E", "#5848d6"],
  active: ["#6552FE", "#48D49E", "#9D50FF", "#326CF9", "#48D49E"],
  error: ["#FF8266", "#F2AF1A", "#6552FE", "#FF5A5A", "#9D50FF"],
};

const BLOBS = [
  { left: "-22%", top: "-10%", size: 460, anim: "mesh-a", dur: 22 },
  { right: "-25%", top: "15%", size: 420, anim: "mesh-b", dur: 28 },
  { left: "-10%", bottom: "-20%", size: 520, anim: "mesh-c", dur: 34 },
  { right: "-15%", bottom: "-5%", size: 380, anim: "mesh-d", dur: 26 },
  { left: "25%", top: "30%", size: 320, anim: "mesh-e", dur: 30 },
];

export const AuroraBg = ({ variant = "app", active = false, error = false }) => {
  const palette = error ? PALETTES.error : active ? PALETTES.active : PALETTES.idle;
  const speed = active ? 0.55 : 1;
  const intensity = variant === "splash" ? 1 : active ? 1 : 0.8;
  const rotDur = active ? 40 : 80;

  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__tint" />
      {BLOBS.map((b, i) => {
        const color = palette[i];
        const pos = {};
        if (b.left !== undefined) pos.left = b.left;
        if (b.right !== undefined) pos.right = b.right;
        if (b.top !== undefined) pos.top = b.top;
        if (b.bottom !== undefined) pos.bottom = b.bottom;
        return (
          <div
            key={i}
            className="aurora__blob"
            style={{
              ...pos,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 50% 50%, ${color} 0%, ${color}00 65%)`,
              opacity: 0.55 * intensity,
              animation: `${b.anim} ${(b.dur * speed).toFixed(1)}s ease-in-out infinite`,
            }}
          />
        );
      })}

      {active && !error && <div className="aurora__halo" />}

      <div
        className="aurora__hue"
        style={{ animation: `mesh-rot ${rotDur}s linear infinite` }}
      />

      <div className="aurora__grain" />
    </div>
  );
};
