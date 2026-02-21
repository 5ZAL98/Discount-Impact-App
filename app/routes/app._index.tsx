import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        codeDiscountNodes(first: 10, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                status
                startsAt
                endsAt
                usageLimit
                asyncUsageCount
                codes(first: 1) {
                  nodes {
                    code
                  }
                }
                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }
                    ... on DiscountAmount {
                      amount {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
              ... on DiscountCodeFreeShipping {
                title
                status
                startsAt
                endsAt
                usageLimit
                asyncUsageCount
                codes(first: 1) {
                  nodes {
                    code
                  }
                }
              }
            }
          }
        }
      }`,
  );

  const responseJson = await response.json();
  const discounts = responseJson.data?.codeDiscountNodes?.nodes ?? [];

  return { discounts };
};

export default function Index() {
  const { discounts } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Discount Impact">
      <s-section heading="Your Discounts">
        {discounts.length === 0 ? (
          <s-paragraph>
            No discounts found. Create discounts in your Shopify admin to start
            tracking their impact.
          </s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {discounts.map((node: any) => {
              const discount = node.codeDiscount;
              if (!discount) return null;

              const code = discount.codes?.nodes?.[0]?.code ?? "—";
              const value = discount.customerGets?.value;
              let discountValue = "Free shipping";
              if (value?.percentage) {
                discountValue = `${(value.percentage * 100).toFixed(0)}% off`;
              } else if (value?.amount) {
                discountValue = `${value.amount.currencyCode} ${value.amount.amount} off`;
              }

              return (
                <s-box
                  key={node.id}
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                >
                  <s-stack direction="block" gap="tight">
                    <s-heading>{discount.title}</s-heading>
                    <s-paragraph>
                      Code: <s-text fontWeight="bold">{code}</s-text> |{" "}
                      Value: <s-text fontWeight="bold">{discountValue}</s-text> |{" "}
                      Status: <s-text fontWeight="bold">{discount.status}</s-text> |{" "}
                      Used: <s-text fontWeight="bold">{discount.asyncUsageCount ?? 0}</s-text> times
                    </s-paragraph>
                  </s-stack>
                </s-box>
              );
            })}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
