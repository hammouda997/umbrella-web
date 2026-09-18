"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PORTAL_BY_ROLE, type AppRole } from "@/lib/roles";
import {
  PortalShell,
  type PortalNavItem,
  type PortalNavSection,
} from "@/components/PortalShell";

type RequireRoleProps = {
  children: React.ReactNode;
  roles: AppRole[];
  title: string;
  subtitle: string;
  links?: PortalNavItem[];
  sections?: PortalNavSection[];
};

function Guard({
  children,
  roles,
  title,
  subtitle,
  links,
  sections,
}: RequireRoleProps) {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!roles.includes(session.user.role)) {
      router.replace(PORTAL_BY_ROLE[session.user.role] ?? "/login");
    }
  }, [session, roles, router]);

  if (!session || !roles.includes(session.user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        Vérification de session...
      </div>
    );
  }

  return (
    <PortalShell
      title={title}
      subtitle={subtitle}
      links={links}
      sections={sections}
      role={session.user.role}
    >
      {children}
    </PortalShell>
  );
}

export function RequireRole(props: RequireRoleProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-ink-muted">
          Chargement...
        </div>
      }
    >
      <Guard {...props} />
    </Suspense>
  );
}
