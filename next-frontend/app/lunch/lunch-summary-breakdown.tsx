import type { LunchSummary } from "@/api/lunch";

export default function LunchSummaryBreakdown({ breakdown, totalRecipients, locked }: Pick<LunchSummary, "breakdown" | "totalRecipients" | "locked">) {
  if (totalRecipients === 0) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No users are available for this date.</p>;
  const platforms = [...new Set(breakdown.map((item) => item.platform))];
  const schedules = [...new Set(breakdown.map((item) => item.workSchedule))];
  const matching = (platform?: string, schedule?: string) => breakdown.filter((item) =>
    (platform === undefined || item.platform === platform) && (schedule === undefined || item.workSchedule === schedule));
  const countLabel = (platform?: string, schedule?: string) => {
    const group = matching(platform, schedule);
    const total = group.reduce((sum, item) => sum + item.total, 0);
    if (!locked) return total.toLocaleString();
    const received = group.reduce((sum, item) => sum + item.received, 0);
    const original = group.reduce((sum, item) => sum + item.originalTotal, 0);
    const additional = group.reduce((sum, item) => sum + item.additionalReceived, 0);
    return <div className="space-y-1 tabular-nums">
      <div className="whitespace-nowrap">{(received - additional).toLocaleString()}/{original.toLocaleString()} <span className="text-xs font-normal">original</span></div>
      <div className="whitespace-nowrap text-xs font-normal">{additional.toLocaleString()} additional</div>
      <div className="whitespace-nowrap text-xs">{received.toLocaleString()} received</div>
    </div>;
  };
  return <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Platform</th>{schedules.map((schedule) => <th key={schedule} className="px-2 py-3 text-right font-medium">{schedule}</th>)}<th className="bg-[#fff3e8] px-3 py-3 text-right font-bold text-[#8a2c00]">Total</th></tr></thead>
      <tbody className="divide-y">{platforms.map((platform) => <tr key={platform}><th scope="row" className="truncate px-3 py-3 font-medium">{platform}</th>{schedules.map((schedule) => <td key={schedule} className="px-2 py-3 text-right tabular-nums">{countLabel(platform, schedule)}</td>)}<td className="bg-[#fff3e8] px-3 py-3 text-right font-bold text-[#8a2c00]">{countLabel(platform)}</td></tr>)}</tbody>
      <tfoot className="border-t-2 border-[#b83b00]/30 bg-[#fff3e8] text-[#8a2c00]"><tr><th className="px-3 py-3 text-left font-bold">Total</th>{schedules.map((schedule) => <td key={schedule} className="px-2 py-3 text-right font-bold tabular-nums">{countLabel(undefined, schedule)}</td>)}<td className="px-3 py-3 text-right font-extrabold tabular-nums">{countLabel()}</td></tr></tfoot>
    </table>
  </div>;
}
