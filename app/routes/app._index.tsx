import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        codeDiscountNodes(first: 25, sortKey: CREATED_AT, reverse: true) {
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

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDiscountValue(discount: any) {
  const value = discount.customerGets?.value;
  if (value?.percentage) {
    return `${(value.percentage * 100).toFixed(0)}%`;
  }
  if (value?.amount) {
    return `${discount.customerGets.value.amount.currencyCode} ${value.amount.amount}`;
  }
  return "Free shipping";
}

function getStatusTone(status: string) {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "EXPIRED":
      return "critical";
    case "SCHEDULED":
      return "info";
    default:
      return "default";
  }
}

export default function Index() {
  const { discounts } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Discount Impact">
      <s-section>
        {discounts.length === 0 ? (
          <s-box padding="loose">
            <s-stack direction="block" gap="base" align="center">
              <s-heading>No discounts found</s-heading>
              <s-paragraph>
                Create discounts in your Shopify admin to start tracking their
                impact.
              </s-paragraph>
            </s-stack>
          </s-box>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Discount</s-table-header>
              <s-table-header>Code</s-table-header>
              <s-table-header>Type</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header format="numeric">Uses</s-table-header>
              <s-table-header>Start date</s-table-header>
              <s-table-header>End date</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {discounts.map((node: any) => {
                const discount = node.codeDiscount;
                if (!discount) return null;

                const code = discount.codes?.nodes?.[0]?.code ?? "—";
                const discountValue = getDiscountValue(discount);
                const statusTone = getStatusTone(discount.status);

                return (
                  <s-table-row key={node.id}>
                    <s-table-cell>
                      <s-text fontWeight="semibold">{discount.title}</s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text>{code}</s-text>
                    </s-table-cell>
                    <s-table-cell>{discountValue}</s-table-cell>
                    <s-table-cell>
                      <s-badge tone={statusTone}>{discount.status}</s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      {discount.asyncUsageCount ?? 0}
                      {discount.usageLimit
                        ? ` / ${discount.usageLimit}`
                        : ""}
                    </s-table-cell>
                    <s-table-cell>{formatDate(discount.startsAt)}</s-table-cell>
                    <s-table-cell>{formatDate(discount.endsAt)}</s-table-cell>
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
