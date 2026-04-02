import { Nav } from "../../components/Nav";
import { Footer } from "../../components/Footer";

export default function About() {
  return (
    <div className="bg-black text-white">
      <Nav />

      {/* Hero */}
      <section className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 pt-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">About us</p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            We build software<br />that gets out of your way.
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Outpost Digital Solutions LLC is a technology company focused on building
            high-quality, Firebase-powered web applications for real businesses.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">Our mission</p>
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Build tools people actually want to use.
            </h2>
            <p className="text-white/50 leading-relaxed mb-4">
              Too much business software is slow, ugly, and overcomplicated. We set out to
              change that — building products with the same care and attention to detail you&apos;d
              expect from consumer apps, but designed for the complexity of real business workflows.
            </p>
            <p className="text-white/50 leading-relaxed">
              Everything we ship is built on Google Firebase, giving our clients real-time data,
              enterprise-grade security, and infrastructure that scales without a dedicated ops team.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "Firebase", label: "Core platform" },
              { value: "Next.js", label: "Frontend framework" },
              { value: "2+", label: "Products shipped" },
              { value: "LLC", label: "Est. Texas" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-2xl font-bold mb-1">{value}</p>
                <p className="text-white/40 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest text-center mb-4">
            How we work
          </p>
          <h2 className="text-4xl font-bold text-center tracking-tight mb-16">Our principles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Simplicity first",
                body: "Every feature has a cost. We build only what's needed and resist the urge to add complexity for its own sake.",
              },
              {
                title: "Real-time by default",
                body: "Data that's stale is data you can't trust. Our apps reflect reality the moment it changes.",
              },
              {
                title: "Designed to sell",
                body: "Good software should look as good as it works. We treat UI and UX with the same seriousness as the underlying logic.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h3 className="text-lg font-semibold mb-3">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
