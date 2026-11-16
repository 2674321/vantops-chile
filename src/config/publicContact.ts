export interface PublicContact { name: string; github: string; email: string; linkedin: string | null; instagram: string | null; }
export function verifyPublicSocialUrl(raw: string | undefined, domain: "linkedin.com" | "instagram.com"): string | null { if (!raw?.trim()) return null; try { const url = new URL(raw.trim()); const hostname = url.hostname.toLowerCase(); if (url.protocol !== "https:" || (hostname !== domain && !hostname.endsWith(`.${domain}`)) || url.username || url.password || url.pathname === "/") return null; return url.href; } catch { return null; } }
export const PUBLIC_CONTACT: PublicContact = {
  name: "VantOPS Chile",
  github: "https://github.com/2674321",
  email: "pvc.devno@gmail.com",
  linkedin: verifyPublicSocialUrl(
    import.meta.env.VITE_PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/in/patricioa2/",
    "linkedin.com",
  ),
  instagram: verifyPublicSocialUrl(
    import.meta.env.VITE_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/__mudrock/",
    "instagram.com",
  ),
};
