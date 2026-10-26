import { VENDOR_STATUSES, formatInr, type VendorItem, type VendorStatus } from '@utsav/core';
import { formatDate } from '../../lib/dates.js';
import { Badge } from '../ui/Badge.js';
import { TIMING, VENDOR_STATUS_LABELS } from './labels.js';

interface VendorsPanelProps {
  readonly vendors: readonly VendorItem[];
  readonly status: Readonly<Record<string, VendorStatus>>;
  readonly today: string;
  readonly onStatus: (vendorId: string, status: VendorStatus) => void;
}

function VendorQuestions({ vendor }: { readonly vendor: VendorItem }): React.JSX.Element {
  return (
    <details className="rounded-lg bg-brand-soft px-4 py-2 text-sm">
      <summary className="cursor-pointer font-semibold">What to ask and check</summary>
      <h4 className="mt-2 font-semibold">Ask</h4>
      <ul className="list-disc pl-5">
        {vendor.questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
      <h4 className="mt-2 font-semibold">Get in the contract</h4>
      <ul className="mb-1 list-disc pl-5">
        {vendor.contractChecks.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ul>
    </details>
  );
}

interface StatusSelectProps {
  readonly vendor: VendorItem;
  readonly status: VendorStatus;
  readonly onStatus: (vendorId: string, status: VendorStatus) => void;
}

function StatusSelect({ vendor, status, onStatus }: StatusSelectProps): React.JSX.Element {
  const selectId = `vendor-${vendor.id}`;
  return (
    <div>
      <label htmlFor={selectId} className="label text-xs">
        Status
      </label>
      <select
        id={selectId}
        className="field py-1.5 text-sm"
        value={status}
        onChange={(event) => {
          onStatus(vendor.id, event.target.value as VendorStatus);
        }}
      >
        {VENDOR_STATUSES.map((option) => (
          <option key={option} value={option}>
            {VENDOR_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

function VendorCard({
  vendor,
  status,
  overdue,
  onStatus,
}: {
  readonly vendor: VendorItem;
  readonly status: VendorStatus;
  readonly overdue: boolean;
  readonly onStatus: VendorsPanelProps['onStatus'];
}) {
  const [timingLabel, timingTone] = TIMING[vendor.timing];
  return (
    <li className="card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{vendor.label}</h3>
          <p className="text-sm text-ink-soft">
            Book by {formatDate(vendor.bookBy)} · about {formatInr(vendor.estimatedCost)} · advance{' '}
            {formatInr(vendor.estimatedDeposit)}
          </p>
          <p className="mt-1 flex flex-wrap gap-2">
            {status === 'booked' ? (
              <Badge tone="ok">Booked</Badge>
            ) : (
              overdue && <Badge tone="danger">Booking overdue</Badge>
            )}
            {status !== 'booked' && vendor.timing !== 'on-track' && (
              <Badge tone={timingTone}>{timingLabel}</Badge>
            )}
          </p>
        </div>
        <StatusSelect vendor={vendor} status={status} onStatus={onStatus} />
      </div>
      <VendorQuestions vendor={vendor} />
    </li>
  );
}

/** The vendors this event needs, in booking order, with an expected fee and a status to track. */
export function VendorsPanel({
  vendors,
  status,
  today,
  onStatus,
}: VendorsPanelProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Vendor checklist</h2>
      <p className="text-sm text-muted">
        Fees are this plan’s budget for each vendor, not quotes. Advances are the typical amount
        asked at booking.
      </p>
      <ul className="space-y-4">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            status={status[vendor.id] ?? 'todo'}
            overdue={vendor.bookBy < today}
            onStatus={onStatus}
          />
        ))}
      </ul>
    </div>
  );
}
