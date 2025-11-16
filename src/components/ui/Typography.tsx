import { JSX } from "react";

type Props = {
  as?: keyof JSX.IntrinsicElements;
  variant?: "h1" | "h2" | "h3" | "subtitle" | "body" | "small" | "label";
  className?: string;
  children: React.ReactNode;
};

export function Typography({
  as: Tag = "p",
  variant = "body",
  className = "",
  children,
}: Props) {
  const variants = {
    h1: "font-brand text-sumo-3xl font-semibold",
    h2: "font-brand text-sumo-2xl font-semibold",
    h3: "font-brand text-sumo-xl font-semibold",
    subtitle: "font-primary text-sumo-sm text-sumo-muted",
    body: "font-primary text-sumo-base",
    small: "font-primary text-sumo-xs text-sumo-muted",
    label: "font-primary text-sumo-sm font-medium",
  };

  return <Tag className={`${variants[variant]} ${className}`}>{children}</Tag>;
}
