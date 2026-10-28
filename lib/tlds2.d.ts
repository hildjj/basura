declare module 'tlds2' {
  export const hash: Record<string, object>;

  export const list: string[];

  export const meta: Record<string, string>;

  export const top: string[];

  export interface CheckResult {
    error: string | null;
    punycode: boolean;
    org: string | null;
    tld: string;
    subDomain: string;
  }

  export function check(domain: string): CheckResult;

  export interface CheckDomainResult extends CheckResult {
    validTLD: boolean;
  }

  export function checkDomain(domain: string): CheckDomainResult;


  export interface CheckTLDResult extends CheckResult {
    info?: string | undefined
  }

  export function checkTLD(fqdn: string): CheckTLDResult;
}
