/* eslint-disable @next/next/no-img-element */
"use client";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HeroVideoDialog({
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  className
}) {
  // Static component with no video popup functionality
  return (
    (<div className={cn("relative", className)}>
      <div className="group relative">
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          width={1920}
          height={1080}
          className="w-full rounded-md border shadow-lg" />
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
          <div className="flex size-28 items-center justify-center rounded-full bg-primary/10 backdrop-blur-md">
            <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-b from-primary/30 to-primary shadow-md">
              <Play
                className="size-8 fill-white text-white"
                style={{
                  filter: "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
                }} />
            </div>
          </div>
        </div>
      </div>
    </div>)
  );
}
