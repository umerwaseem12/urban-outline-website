import { useMemo, useState } from "react";
import "./OrderConfirmation.css";

const money = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

function getSavedOrder() {
  try {
    return JSON.parse(
      window.sessionStorage.getItem("urbanOutlineLastOrder") || "{}"
    );
  } catch {
    return {};
  }
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m5 12 4.5 4.5L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="18" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function OrderConfirmation({
  order: orderProp,
  onContinueShopping,
}) {
  const [copied, setCopied] = useState(false);

  const order = useMemo(
    () =>
      orderProp && Object.keys(orderProp).length
        ? orderProp
        : getSavedOrder(),
    [orderProp]
  );

  const customer =
    order.customer || order.customerDetails || order.shippingAddress || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const orderId = order.orderId || order._id || order.id || "";

  const customerName =
    customer.fullName || customer.name || order.fullName || "";
  const firstName = customerName.trim().split(/\s+/)[0] || "";

  const calculatedSubtotal = items.reduce((sum, item) => {
    const price = Number(item.price ?? item.unitPrice ?? 0);
    const quantity = Number(item.quantity) || 1;
    return sum + price * quantity;
  }, 0);

  const subtotal = Number(order.subtotal ?? calculatedSubtotal);
  const shippingFee = Number(order.shippingFee ?? 0);
  const total = Number(order.total ?? subtotal + shippingFee);

  const methodKey = String(
    order.paymentMethod || order.payment?.method || "cod"
  )
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  const paymentNames = {
    cod: "Cash on Delivery",
    easypaisa: "EasyPaisa",
    jazzcash: "JazzCash",
    nayapay: "NayaPay",
  };

  const paymentName = paymentNames[methodKey] || "Cash on Delivery";
  const paymentStatus =
    methodKey === "cod"
      ? "Due on delivery"
      : String(order.paymentStatus || "").toLowerCase() === "paid"
        ? "Paid"
        : "Pending";

  const addressParts = [
    customer.address || customer.streetAddress || order.address,
    customer.city || order.city,
    customer.province || order.province,
    customer.postalCode || order.postalCode,
  ].filter(Boolean);

  const address = addressParts.join(", ");
  const phone = customer.phone || order.phone || "";
  const email = customer.email || order.email || "";
  const deliveryEstimate =
    order.deliveryEstimate || order.estimatedDelivery || "4–5 days";

  const hasOrder = Boolean(
    orderId || items.length || order.total !== undefined
  );

  const copyOrderId = async () => {
    if (!orderId) return;

    try {
      await navigator.clipboard.writeText(String(orderId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="uo-confirm">
      <header className="uo-confirm__header">
        <a className="uo-confirm__brand" href="/" aria-label="Urban Outline home">
          <img src="/urban.jpg" alt="" />
          <span>
            <strong>URBAN OUTLINE</strong>
            <small>EVERYDAY STYLE</small>
          </span>
        </a>

        <span className="uo-confirm__headerNote">Pakistan-wide delivery</span>
      </header>

      <main className="uo-confirm__main">
        <section className="uo-confirm__hero">
          <div className="uo-confirm__successIcon">
            <CheckIcon />
          </div>

          <p className="uo-confirm__eyebrow">
            {hasOrder ? "ORDER RECEIVED" : "ORDER CONFIRMATION"}
          </p>

          <h1>
            {hasOrder
              ? firstName
                ? `Thank you, ${firstName}!`
                : "Thank you for your order!"
              : "Your order details"}
          </h1>

          <p className="uo-confirm__intro">
            {hasOrder
              ? "We’ve received your order and it’s now being prepared."
              : "Your order details will appear here after checkout."}
          </p>

          {hasOrder && (
            <>
                           <div className="uo-confirm__delivery">
                <span className="uo-confirm__truckIcon">
                  <TruckIcon />
                </span>
                <span>
                  <small>DELIVERY</small>
                  <strong>Our team will contact you to confirm delivery details.</strong>
                </span>
              </div>

              <div className="uo-confirm__timeline">
                <div className="uo-confirm__step uo-confirm__step--done">
                  <span><CheckIcon /></span>
                  <small>Order received</small>
                </div>
                <div className="uo-confirm__rail uo-confirm__rail--done" />
                <div className="uo-confirm__step uo-confirm__step--active">
                  <span>2</span>
                  <small>Preparing</small>
                </div>
                <div className="uo-confirm__rail" />
                <div className="uo-confirm__step">
                  <span>3</span>
                  <small>Dispatched</small>
                </div>
              </div>
            </>
          )}
        </section>

        {!hasOrder ? (
          <div className="uo-confirm__notice">
            This page is ready. Order details will show after we connect it to
            your checkout.
          </div>
        ) : (
          <div className="uo-confirm__layout">
            <section className="uo-confirm__card">
              <div className="uo-confirm__cardHeading">
                <div>
                  <p className="uo-confirm__eyebrow">YOUR PURCHASE</p>
                  <h2>Order details</h2>
                </div>

                {orderId && (
                  <div className="uo-confirm__orderRef">
                    <span>ORDER #{String(orderId).slice(-8).toUpperCase()}</span>
                    <button type="button" onClick={copyOrderId}>
                      {copied ? "Copied" : "Copy ID"}
                    </button>
                  </div>
                )}
              </div>

              <div className="uo-confirm__items">
                {items.length ? (
                  items.map((item, index) => {
                    const name =
                      item.productName || item.name || item.title || "Product";
                    const image =
                      item.image || item.imageUrl || item.productImage || "";
                    const quantity = Number(item.quantity) || 1;
                    const price = Number(item.price ?? item.unitPrice ?? 0);

                    return (
                      <div
                        className="uo-confirm__item"
                        key={item.productId || item._id || item.id || index}
                      >
                        <div className="uo-confirm__itemImage">
                          {image ? (
                            <img
                              src={image}
                              alt={name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span>UO</span>
                          )}
                        </div>

                        <div className="uo-confirm__itemInfo">
                          <strong>{name}</strong>
                          <span>Qty: {quantity}</span>
                        </div>

                        <strong className="uo-confirm__itemPrice">
                          {money(price * quantity)}
                        </strong>
                      </div>
                    );
                  })
                ) : (
                  <p className="uo-confirm__muted">Order items will appear here.</p>
                )}
              </div>

              <div className="uo-confirm__customer">
                <h3>Delivery details</h3>
                {customerName && <p>{customerName}</p>}
                {address && <p>{address}</p>}
                {phone && <p>{phone}</p>}
                {email && <p>{email}</p>}
                {!address && !phone && !email && (
                  <p className="uo-confirm__muted">
                    Your delivery details will appear here.
                  </p>
                )}
              </div>
            </section>

            <aside className="uo-confirm__side">
              <section className="uo-confirm__card">
                <div className="uo-confirm__cardHeading">
                  <div>
                    <p className="uo-confirm__eyebrow">PAYMENT</p>
                    <h2>{paymentName}</h2>
                  </div>
                </div>
                <p className="uo-confirm__paymentStatus">{paymentStatus}</p>
              </section>

              <section className="uo-confirm__card">
                <p className="uo-confirm__eyebrow">TOTAL</p>
                <h2 className="uo-confirm__summaryTitle">Order summary</h2>

                <div className="uo-confirm__summaryRow">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="uo-confirm__summaryRow">
                  <span>Delivery</span>
                  <span>{shippingFee ? money(shippingFee) : "Free"}</span>
                </div>
                <div className="uo-confirm__summaryRow">
                  <span>Estimated arrival</span>
                  <span>{deliveryEstimate}</span>
                </div>
                <div className="uo-confirm__summaryTotal">
                  <span>Total</span>
                  <strong>{money(total)}</strong>
                </div>
              </section>
            </aside>
          </div>
        )}

        <button
  type="button"
  className="uo-confirm__continue"
  onClick={onContinueShopping}
>
  Continue shopping <span aria-hidden="true">→</span>
</button>

        <p className="uo-confirm__footer">
          Thank you for choosing Urban Outline.
        </p>
      </main>
    </div>
  );
}