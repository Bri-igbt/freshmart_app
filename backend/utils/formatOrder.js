const getImage = (image) =>
  typeof image === "string" ? image : image?.url || "";

export const formatOrderItem = (item) => {
  const live = item.product ?? {};
  const sellingPrice = item.sellingPrice ?? live.sellingPrice ?? 0;

  return {
    productId: item.product?._id ?? item.product ?? null,
    image: getImage(item.image || live.image),
    public_id: live.image?.public_id || "",
    name: item.name || live.name || "",
    company: item.company || live.company || "",
    category: item.category || live.category || "",
    size: item.size || live.size || "",
    sellingPrice,
    oldPrice: item.oldPrice ?? live.oldPrice ?? 0,
    quantity: item.quantity,
    subtotal: sellingPrice * item.quantity,
  };
};
