import { clsx } from "@/lib/clsx";

/*
 * Placeholders in the shape of what's loading, so a screen arrives into the
 * layout it already showed rather than replacing a spinner. Each screen
 * skeleton mirrors that screen's real structure: same cards, same order,
 * roughly the same heights.
 */

/** One grey shape. Size it with classes; it shimmers on its own. */
export function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={clsx("skeleton block rounded-[8px]", className)} style={style} />;
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-[20px] bg-surface p-4 shadow-card", className)}>{children}</div>;
}

function Title({ withKicker = true }: { withKicker?: boolean }) {
  return (
    <div className="mb-5">
      {withKicker && <Bone className="mb-2 h-3.5 w-28" />}
      <Bone className="h-9 w-52 rounded-[10px]" />
    </div>
  );
}

function Rows({ count, tall = false }: { count: number; tall?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-surface shadow-card">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            "flex items-center gap-3.5 border-b border-line/40 px-4 last:border-b-0",
            tall ? "py-3.5" : "py-3"
          )}
        >
          {tall && <Bone className="h-11 w-11 flex-shrink-0 rounded-[12px]" />}
          <span className="flex-1">
            {tall && <Bone className="mb-1.5 h-3 w-16" />}
            <Bone className={clsx("h-4", i % 2 ? "w-32" : "w-40")} />
          </span>
          <Bone className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div>
      <div className="mb-5">
        <Bone className="mb-2 h-3.5 w-32" />
        <Bone className="h-9 w-56 rounded-[10px]" />
      </div>
      <div className="mb-4 rounded-[24px] bg-fill-strong p-5">
        <Bone className="skeleton-on-color mb-3 h-6 w-40 rounded-full" />
        <Bone className="skeleton-on-color mb-2 h-7 w-28" />
        <Bone className="skeleton-on-color mb-4 h-4 w-36" />
        <Bone className="skeleton-on-color h-[52px] w-full rounded-[16px]" />
      </div>
      <WeekCardSkeleton />
      <Card className="mb-4 flex items-center gap-3.5">
        <Bone className="h-10 w-10 rounded-[11px]" />
        <span className="flex-1">
          <Bone className="mb-1.5 h-4 w-32" />
          <Bone className="h-3.5 w-48" />
        </span>
      </Card>
    </div>
  );
}

/** Home's "This week" card while history loads. */
export function WeekCardSkeleton() {
  return (
    <Card className="mb-4">
      <div className="mb-4 flex items-center gap-4">
        <Bone className="h-[60px] w-[60px] rounded-full" />
        <span className="flex-1">
          <Bone className="mb-2 h-3 w-16" />
          <Bone className="mb-2 h-5 w-36" />
          <Bone className="h-3 w-44" />
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="flex flex-col items-center gap-1.5">
            <Bone className="h-3 w-3" />
            <Bone className="h-9 w-9 rounded-full" />
          </span>
        ))}
      </div>
    </Card>
  );
}

export function PlanSkeleton() {
  return (
    <div>
      <Title />
      <Card className="mb-5 flex items-center gap-3.5">
        <Bone className="h-10 w-10 rounded-[11px]" />
        <span className="flex-1">
          <Bone className="mb-1.5 h-4 w-36" />
          <Bone className="h-3.5 w-28" />
        </span>
      </Card>
      <div className="mb-6">
        <Rows count={5} tall />
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div>
      <Title withKicker={false} />
      <Bone className="mb-6 h-9 w-full rounded-[10px]" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <Bone className="mb-2 h-3 w-16" />
            <Bone className="h-7 w-20" />
          </Card>
        ))}
      </div>
      <Card className="mb-4">
        <Bone className="mb-4 h-4 w-32" />
        <Bone className="h-36 w-full rounded-[12px]" />
      </Card>
      <Rows count={3} />
    </div>
  );
}

export function TrainSkeleton() {
  return (
    <div>
      <Bone className="mb-4 h-5 w-24" />
      <div className="mb-1.5 flex gap-1">
        <Bone className="h-1.5 flex-1 rounded-full" />
        <Bone className="h-1.5 flex-1 rounded-full" />
      </div>
      <Bone className="mb-5 h-3 w-24" />
      <Bone className="mb-3 h-9 w-60 rounded-[10px]" />
      <Bone className="mb-5 h-4 w-20" />
      <div className="mb-5 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-[38px] flex-1 rounded-[12px]" />
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="mb-4">
          <Bone className="mb-2 h-3.5 w-14" />
          <div className="flex gap-2">
            <Bone className="h-[52px] w-[52px] rounded-[12px]" />
            <Bone className="h-[52px] flex-1 rounded-[12px]" />
            <Bone className="h-[52px] w-[52px] rounded-[12px]" />
          </div>
        </div>
      ))}
      <Bone className="h-[54px] w-full rounded-[14px]" />
    </div>
  );
}

export function CoachSkeleton() {
  return (
    <div>
      <Bone className="mb-5 h-7 w-36 rounded-[10px]" />
      <div className="flex flex-col gap-2.5">
        <Bone className="h-16 w-[75%] rounded-[20px]" />
        <Bone className="h-10 w-[55%] self-end rounded-[20px]" />
        <Bone className="h-20 w-[80%] rounded-[20px]" />
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div>
      <Title withKicker={false} />
      {[3, 3, 4].map((count, i) => (
        <div key={i} className="mb-6">
          <Bone className="mb-2 ml-4 h-3 w-24" />
          <Rows count={count} />
        </div>
      ))}
    </div>
  );
}

/** A list of cards, for reference pages like the evidence library. */
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <Bone className="mb-2 h-4 w-3/4" />
          <Bone className="mb-1.5 h-3.5 w-full" />
          <Bone className="h-3.5 w-2/3" />
        </Card>
      ))}
    </div>
  );
}

/** The skeleton for whichever screen is loading, by its address. */
export function ScreenSkeleton({ pathname }: { pathname: string }) {
  const body = pathname.startsWith("/home") ? (
    <HomeSkeleton />
  ) : pathname.startsWith("/train") ? (
    <TrainSkeleton />
  ) : pathname.startsWith("/plan") ? (
    <PlanSkeleton />
  ) : pathname.startsWith("/progress") ? (
    <ProgressSkeleton />
  ) : pathname.startsWith("/coach") ? (
    <CoachSkeleton />
  ) : pathname.startsWith("/settings") ? (
    <SettingsSkeleton />
  ) : (
    <>
      <Title />
      <ListSkeleton />
    </>
  );

  return (
    <div role="status" aria-label="Loading">
      {body}
    </div>
  );
}
