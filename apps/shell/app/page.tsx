import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Welcome to E-Commerce Platform</h1>
      <nav>
        <ul>
          <li>
            <Link href="/products">Products</Link>
          </li>
          <li>
            <Link href="/orders">Orders</Link>
          </li>
          <li>
            <Link href="/account">Account</Link>
          </li>
          <li>
            <Link href="/checkout">Checkout</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
