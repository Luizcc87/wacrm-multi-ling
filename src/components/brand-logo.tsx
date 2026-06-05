import type { SVGProps } from "react";

type BrandLogoProps = SVGProps<SVGSVGElement>;

export function BrandLogo(props: BrandLogoProps) {
  return (
    <img
      src="/brand/logo.svg"
      alt=""
      aria-hidden="true"
      className={props.className}
      style={props.style}
      width={props.width}
      height={props.height}
      loading="eager"
      decoding="async"
    />
  );
}
