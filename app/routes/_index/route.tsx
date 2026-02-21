import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Discount Impact</h1>
        <p className={styles.text}>
          Analyze how your discounts affect revenue, margins, and customer
          behavior. Make data-driven decisions about your promotions.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Discount Analytics</strong>. See which discounts drive the
            most revenue and which ones hurt your margins.
          </li>
          <li>
            <strong>Revenue Impact</strong>. Track how each promotion affects
            your overall sales and average order value.
          </li>
          <li>
            <strong>Actionable Insights</strong>. Get recommendations to
            optimize your discount strategy and maximize profitability.
          </li>
        </ul>
      </div>
    </div>
  );
}
