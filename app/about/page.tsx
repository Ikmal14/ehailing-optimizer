export const metadata = {
  title: 'About — Strategic Shift Planner',
  description: 'How the Strategic Shift Planner helps e-hailing drivers earn more.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-panel p-4 space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{title}</h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="space-y-4 pt-2">
      {/* Hero */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 text-center space-y-2">
        <p className="text-4xl">⚡</p>
        <h1 className="text-xl font-black text-content">Strategic Shift Planner</h1>
        <p className="text-sm text-content/70 leading-relaxed">
          Your co-pilot for working smarter, not longer. It tells you{' '}
          <span className="text-accent font-semibold">when</span> to start,{' '}
          <span className="text-accent font-semibold">where</span> to go, and{' '}
          <span className="text-accent font-semibold">which areas to avoid</span> — so you
          spend your time earning instead of waiting.
        </p>
      </div>

      <Section title="What this app is">
        <p className="text-sm text-content/80 leading-relaxed">
          Driving for e-hailing in the Klang Valley is a guessing game. You log on and hope
          you picked a good spot at a good time. Some hours are gold; others you burn fuel
          circling for a single ride — what drivers call <em>“sidai”</em> (left hanging, idle).
        </p>
        <p className="text-sm text-content/80 leading-relaxed">
          The Strategic Shift Planner removes the guesswork. It watches live traffic and
          weather across the Klang Valley and works out, in plain ringgit, which area is
          paying best <strong>right now</strong> — and warns you off the ones that look busy
          but actually trap you in traffic for little reward.
        </p>
      </Section>

      <Section title="How it helps you">
        <ul className="space-y-3 text-sm text-content/80">
          <li className="flex gap-3">
            <span className="text-lg leading-none">⏰</span>
            <span>
              <strong className="text-content">Best Start Time.</strong> Instead of logging on
              and waiting, it tells you the exact time to flip online so you arrive just as
              demand peaks — not 40 minutes early burning fuel.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg leading-none">🎯</span>
            <span>
              <strong className="text-content">My Destination Target.</strong> It names the one
              zone worth driving to right now and the direction to head, so you can set your
              destination filter with confidence.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg leading-none">⛔</span>
            <span>
              <strong className="text-content">Blacklist / Trap Zones.</strong> Some hotspots
              look tempting but the traffic eats your earnings alive. The app flags these so
              you don’t chase demand that doesn’t actually pay.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg leading-none">🌧️</span>
            <span>
              <strong className="text-content">Weather-aware.</strong> Rain changes everything —
              demand jumps and fares surge. The app factors live weather into every
              recommendation automatically.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg leading-none">💸</span>
            <span>
              <strong className="text-content">Real money, not vague scores.</strong> Every zone
              is rated by estimated <strong>net ringgit per hour</strong> after fuel — the
              number that actually matters to your take-home.
            </span>
          </li>
        </ul>
      </Section>

      <Section title="How the score is calculated">
        <p className="text-sm text-content/80 leading-relaxed">
          The big number you see on each zone is a <strong>0–100 earnings score</strong>. It
          answers one question: <em>“If I work this area right now, roughly how much will I
          actually take home per hour?”</em>
        </p>
        <p className="text-sm text-content/80 leading-relaxed">
          What makes it honest is that it counts your <strong>whole working cycle</strong>, not
          just the paid trip:
        </p>

        <div className="space-y-2">
          {[
            { icon: '⏳', label: 'Waiting time', desc: 'How long until your next ride. Busy areas = shorter waits.' },
            { icon: '🚗', label: 'Pickup driving', desc: 'The empty drive to reach the passenger — longer when traffic is bad.' },
            { icon: '🧳', label: 'The paid trip', desc: 'Typical distance and time for a ride from that area.' },
            { icon: '⛽', label: 'Fuel cost', desc: 'Subtracted out, based on your vehicle’s fuel efficiency.' },
            { icon: '🌧️', label: 'Surge', desc: 'Fares are boosted when it’s raining or stormy.' },
          ].map((r) => (
            <div key={r.label} className="flex gap-3 bg-surface rounded-lg p-3">
              <span className="text-base leading-none">{r.icon}</span>
              <div>
                <p className="text-sm font-semibold text-content">{r.label}</p>
                <p className="text-xs text-muted">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-surface border border-border/60 p-3">
          <p className="text-xs text-muted mb-1">In plain terms:</p>
          <p className="text-sm text-accent font-mono leading-relaxed">
            Score ≈ money earned ÷ total time spent (waiting + driving to pickup + the trip)
          </p>
        </div>

        <p className="text-sm text-content/80 leading-relaxed">
          This is why a fancy long-fare area can score <em>lower</em> than a humble spot doing
          quick back-to-back rides: the quick spot keeps you earning, while the fancy one
          leaves you idle between trips.
        </p>
      </Section>

      <Section title="Reading the colours">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-success shrink-0" />
            <span className="text-content/80"><strong className="text-success">70–100</strong> — Strong earner. Head here.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-warning shrink-0" />
            <span className="text-content/80"><strong className="text-warning">40–69</strong> — Decent. Worth it if nearby.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-orange-400 shrink-0" />
            <span className="text-content/80"><strong className="text-orange-400">1–39</strong> — Weak. Only if you’re already there.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-danger shrink-0" />
            <span className="text-content/80"><strong className="text-danger">0 / Blacklisted</strong> — Trap zone. Avoid — it won’t cover your time and fuel.</span>
          </div>
        </div>
      </Section>

      <Section title="A few honest notes">
        <ul className="space-y-2 text-xs text-muted list-disc pl-4">
          <li>Recommendations refresh every 10 minutes using live traffic and weather.</li>
          <li>
            Earnings figures are <strong>estimates</strong> to compare zones against each
            other — not a guarantee of what any single ride will pay.
          </li>
          <li>
            The app suggests; you decide. Treat it as a smart second opinion, not autopilot.
          </li>
        </ul>
      </Section>

      <p className="text-center text-[10px] text-muted pb-2">
        Built for Klang Valley drivers · Drive safe, earn smart.
      </p>
    </div>
  );
}
