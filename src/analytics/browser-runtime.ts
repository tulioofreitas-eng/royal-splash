import {
  SITE_ANALYTICS_SCHEMA_VERSION,
  type SiteAnalyticsContext,
  type SiteAnalyticsEvent,
  type SiteAnalyticsEventName,
} from "./contracts.ts";

interface SemanticEventMetadata {
  componentRef?: string;
  subjectRef?: string;
  channelRef?: string;
}

interface BrowserAnalyticsWindow extends Window {
  __siteAnalyticsEvents?: SiteAnalyticsEvent[];
}

function normalizedReference(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

export function installBrowserSemanticAnalyticsRuntime(
  baseContext: SiteAnalyticsContext,
): void {
  const analyticsWindow =
    window as BrowserAnalyticsWindow;

  const events: SiteAnalyticsEvent[] = [];

  analyticsWindow.__siteAnalyticsEvents =
    events;

  const track = (
    eventName: SiteAnalyticsEventName,
    metadata: SemanticEventMetadata = {},
  ) => {
    const componentRef =
      normalizedReference(
        metadata.componentRef,
      );

    const subjectRef =
      normalizedReference(
        metadata.subjectRef,
      );

    const channelRef =
      normalizedReference(
        metadata.channelRef,
      );

    const event: SiteAnalyticsEvent = {
      schemaVersion:
        SITE_ANALYTICS_SCHEMA_VERSION,
      eventName,
      context: {
        ...baseContext,
        ...(componentRef
          ? { componentRef }
          : {}),
      },
      ...(subjectRef
        ? { subjectRef }
        : {}),
      ...(channelRef
        ? { channelRef }
        : {}),
    };

    events.push(event);

    window.dispatchEvent(
      new CustomEvent(
        "site:analytics",
        {
          detail: event,
        },
      ),
    );
  };

  track("page_viewed");

  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const target = event.target.closest(
        "[data-analytics-cta]",
      );

      if (!(target instanceof HTMLElement)) {
        return;
      }

      track(
        "cta_activated",
        {
          componentRef:
            target.dataset.analyticsComponent,
          subjectRef:
            target.dataset.analyticsSubject,
          channelRef:
            target.dataset.analyticsChannel,
        },
      );
    },
  );

  window.addEventListener(
    "site:lead-submitted",
    (event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const detail =
        typeof event.detail === "object" &&
        event.detail !== null
          ? event.detail as Record<
              string,
              unknown
            >
          : {};

      track(
        "lead_submitted",
        {
          componentRef:
            normalizedReference(
              detail.componentRef,
            ),
          subjectRef:
            normalizedReference(
              detail.subjectRef,
            ),
          channelRef:
            normalizedReference(
              detail.channelRef,
            ),
        },
      );
    },
  );
}
