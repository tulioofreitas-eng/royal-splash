import type {
  SiteLeadIngress,
  SiteLeadIngressPort,
} from "../../domains/leads/contracts.ts";

/**
 * Deterministic in-memory implementation of the Site lead ingress port.
 *
 * Intended for contract tests, local verification and non-production
 * integration development.
 *
 * It performs no persistence, networking, provider routing or normalization.
 */
export class InMemoryLeadIngressAdapter
  implements SiteLeadIngressPort
{
  private readonly submittedLeads: SiteLeadIngress[] = [];

  async submit(lead: SiteLeadIngress): Promise<void> {
    this.submittedLeads.push(lead);
  }

  getSubmittedLeads(): SiteLeadIngress[] {
    return [...this.submittedLeads];
  }
}
