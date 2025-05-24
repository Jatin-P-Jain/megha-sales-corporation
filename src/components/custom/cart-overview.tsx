import React from "react";
import CartButton from "./cart-button";

function CartOverview({ isUser }: { isUser: boolean }) {
  return isUser ? (
    <div className="grid grid-cols-[4fr_1fr] items-center justify-center rounded-lg border-1 p-2 pl-2 text-sm">
      <div className="flex flex-col pr-4">
        <div className="text-muted-foreground text-xs">Total Cart</div>
        <div className="flex w-full justify-start gap-4">
          <div>
            Items: <span className="text-primary font-semibold">17</span>
          </div>
          <div>
            Amount:{" "}
            <span className="text-primary font-semibold">₹1,50,000</span>
          </div>
        </div>
      </div>
      <CartButton />
    </div>
  ) : null;
}

export default CartOverview;
