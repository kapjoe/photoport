import Image from "next/image";
import { isProxyPhotoPath } from "@/lib/photoPaths";

export default function PortfolioImage({ src, ...props }) {
  return <Image src={src} unoptimized={isProxyPhotoPath(src)} {...props} />;
}
