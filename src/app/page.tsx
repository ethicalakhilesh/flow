import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Pill } from "@/components/ui/pill";

export default function Home() {
  const username = headers().get("x-flow-user-username") ?? "Guest";

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Hello World</span>
              <Pill>Design tokens active</Pill>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Checking" value="$6,120.10" />
              <MetricCard label="Credit card" value="-$1,340.00" />
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
