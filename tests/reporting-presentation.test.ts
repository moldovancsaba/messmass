import nextConfig from "../next.config.js";

describe("Universal Reporting Presentation & Dynamic Routing (RFC-003 / Issue #13)", () => {
  it("defines permanent redirect from /interactive-report/szrt to /report/hashtag/tippmixreport2026", async () => {
    const redirects = await nextConfig.redirects();
    const szrtRedirect = redirects.find((r: any) => r.source === "/interactive-report/szrt");

    expect(szrtRedirect).toBeDefined();
    expect(szrtRedirect.destination).toBe("/report/hashtag/tippmixreport2026");
    expect(szrtRedirect.permanent).toBe(true);
  });

  it("configures transparent rewrites for universal multi-scope hierarchy", async () => {
    const rewrites = await nextConfig.rewrites();
    const rewritesList = Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles || [];

    const hashtagRewrite = rewritesList.find((r: any) => r.source === "/report/hashtag/:hashtag*");
    const partnerRewrite = rewritesList.find((r: any) => r.source === "/report/partner/:slug*");
    const eventRewrite = rewritesList.find((r: any) => r.source === "/report/event/:id*");

    expect(hashtagRewrite).toBeDefined();
    expect(hashtagRewrite.destination).toBe("/interactive-report/hashtag/:hashtag*");

    expect(partnerRewrite).toBeDefined();
    expect(partnerRewrite.destination).toBe("/interactive-report/partner/:slug*");

    expect(eventRewrite).toBeDefined();
    expect(eventRewrite.destination).toBe("/interactive-report/event/:id*");
  });

  it("verifies GDS color palette contract and accessibility tokens (INV-005)", () => {
    const { INTERACTIVE_REPORT_THEME } = require("@/lib/theme/interactiveReportPalette");
    expect(INTERACTIVE_REPORT_THEME).toBeDefined();
    expect(INTERACTIVE_REPORT_THEME.white).toBe("#ffffff");
    expect(INTERACTIVE_REPORT_THEME.navyBrand).toBe("#0f2c4a");
    expect(INTERACTIVE_REPORT_THEME.bluePrimary).toBe("#2563eb");
    expect(INTERACTIVE_REPORT_THEME.badges.sportswearColor).toBe("#3730a3");
  });
});
