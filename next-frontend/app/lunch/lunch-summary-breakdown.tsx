import type { LunchSummary } from "@/api/lunch";

export default function LunchSummaryBreakdown({ breakdown, totalRecipients, locked }: Pick<LunchSummary, "breakdown" | "totalRecipients" | "locked">) {
  if (totalRecipients === 0) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No users are available for this date.</p>;
  const platforms = [...new Set(breakdown.map((item) => item.platform))];
  const schedules = [...new Set(breakdown.map((item) => item.workSchedule))];
  const matching = (platform?: string, schedule?: string) => breakdown.filter((item) =>
    (platform === undefined || item.platform === platform) && (schedule === undefined || item.workSchedule === schedule));
  const total = (items: typeof breakdown) => items.reduce((sum, item) => sum + item.total, 0);
  const received = (items: typeof breakdown) => items.reduce((sum, item) => sum + item.received, 0);
  const countLabel = (platform: string, schedule?: string) => {
    const group = matching(platform, schedule);
    return locked ? `${received(group).toLocaleString()}/${total(group).toLocaleString()}` : total(group).toLocaleString();
  };
  const scheduleLabel = (schedule: string) => {
    const group = matching(undefined, schedule);
    return locked ? `${received(group).toLocaleString()}/${total(group).toLocaleString()}` : total(group).toLocaleString();
  };
  return <div className="overflow-x-auto">
    <table className="w-full table-fixed text-left text-sm">
      <thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Platform</th>{schedules.map((schedule) => <th key={schedule} className="px-2 py-3 text-right font-medium">{schedule}</th>)}<th className="bg-[#fff3e8] px-3 py-3 text-right font-bold text-[#8a2c00]">Total</th></tr></thead>
      <tbody className="divide-y">{platforms.map((platform) => <tr key={platform}><th scope="row" className="truncate px-3 py-3 font-medium">{platform}</th>{schedules.map((schedule) => <td key={schedule} className="px-2 py-3 text-right tabular-nums">{countLabel(platform, schedule)}</td>)}<td className="bg-[#fff3e8] px-3 py-3 text-right font-bold text-[#8a2c00]">{countLabel(platform)}</td></tr>)}</tbody>
      <tfoot className="border-t-2 border-[#b83b00]/30 bg-[#fff3e8] text-[#8a2c00]"><tr><th className="px-3 py-3 text-left font-bold">Total</th>{schedules.map((schedule) => <td key={schedule} className="px-2 py-3 text-right font-bold tabular-nums">{scheduleLabel(schedule)}</td>)}<td className="px-3 py-3 text-right font-extrabold tabular-nums">{locked ? `${breakdown.reduce((sum, item) => sum + item.received, 0).toLocaleString()}/${totalRecipients.toLocaleString()}` : totalRecipients.toLocaleString()}</td></tr></tfoot>
    </table>
  </div>;
}
