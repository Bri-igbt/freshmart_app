import { Banknote } from "lucide-react";
import { formatMoney } from "../DashboardUtils";
import { orderItemCardStyles as s } from "@/app/assets/dummyStyles.js";
import Image from "next/image.js";

const OrderItemCard = ({ item }) => {
  const image = 
    typeof item.image === "string"
    ? item.image
    : item.image?.url || "https://via.placeholder.com/150?text=Product";

  return (
    <article className={s.card}>
      <Image
        src={image}
        className={s.image}
        alt="image"
        width={100}
        height={100}
      />

      <div className={s.content}>
        <h4 className={s.name}>{item.name}</h4>
        <h4 className={s.company}>{item.company}</h4>

        <div className={s.metaGrid}>
          <h4 className={s.sizeBadge}>{item.size}</h4>
          <h4 className={s.qtyBadge}>Qty: {item.quantity}</h4>
        </div>

        <div className={s.eachRow}>
          <h4 className={s.eachLabel}>Each</h4>
          <h4 className={s.eachValue}>{formatMoney(item.sellingPrice)}</h4>
        </div>

        <div className={s.totalRow}>
          <span className={s.totalLabel}>
            <Banknote className={s.totalIcon} />
          </span>
          <span className={s.totalValue}>
            {formatMoney(item.subtotal || item.sellingPrice * item.quantity)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default OrderItemCard;