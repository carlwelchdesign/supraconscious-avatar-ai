import Link from "next/link"
import { runFounderCalibrationSetupReport, FOUNDER_CALIBRATION_PARTICIPANT_ROLES } from "@inner-avatar/ai"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import {
  activateFounderCalibrationParticipantAction,
  addFounderCalibrationParticipantAction,
  pauseFounderCalibrationParticipantAction,
  syncFounderCalibrationParticipantAction,
} from "../actions"

export default async function FounderCalibrationSetupPage() {
  const report = await runFounderCalibrationSetupReport()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/calibration" className="text-xs text-muted-foreground hover:text-foreground">Back to calibration</Link>
        <h1 className="mt-2 text-2xl font-semibold">Founder Calibration Setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure Carl and Maria as real calibration participants. Raw journal text and feedback note text stay out of this view.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Active" value={report.readiness.activeParticipants} />
        <Metric title="Linked users" value={report.readiness.linkedUsers} />
        <Metric title="With sessions" value={report.readiness.participantsWithSessions} />
        <Metric title="Golden examples" value={report.readiness.participantsWithGoldenExamples} />
      </div>

      <Card>
        <CardHeader><CardTitle>Add Founder Participant</CardTitle></CardHeader>
        <CardContent>
          <form action={addFounderCalibrationParticipantAction} className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
            <input name="email" type="email" placeholder="founder email" required className="rounded-md border bg-background px-3 py-2 text-sm" />
            <select name="participantRole" defaultValue="other_founder" className="rounded-md border bg-background px-3 py-2 text-sm">
              {FOUNDER_CALIBRATION_PARTICIPANT_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <input name="reason" placeholder="Reason required; no raw journal text" required className="rounded-md border bg-background px-3 py-2 text-sm" />
            <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Add / activate</button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Readiness Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {report.blockers.length === 0 ? (
            <p className="rounded-md border bg-emerald-500/5 p-3 text-muted-foreground">
              Founder setup is ready for live calibration sessions.
            </p>
          ) : report.blockers.map((blocker) => (
            <p key={blocker} className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-destructive">
              {blocker}
            </p>
          ))}
          {report.warnings.map((warning) => (
            <p key={warning} className="rounded-md border bg-muted/40 p-3 text-muted-foreground">{warning}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>First Session Launch</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {report.participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add Carl and Maria above, then this panel will show the next launch action for each founder.</p>
          ) : report.participants.map((participant) => (
            <div key={`${participant.id}-launch`} className="rounded-md border p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{participant.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Next: {participant.nextAction}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SafeLink href="/register" label="Register" />
                  <SafeLink href="/login" label="Login" />
                  <SafeLink href="/onboarding" label="Onboarding" />
                  <SafeLink href="/journal" label="Journal" />
                  {participant.nextActionHref ? <SafeLink href={participant.nextActionHref} label="Next action" /> : null}
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {participant.scenarioStatus.map((item) => (
                  <div key={item.scenario} className="rounded-md bg-muted/40 px-3 py-2 text-xs">
                    <p className="font-medium">{item.scenario}</p>
                    <p className="mt-1 text-muted-foreground">
                      {item.completed ? `${item.sessionCount} run` : "not run"} · {item.hasReadyExample ? "ready example" : "no ready example"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {report.participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No founder participants configured yet.</p>
          ) : report.participants.map((participant) => (
            <div key={participant.id} className="rounded-md border p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{participant.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {participant.participantRole} · {participant.status} · account {participant.accountExists ? "linked" : "missing"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    onboarding {participant.onboardingComplete ? "complete" : "pending"} · consent records {participant.consentCount} · sessions {participant.sessionCount}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    feedback notes {participant.feedbackNoteCount} · reviewed {participant.reviewedSessionCount} · golden {participant.goldenExampleCount}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ParticipantAction id={participant.id} label="Sync user" action={syncFounderCalibrationParticipantAction} />
                  {participant.status === "active" ? (
                    <ParticipantAction id={participant.id} label="Pause" action={pauseFounderCalibrationParticipantAction} />
                  ) : (
                    <ParticipantAction id={participant.id} label="Activate" action={activateFounderCalibrationParticipantAction} />
                  )}
                </div>
              </div>
              {participant.missingActions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {participant.missingActions.map((action) => (
                    <p key={action.code} className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      {action.href ? <Link href={action.href} className="underline">{action.message}</Link> : action.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Scenario Coverage</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          {report.scenarioCoverage.length === 0 ? (
            <p className="text-muted-foreground">No founder calibration scenarios have been run yet.</p>
          ) : report.scenarioCoverage.map((item) => (
            <div key={item.scenario} className="rounded-md border p-3">
              <p className="font-medium">{item.scenario}</p>
              <p className="text-xs text-muted-foreground">{item.totalSessions} session{item.totalSessions === 1 ? "" : "s"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}

function SafeLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-muted">
      {label}
    </Link>
  )
}

function ParticipantAction({
  id,
  label,
  action,
}: {
  id: string
  label: string
  action: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={action} className="flex gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="reason" placeholder={`${label} reason`} required className="w-44 rounded-md border bg-background px-2 py-1.5 text-xs" />
      <button className="rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-muted">{label}</button>
    </form>
  )
}
