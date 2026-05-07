import type { Product } from "./types";

export function hasProductImage(product: Pick<Product, "image">) {
  const image = product.image.trim();
  return image.length > 0 && image !== "/placeholder.svg";
}
