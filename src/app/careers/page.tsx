import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SITE_CONFIG } from "@/lib/site-config";

export default function CareersPage() {
  return (
    <PageShell
      title="Careers"
      description={`Thank you for your interest in joining ${SITE_CONFIG.name}.`}
      actions={
        <Button asChild>
          <Link href="/contact">Send Your CV</Link>
        </Button>
      }
    >
      <div className="grid gap-6">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <Badge variant="secondary">Hiring Update</Badge>
            <h2 className="mt-3 text-xl font-semibold text-foreground">We are not hiring at the moment</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              We do not have any open roles currently. If you would like to be considered for future opportunities,
              please send your CV through our Contact page.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/contact">Go to Contact Page</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
