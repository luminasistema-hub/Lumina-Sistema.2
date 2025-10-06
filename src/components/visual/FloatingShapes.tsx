"use client";

import React, { useEffect, useState } from "react";

type ShapeConfig = {
  id: string;
  className: string;
  speed: number;
};

const shapes: ShapeConfig[] = [
  {
    id: "s1",
    className:
      "absolute top-16 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400/40 to-purple-500/40 blur-2xl shadow-md",
    speed: 24,
  },
  {
    id: "s2",
    className:
      "absolute top-40 right-16 w-24 h-24 rounded-full bg-gradient-to-br from-blue-400/40 to-fuchsia-500/40 blur-xl shadow-md",
    speed: 32,
  },
  {
    id: "s3",
    className:
      "absolute bottom-24 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-violet-400/35 to-indigo-500/35 blur-2xl shadow-md",
    speed: 20,
  },
  {
    id: "s4",
    className:
      "absolute bottom-16 right-24 w-28 h-28 rounded-full bg-gradient-to-br from-indigo-300/35 to-sky-400/35 blur-xl shadow-md",
    speed: 18,
  },
  {
    id: "s5",
    className:
      "absolute top-1/2 left-1/3 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-purple-400/40 to-pink-500/40 blur-xl shadow-md",
    speed: 28,
  },
  {
    id: "s6",
    className:
      "absolute top-24 right-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-sky-400/35 to-violet-500/35 blur-lg shadow-md",
    speed: 36,
  },
];

const FloatingShapes = () => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx; // -1..1
      const dy = (e.clientY - cy) / cy; // -1..1
      setPointer({ x: dx, y: dy });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {shapes.map((s) => {
        const tx = pointer.x * s.speed;
        const ty = pointer.y * s.speed;
        return (
          <div
            key={s.id}
            className={`${s.className} transition-transform duration-300`}
            style={{
              transform: `translate3d(${tx}px, ${ty}px, 0)`,
            }}
          />
        );
      })}
    </div>
  );
};

export default FloatingShapes;