
export interface Order {
  orderId: number;
  orderName: string;
  orderDescription: string;
  amount: string;
}

export interface OrdersProps {
  currentOrder: Order;
}