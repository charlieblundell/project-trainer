import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, EmailLink, LegalPage, OPERATOR, Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Your Personal Trainer",
};

/*
 * Written to cover what APP 1.4 requires a privacy policy to contain, plus
 * the automated decision-making disclosure that applies from 10 December
 * 2026. Every statement here has to stay true of the code: if the app starts
 * collecting something new, sharing with a new provider, or storing coach
 * messages on the server, this page must change in the same commit.
 */

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={
        <>
          <p>We collect what we need to build and adjust your training plan, run the coach, and handle payments.</p>
          <p>
            Some of it — like injury notes, bodyweight and age — is health information. We only collect it with your
            consent, and it&apos;s optional.
          </p>
          <p>We don&apos;t sell your information, show you ads, or use it for marketing without your consent.</p>
          <p>
            You can ask to see, correct or delete your information at any time by emailing <EmailLink />.
          </p>
        </>
      }
    >
      <Section id="about" number={1} title="Who we are">
        <p>
          Your Personal Trainer (&ldquo;the app&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by{" "}
          {OPERATOR.name}, a sole trader based in {OPERATOR.location}. Contact: <EmailLink />.
        </p>
        <p>
          We handle personal information in line with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy
          Principles. This policy explains what we collect, why, who we share it with, and your rights.
        </p>
      </Section>

      <Section id="what-we-collect" number={2} title="What we collect">
        <p>
          <strong>Account details.</strong> Your email address. If you sign in with Google, Google also gives us your
          name.
        </p>
        <p>
          <strong>Your training profile.</strong> Your goal, training experience, how often and how long you train,
          where you train and what equipment you have, exercises you like or want to avoid, and the days you train.
        </p>
        <p>
          <strong>Health information.</strong> Your bodyweight, height, age and sex if you provide them, and any notes
          you give us about injuries or physical limitations. This is &ldquo;sensitive information&rdquo; under the
          Privacy Act — see section 3.
        </p>
        <p>
          <strong>Your training records.</strong> The plans the app generates for you, the sets, weights, reps and
          times you log, and your effort ratings.
        </p>
        <p>
          <strong>Coach messages.</strong> The questions you ask the AI coach. Your conversation is stored on your own
          device, and each message is sent to our AI provider to generate a reply. We record the time of each coach
          request to apply usage limits, but we do not keep a copy of your messages on our servers.
        </p>
        <p>
          <strong>Subscription details.</strong> Your trial end date, whether you have a subscription, which plan, and
          when it renews. Your card details are collected by Stripe directly — we never receive or store your full
          card number.
        </p>
        <p>
          <strong>Technical information.</strong> Our hosting providers keep standard server logs, which can include
          your IP address, browser type and the time of a request, for security and fixing faults. The app stores data
          in your browser to keep you signed in and remember where you were. We don&apos;t use advertising or tracking
          cookies.
        </p>
      </Section>

      <Section id="health-information" number={3} title="Your health information">
        <p>
          We only collect health information with your consent, and only what&apos;s reasonably necessary to give you
          a safe and suitable plan — for example, steering exercise choices away from a sore knee.
        </p>
        <p>
          Providing it is optional. If you leave it out, the app still works, but your plan won&apos;t be able to take
          those details into account. You can withdraw your consent at any time by asking us to delete the
          information.
        </p>
        <p>We never use health information for marketing, and we never sell it.</p>
      </Section>

      <Section id="how-we-collect" number={4} title="How we collect it">
        <p>
          Almost everything comes directly from you, when you answer the setup questions, log workouts or use the
          coach. We also receive your name and email from Google if you choose to sign in with Google, and payment
          status from Stripe when you subscribe.
        </p>
      </Section>

      <Section id="why" number={5} title="Why we use it">
        <Bullets
          items={[
            "to create your account and keep you signed in;",
            "to build your training plan and adjust your targets as you log workouts;",
            "to let the AI coach give answers that are relevant to your plan, profile and recent training;",
            "to run your free trial and subscription, and take payments;",
            "to send you account emails, such as sign-in links, a reminder before your trial ends, a reminder before a yearly subscription renews, and notices about payments or changes to our terms;",
            "to keep the app secure, apply fair-use limits and fix problems; and",
            "to meet our legal obligations.",
          ]}
        />
        <p>
          We don&apos;t sell personal information, we don&apos;t show ads, and we won&apos;t send you marketing
          emails unless you&apos;ve agreed to receive them. Any marketing email would include a way to unsubscribe.
        </p>
      </Section>

      <Section id="automated-decisions" number={6} title="Automated decisions">
        <p>The app uses computer programs to make some decisions without a person reviewing them:</p>
        <Bullets
          items={[
            "Your training plan — which exercises, sets, reps and rest you're given — is generated from your goal, experience, schedule, equipment, preferences, age and any injury notes.",
            "Your targets are adjusted automatically from the weights, reps and effort ratings you log.",
            "The AI coach's replies are generated from your question, your profile, your plan and your recent workouts.",
            "Whether you can use the app is decided automatically from your trial end date and subscription status.",
          ]}
        />
        <p>
          These are suggestions about your training, and you can always choose not to follow them. If you think a
          decision about your access or billing is wrong, email us and a person will look at it.
        </p>
      </Section>

      <Section id="sharing" number={7} title="Who we share it with">
        <p>
          We use trusted service providers to run the app. They only receive the information they need to do their
          job for us:
        </p>
        <Bullets
          items={[
            <><strong>Supabase</strong> — stores your account, profile and training data, and sends sign-in emails.</>,
            <><strong>Vercel</strong> — hosts the app and runs its servers.</>,
            <><strong>Anthropic</strong> — generates the AI coach&apos;s replies from your message and the training details sent with it.</>,
            <><strong>Stripe</strong> — processes subscriptions and payments.</>,
            <><strong>Resend</strong> — sends account emails, such as trial and renewal reminders.</>,
            <><strong>Google</strong> — only if you choose to sign in with Google.</>,
          ]}
        />
        <p>
          We may also disclose information if the law requires it, for example in response to a lawful request from a
          government authority.
        </p>
      </Section>

      <Section id="overseas" number={8} title="Information stored overseas">
        <p>
          Several of these providers are based in, or store data in, other countries. Your information is likely to be
          disclosed to recipients in the United States, and in Singapore, where our database is hosted.
        </p>
        <p>
          We choose established providers that are bound by their own privacy and security commitments, and we
          remain responsible under Australian law for how your information is handled.
        </p>
      </Section>

      <Section id="security" number={9} title="How we protect it">
        <Bullets
          items={[
            "All information is encrypted in transit between your device and our servers.",
            "Our database is set up so that each account can only read its own information.",
            "Payment details are handled by Stripe, and never stored by us.",
            "Access to the keys that run the app is restricted, and requests are rate-limited to prevent abuse.",
          ]}
        />
        <p>
          No system is completely secure. If a data breach is likely to result in serious harm to you, we will notify
          you and the Office of the Australian Information Commissioner, as the Notifiable Data Breaches scheme
          requires.
        </p>
      </Section>

      <Section id="retention" number={10} title="How long we keep it">
        <p>
          We keep your information for as long as you have an account. If you ask us to delete your account, we will
          delete your personal information within 30 days, except for records we are required by law to keep, such as
          payment records needed for tax purposes. Copies in routine backups are removed as those backups expire.
        </p>
      </Section>

      <Section id="your-rights" number={11} title="Seeing, correcting and deleting your information">
        <p>
          You can ask for a copy of the personal information we hold about you, ask us to correct it, or ask us to
          delete your account, by emailing <EmailLink />. We&apos;ll need to confirm the request comes from you.
        </p>
        <p>
          We&apos;ll respond within 30 days and there&apos;s no charge. If we ever can&apos;t do what you ask, we&apos;ll
          explain why in writing.
        </p>
      </Section>

      <Section id="young-people" number={12} title="Young people">
        <p>
          The app is for people aged 16 and over. We don&apos;t knowingly collect information from anyone under 16,
          and if we learn we have, we&apos;ll delete it. If you are 16 or 17, we recommend involving a parent or
          guardian, particularly before sharing health information or subscribing.
        </p>
        <p>
          We will comply with the Children&apos;s Online Privacy Code under the Privacy Act once it takes effect, and
          will update this policy to reflect it.
        </p>
      </Section>

      <Section id="complaints" number={13} title="Complaints">
        <p>
          If you&apos;re concerned about how we&apos;ve handled your personal information, please email us at{" "}
          <EmailLink /> with the details. We&apos;ll respond within 30 days.
        </p>
        <p>
          If you&apos;re not satisfied with our response, you can complain to the{" "}
          <a href="https://www.oaic.gov.au" className="text-accent underline underline-offset-4">
            Office of the Australian Information Commissioner
          </a>
          .
        </p>
      </Section>

      <Section id="changes" number={14} title="Changes to this policy">
        <p>
          We&apos;ll update this policy when the way we handle personal information changes, and change the date at
          the top. If a change is significant, we&apos;ll email you before it takes effect. Our{" "}
          <Link href="/terms" className="text-accent underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          explain the rest of how the app works.
        </p>
      </Section>
    </LegalPage>
  );
}
