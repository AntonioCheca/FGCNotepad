import {LegalDocument, LegalEmailLink, LegalList, LegalSection, LegalText} from "@/src/components/legal/LegalDocument";
import {TextLink} from "@/src/components/ui/TextLink";
import {LEGAL_CONTACT_EMAIL} from "@/src/data/legal/legalVersion";

export default function PrivacyPolicyPage() {
    return (
        <LegalDocument title="Privacy Policy">
            <LegalSection title="1. Who is responsible for your data">
                <LegalText>
                    Fighting Game Theory (fightinggametheory.com) is a free, non-commercial fan project run by Antonio Checa,
                    an individual based in Spain, who is the controller of the personal data described here.
                    Contact: <LegalEmailLink email={LEGAL_CONTACT_EMAIL}/>.
                </LegalText>
            </LegalSection>

            <LegalSection title="2. What data we process">
                <LegalList items={[
                    <>
                        <strong>Account data:</strong> your username, your password (stored only as a one-way hash that we cannot read),
                        your account roles and status, the invite code you registered with, the version and date of the Terms of Use you
                        accepted, and the date of any account deletion request. A username and password are required to register;
                        without them we cannot create your account.
                    </>,
                    <>
                        We do not require an email address, real name or identity document to register an account. If you contact us or
                        submit a report, we process the contact details and information you provide to handle your request.
                    </>,
                    <>
                        <strong>Content you submit:</strong> combos, oki setups, blockstrings, scenarios, edit proposals and content reports,
                        together with their history and moderation decisions, including rejection reasons.
                    </>,
                    <>
                        <strong>Preferences:</strong> settings such as notation, controls, scenario mode and the combos you mark as known.
                    </>,
                    <>
                        <strong>Replay Lab</strong> (only for invited testers): replay videos you upload or YouTube links you add, and the
                        clips and annotations you create from them. They are private to you unless you create a share link, which lets anyone with the link, and its
                        password if you set one, view that review until the link expires or you revoke it.
                    </>,
                    <>
                        <strong>Match replay data:</strong> to build statistics, combo and oki data, administrators import Street Fighter 6
                        match replay data, which includes players&apos; in-game names, player IDs, characters and ranks. Player names and IDs
                        are visible only to administrators and are never published on the site.
                    </>,
                    <>
                        <strong>Technical data:</strong> a shortened version of your IP address (with the last part removed), browser user
                        agent, the page requested and the date and time, recorded in server access logs. Error logs can include the full
                        IP address of a request that caused an error. Your full IP address is also used to limit repeated login and
                        registration attempts and how often visitors without an account can load pages.
                    </>,
                    <>
                        <strong>Traffic and security analytics:</strong> Cloudflare records request data such as IP address, country,
                        browser user agent and the page requested, and shows it to us in its dashboard as traffic and security
                        statistics, for example blocked or suspicious requests. We also use Cloudflare Web Analytics, which measures
                        visits and page performance without cookies or local storage, according to Cloudflare.
                    </>,
                ]}/>
            </LegalSection>

            <LegalSection title="3. Why we use it and on what legal basis">
                <LegalList items={[
                    <>
                        To provide your account and the features you use, and to publish and moderate your contributions as described in
                        the Terms of Use: performance of our agreement with you (Article 6(1)(b) GDPR).
                    </>,
                    <>
                        To keep the site secure, detect attacks and abusive traffic, and investigate incidents, using server logs, attempt
                        limits and Cloudflare&apos;s security analytics: our legitimate interest in protecting the site and its users
                        (Article 6(1)(f) GDPR).
                    </>,
                    <>
                        To understand how the site is used overall, such as visits, popular pages and load times, through Cloudflare
                        Web Analytics: our legitimate interest in maintaining and improving the site (Article 6(1)(f) GDPR).
                    </>,
                    <>
                        To answer messages and handle content reports: our legitimate interest in running and moderating the site
                        (Article 6(1)(f) GDPR).
                    </>,
                    <>
                        To analyse match replays for statistics and game data: our legitimate interest in producing fighting game
                        analysis (Article 6(1)(f) GDPR). Players can object as described in section 7.
                    </>,
                    <>
                        To handle requests to exercise your data protection rights: compliance with a legal obligation (Article 6(1)(c) GDPR).
                    </>,
                ]}/>
                <LegalText>
                    We do not use your personal data for advertising or profiling, we do not sell it, and we do not make solely automated
                    decisions that produce legal or similarly significant effects on you.
                </LegalText>
            </LegalSection>

            <LegalSection title="4. Who can see your data">
                <LegalList items={[
                    <>
                        Approved contributions are visible to other users of the site and may show your username as their author.
                        Pending contributions are visible only to you and to moderators.
                    </>,
                    <>Moderators and administrators can see the account and content data they need to moderate the site.</>,
                    <>
                        <strong>Amazon Web Services</strong> hosts our servers and database in the AWS Europe (Paris) region.
                    </>,
                    <>
                        <strong>Cloudflare</strong> provides DNS, content delivery and security for the site. All traffic passes through
                        Cloudflare, which processes IP addresses and request data to deliver and protect the site.
                    </>,
                    <>
                        <strong>Google</strong> provides our Gmail inbox, so it processes any message you send to our contact address. In
                        Replay Lab, YouTube videos are played from YouTube, which Google operates.
                    </>,
                    <>Public authorities, only when the law requires us to share data.</>,
                ]}/>
            </LegalSection>

            <LegalSection title="5. International transfers">
                <LegalText>
                    Our servers and database are located in the European Union. Cloudflare and Google may process data outside the
                    European Economic Area, mainly in the United States. Both are certified under the EU-U.S. Data Privacy Framework,
                    which is covered by an adequacy decision of the European Commission, and Cloudflare&apos;s data processing terms also
                    include the Standard Contractual Clauses approved by the European Commission. You can ask us for more details
                    at <LegalEmailLink email={LEGAL_CONTACT_EMAIL}/>. More information:
                    <TextLink href="https://www.cloudflare.com/privacypolicy/">Cloudflare</TextLink>,
                    <TextLink href="https://policies.google.com/privacy">Google</TextLink>.
                </LegalText>
            </LegalSection>

            <LegalSection title="6. How long we keep it">
                <LegalList items={[
                    <>Account data: while your account exists.</>,
                    <>
                        When your account is deleted, we remove the personal data associated with it within one month. Published
                        contributions may remain available to preserve the community database, but we remove your username and the links
                        between them and your account, except for data we must keep for legal reasons.
                    </>,
                    <>
                        Server logs: rotated automatically, with at most 50 MB kept per service. Older entries are overwritten, so how long
                        they last depends on traffic.
                    </>,
                    <>Login, registration and request limits: up to one hour.</>,
                    <>
                        Cloudflare traffic, security and web analytics: kept by Cloudflare for the periods set in its own
                        documentation. We only view them in the Cloudflare dashboard and do not export them.
                    </>,
                    <>
                        Backups: database backups are kept for up to 14 days and server snapshots for up to 7 days. Deleted data
                        disappears from them when they are overwritten.
                    </>,
                    <>
                        Replay Lab: original replay videos are deleted 14 days after upload. Clips, annotations and share links are kept
                        while your account exists, unless you delete or revoke them first.
                    </>,
                    <>Match replay data: while we use the imported replays for statistics and game data.</>,
                    <>Content reports and moderation decisions: while the related content exists.</>,
                    <>Emails you send us: as long as needed to deal with your message and any follow-up.</>,
                ]}/>
            </LegalSection>

            <LegalSection title="7. Your rights">
                <LegalText>
                    Where applicable under the GDPR, you have the right to access, rectify and erase your personal data, to restrict or
                    object to its processing, and to data portability (Articles 15 to 21 GDPR). Contributions that contain personal
                    information remain subject to these rights.
                </LegalText>
                <LegalList items={[
                    <>To delete your account, use <strong>Request account deletion</strong> on your Profile page.</>,
                    <>
                        For any other request, email <LegalEmailLink email={LEGAL_CONTACT_EMAIL}/> and include your username, or your
                        in-game name and player ID if your request is about match replay data. Because we do not store email addresses,
                        we may ask for information to confirm that the data is yours.
                    </>,
                    <>
                        We answer within one month. For complex requests this can be extended by two further months, and we will tell you
                        if that happens.
                    </>,
                    <>
                        You can complain to the Spanish Data Protection Agency
                        <TextLink href="https://www.aepd.es">(AEPD)</TextLink> or to the data protection authority of the EU country
                        where you live.
                    </>,
                ]}/>
            </LegalSection>

            <LegalSection title="8. Cookies and browser storage">
                <LegalText>
                    We only use storage that the site needs to work. We do not use advertising or tracking cookies, and our
                    analytics (Cloudflare Web Analytics) do not use cookies.
                </LegalText>
                <LegalList items={[
                    <>
                        <strong>PHPSESSID</strong> (cookie): keeps you logged in. Requests that change data also carry a security token
                        linked to your session, which protects them against forgery and is not stored as a cookie.
                    </>,
                    <>
                        <strong>cf_clearance</strong> (cookie): only if Cloudflare shows you a security check, to remember that you
                        passed it.
                    </>,
                    <>
                        <strong>Local storage:</strong> the page to return to after logging in, and unsaved drafts from the combo and
                        scenario editors. It stays in your browser and is not sent to us until you submit.
                    </>,
                    <><strong>Session storage</strong> (Replay Lab only): details of a file being exported, cleared when you close the tab.</>,
                    <>
                        <strong>YouTube</strong> (Replay Lab only): when you play a YouTube replay, the video loads from YouTube&apos;s
                        privacy-enhanced mode (youtube-nocookie.com), operated by Google under its own privacy policy.
                    </>,
                ]}/>
            </LegalSection>

            <LegalSection title="9. Minimum age">
                <LegalText>
                    You must be at least 16 to create an account. You do not need an account to read published combos, okis,
                    blockstrings, scenarios and guides. If we learn
                    that an account belongs to someone under 16, we will deactivate it.
                </LegalText>
            </LegalSection>

            <LegalSection title="10. Security">
                <LegalText>
                    Passwords are stored as one-way hashes, connections are encrypted with HTTPS, and access to content and data is
                    limited by role. If a security incident affects your data, we will act as the GDPR requires, which can include
                    notifying the AEPD and, where needed, the affected users.
                </LegalText>
            </LegalSection>

            <LegalSection title="11. Changes to this policy">
                <LegalText>
                    When we change this policy we update the date at the top of this page. Significant changes will be announced on
                    the site. See also our
                    <TextLink href="/terms">Terms of Use</TextLink>.
                </LegalText>
            </LegalSection>
        </LegalDocument>
    );
}
