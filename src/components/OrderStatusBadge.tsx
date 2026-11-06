import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${ORDER_STATUS_STYLE[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}
