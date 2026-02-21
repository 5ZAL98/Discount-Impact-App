import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { calculateDiscountImpact } from "../utils/calculateDiscountImpact";

interface Product {
  productId: string;
  title: string;
  variantId: string;
  price: number;
  cost: number;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        products(first: 20) {
          nodes {
            id
            title
            variants(first: 1) {
              nodes {
                id
                price
                inventoryItem {
                  unitCost {
                    amount
                  }
                }
              }
            }
          }
        }
      }`,
  );

  const responseJson = await response.json();
  const products: Product[] = (
    responseJson.data?.products?.nodes ?? []
  ).map((product: any) => {
    const variant = product.variants?.nodes?.[0];
    return {
      productId: product.id,
      title: product.title,
      variantId: variant?.id ?? "",
      price: parseFloat(variant?.price ?? "0"),
      cost: parseFloat(variant?.inventoryItem?.unitCost?.amount ?? "0"),
    };
  });

  return { products };
};

export default function DiscountSimulator() {
  const { products } = useLoaderData<typeof loader>();
  const [discountPercent, setDiscountPercent] = useState(0);

  return (
    <s-page heading="Discount Impact Simulator">
      <s-section>
        <s-box padding="base">
          <label>
            <s-text fontWeight="semibold">Discount %</s-text>
            <input
              type="number"
              value={discountPercent}
              min={0}
              max={100}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setDiscountPercent(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
              }}
              style={{ width: "80px", marginLeft: "8px", padding: "4px 8px", fontSize: "14px" }}
            />
          </label>
        </s-box>
      </s-section>

      <s-section>
        {products.length === 0 ? (
          <s-box padding="loose">
            <s-stack direction="block" gap="base" align="center">
              <s-heading>No products found</s-heading>
              <s-paragraph>
                Add products to your Shopify store to simulate discount impact.
              </s-paragraph>
            </s-stack>
          </s-box>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Product</s-table-header>
              <s-table-header format="numeric">Cost</s-table-header>
              <s-table-header format="numeric">Current Price</s-table-header>
              <s-table-header format="numeric">Current Margin %</s-table-header>
              <s-table-header format="numeric">New Price</s-table-header>
              <s-table-header format="numeric">New Margin %</s-table-header>
              <s-table-header format="numeric">Break-even Increase %</s-table-header>
              <s-table-header>Status</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {products.map((product) => {
                const impact = calculateDiscountImpact(
                  product.price,
                  product.cost,
                  discountPercent,
                );

                let badgeTone: "critical" | "warning" | "success" | undefined;
                let badgeLabel: string | undefined;

                if (impact.breakEvenIncreasePercent === null) {
                  badgeTone = "critical";
                  badgeLabel = "No Profit";
                } else if (impact.newMarginPercent < 20) {
                  badgeTone = "critical";
                  badgeLabel = "Low Margin";
                } else if (impact.breakEvenIncreasePercent > 50) {
                  badgeTone = "warning";
                  badgeLabel = "High Break-even";
                }

                return (
                  <s-table-row key={product.productId}>
                    <s-table-cell>
                      <s-text fontWeight="semibold">{product.title}</s-text>
                    </s-table-cell>
                    <s-table-cell>${product.cost.toFixed(2)}</s-table-cell>
                    <s-table-cell>${product.price.toFixed(2)}</s-table-cell>
                    <s-table-cell>
                      {impact.currentMarginPercent.toFixed(1)}%
                    </s-table-cell>
                    <s-table-cell>${impact.newPrice.toFixed(2)}</s-table-cell>
                    <s-table-cell>
                      {impact.newMarginPercent.toFixed(1)}%
                    </s-table-cell>
                    <s-table-cell>
                      {impact.breakEvenIncreasePercent !== null
                        ? `${impact.breakEvenIncreasePercent.toFixed(1)}%`
                        : "—"}
                    </s-table-cell>
                    <s-table-cell>
                      {badgeLabel ? (
                        <s-badge tone={badgeTone}>{badgeLabel}</s-badge>
                      ) : (
                        <s-badge tone="success">Healthy</s-badge>
                      )}
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
