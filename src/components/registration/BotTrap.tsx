/**
 * Two passive spam checks that cost a real student nothing.
 *
 * 1. A honeypot field. It is invisible and off the tab order, so a person
 *    never sees or reaches it, but form-filling bots populate every input
 *    they find. Anything with a value here was not typed by a human.
 *
 * 2. Elapsed time. The form has six steps; nobody completes it in seconds.
 *    A near-instant submission is scripted.
 *
 * Deliberately not a CAPTCHA: those add friction for every honest student,
 * need a third-party script, and are overkill until spam actually appears.
 * If it does, Cloudflare Turnstile drops in alongside this.
 *
 * Neither check is a security boundary — the review step in /admin is. These
 * just keep obvious junk out of the queue.
 */
interface BotTrapProps {
  value: string;
  onChange: (value: string) => void;
}

export function BotTrap({ value, onChange }: BotTrapProps) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="nex-contact-pref">Preferred contact time</label>
      <input
        id="nex-contact-pref"
        // A plausible name matters: bots target fields that look real.
        name="contact_preference"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
