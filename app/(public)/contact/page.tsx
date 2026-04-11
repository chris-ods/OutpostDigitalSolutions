export default function Contact() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full mx-auto">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest text-center mb-4">
          Contact
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center mb-4">
          Let&apos;s talk.
        </h1>
        <p className="text-white/50 text-center mb-12">
          Interested in a demo, a custom build, or just have a question? Send us a message.
        </p>

        <form className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wide mb-2" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wide mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/40 text-xs font-semibold uppercase tracking-wide mb-2" htmlFor="subject">
              Subject
            </label>
            <select
              id="subject"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none"
              defaultValue=""
            >
              <option value="" disabled className="bg-gray-900">Select a topic</option>
              <option value="atx" className="bg-gray-900">ATX Financial — demo request</option>
              <option value="clientlist" className="bg-gray-900">ClientList — integration inquiry</option>
              <option value="custom" className="bg-gray-900">Custom development</option>
              <option value="other" className="bg-gray-900">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-white/40 text-xs font-semibold uppercase tracking-wide mb-2" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              placeholder="Tell us what you need..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          <button
            type="button"
            className="w-full bg-white text-black font-semibold py-3.5 rounded-full hover:bg-white/90 transition-colors text-sm"
          >
            Send message
          </button>
        </form>
      </div>
    </section>
  );
}
