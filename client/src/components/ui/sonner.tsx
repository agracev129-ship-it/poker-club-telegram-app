"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#1a1a1a",
          "--normal-text": "#ffffff",
          "--normal-border": "#2d2d2d",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };






