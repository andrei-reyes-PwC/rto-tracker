import type { LunchDay } from "@/api/lunch";

function formatCount(group: LunchDay["recipients"], showReceiptCounts: boolean) {
  const total = new Intl.NumberFormat().format(group.length);
  if (!showReceiptCounts) return total;
  const received = new Intl.NumberFormat().format(group.filter((recipient) => recipient.received).length);
  return `${received}/${total}`;
}

export default function LunchBreakdown({
  recipients,
  showReceiptCounts,
}: {
  recipients: LunchDay["recipients"];
  showReceiptCounts: boolean;
}) {
  const platforms = [...new Set(recipients.map((recipient) => recipient.platform ?? "No platform"))]
    .sort((a, b) => a.localeCompare(b));
  const workSchedules = [...new Set(recipients.map((recipient) => recipient.workSchedule ?? "No work schedule"))]
    .sort((a, b) => a.localeCompare(b));
  const grandReceived = recipients.filter((recipient) => recipient.received).length;

  if (recipients.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No users are available for this date.</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Platform and work schedule breakdown</h3>
      <div className="space-y-3 md:hidden">
        {platforms.map((platform) => {
          const platformUsers = recipients.filter((recipient) => (recipient.platform ?? "No platform") === platform);
          return <section key={platform} className="rounded-xl border bg-muted/10 p-4">
            <div className="flex items-center justify-between gap-3 border-b pb-3"><h4 className="truncate text-sm font-semibold" title={platform}>{platform}</h4><p className="shrink-0 text-sm font-bold text-[#8a2c00]">{formatCount(platformUsers, showReceiptCounts)} total</p></div>
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {workSchedules.map((schedule) => {
                const group = platformUsers.filter((recipient) => (recipient.workSchedule ?? "No work schedule") === schedule);
                return <div key={schedule} className="min-w-0 rounded-lg bg-background p-3"><dt className="truncate text-xs text-muted-foreground" title={schedule}>{schedule}</dt><dd className="mt-1 text-base font-semibold">{formatCount(group, showReceiptCounts)}</dd></div>;
              })}
            </dl>
          </section>;
        })}
        <section className="rounded-xl border border-[#b83b00]/30 bg-[#fff3e8] p-4 text-[#8a2c00]">
          <h4 className="text-sm font-bold">All platforms</h4>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {workSchedules.map((schedule) => {
              const group = recipients.filter((recipient) => (recipient.workSchedule ?? "No work schedule") === schedule);
              return <div key={schedule} className="rounded-lg bg-white/70 p-3"><dt className="truncate text-xs text-[#8a2c00]/75" title={schedule}>{schedule}</dt><dd className="mt-1 text-base font-bold">{formatCount(group, showReceiptCounts)}</dd></div>;
            })}
            <div className="rounded-lg bg-white/70 p-3"><dt className="text-xs font-semibold">All users</dt><dd className="mt-1 text-base font-extrabold">{showReceiptCounts ? `${new Intl.NumberFormat().format(grandReceived)}/${new Intl.NumberFormat().format(recipients.length)}` : new Intl.NumberFormat().format(recipients.length)}</dd></div>
          </dl>
        </section>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup><col className="w-36" />{workSchedules.map((schedule) => <col key={schedule} className="w-24" />)}<col className="w-24" /></colgroup>
          <thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Platform</th>{workSchedules.map((schedule) => <th key={schedule} className="min-w-24 px-2 py-3 text-right font-medium">{schedule}</th>)}<th className="min-w-24 bg-[#fff3e8] px-3 py-3 text-right font-bold text-[#8a2c00]">Total</th></tr></thead>
          <tbody className="divide-y">{platforms.map((platform) => {
            const platformUsers = recipients.filter((recipient) => (recipient.platform ?? "No platform") === platform);
            return <tr key={platform}><th scope="row" className="truncate px-3 py-3 font-medium" title={platform}>{platform}</th>{workSchedules.map((schedule) => {
              const group = platformUsers.filter((recipient) => (recipient.workSchedule ?? "No work schedule") === schedule);
              return <td key={schedule} className="px-2 py-3 text-right tabular-nums">{formatCount(group, showReceiptCounts)}</td>;
            })}<td className="bg-[#fff3e8] px-3 py-3 text-right font-bold text-[#8a2c00]">{formatCount(platformUsers, showReceiptCounts)}</td></tr>;
          })}</tbody>
          <tfoot className="border-t-2 border-[#b83b00]/30 bg-[#fff3e8] text-[#8a2c00]"><tr><th scope="row" className="px-3 py-3 text-left font-bold">Total</th>{workSchedules.map((schedule) => {
            const group = recipients.filter((recipient) => (recipient.workSchedule ?? "No work schedule") === schedule);
            return <td key={schedule} className="px-2 py-3 text-right font-bold tabular-nums">{formatCount(group, showReceiptCounts)}</td>;
          })}<td className="px-3 py-3 text-right text-base font-extrabold tabular-nums">{showReceiptCounts ? `${new Intl.NumberFormat().format(grandReceived)}/${new Intl.NumberFormat().format(recipients.length)}` : new Intl.NumberFormat().format(recipients.length)}</td></tr></tfoot>
        </table>
      </div>
      {showReceiptCounts && <p className="text-xs text-muted-foreground">Each count shows received / total users.</p>}
    </div>
  );
}
