import {LegalDocument, LegalEmailLink, LegalList, LegalSection, LegalText} from "@/src/components/legal/LegalDocument";
import {TextLink} from "@/src/components/ui/TextLink";
import {LEGAL_CONTACT_EMAIL} from "@/src/data/legal/legalVersion";

export default function TermsOfUsePage() {
    return (
        <LegalDocument title="Terms of Use">
            <LegalSection title="1. About these Terms">
                <LegalText>
                    These Terms govern the use of Fighting Game Theory (fightinggametheory.com), a free, non-commercial, fan-made
                    educational project run by Antonio Checa, an individual based in Spain. You must accept them to create an account
                    or contribute content. How we handle personal data is explained in our
                    <TextLink href="/privacy">Privacy Policy</TextLink>.
                </LegalText>
                <LegalText>
                    The site is in public alpha. Features may change, break or be removed, and data may occasionally be lost.
                </LegalText>
            </LegalSection>

            <LegalSection title="2. Accounts">
                <LegalList items={[
                    <>You must be at least 16 years old to create an account.</>,
                    <>During the alpha, registration requires an invite code.</>,
                    <>One account per person. Do not share your account and keep your password secure.</>,
                    <>
                        You are responsible for keeping your login details secure and for your own use of the site. Tell us if you think
                        someone else has accessed your account.
                    </>,
                    <>Your username must not impersonate anyone or be offensive.</>,
                ]}/>
            </LegalSection>

            <LegalSection title="3. Acceptable use">
                <LegalText>You must not:</LegalText>
                <LegalList items={[
                    <>harass, threaten, insult or discriminate against other people;</>,
                    <>impersonate others or claim an affiliation you do not have, including with Capcom or with any player;</>,
                    <>post spam, advertising or content unrelated to the site;</>,
                    <>post illegal content or content that infringes other people&apos;s rights, such as copyright, trademarks or privacy;</>,
                    <>share other people&apos;s personal data without their permission;</>,
                    <>try to access accounts or data that are not yours, bypass moderation or security measures, or disrupt the site;</>,
                    <>use automated tools to create accounts or to scrape the site in a way that burdens it.</>,
                ]}/>
            </LegalSection>

            <LegalSection title="4. Your contributions">
                <LegalList items={[
                    <>You keep whatever rights you have in the content you submit.</>,
                    <>You confirm that you have the right to share it and that it does not infringe anyone else&apos;s rights.</>,
                    <>
                        You grant Fighting Game Theory a free, non-exclusive, worldwide licence to host, store, reproduce, adapt (for
                        example, format, correct or merge with other entries) and publicly display your contributions as part of the site.
                    </>,
                    <>
                        This licence lasts while the contribution is on the site. Deleting your account does not withdraw it for
                        contributions that stay published. Removing your personal data, including your username, is handled separately
                        as described in the Privacy Policy.
                    </>,
                    <>
                        The licence only covers rights that you hold. It does not cover rights belonging to Capcom or to anyone else.
                    </>,
                    <>
                        Do not copy substantial parts of other websites&apos; databases, spreadsheets or guides without their permission.
                    </>,
                ]}/>
            </LegalSection>

            <LegalSection title="5. Moderation">
                <LegalList items={[
                    <>
                        New contributions and edit proposals are reviewed by moderators before publication. Until they are approved, only
                        you and the moderators can see them.
                    </>,
                    <>
                        We may approve, edit, reject, hide or remove content at any time if it breaks these Terms, is inaccurate or does
                        not fit the site. When we reject a contribution, we tell you the reason.
                    </>,
                    <>
                        If we restrict your content or your account, we tell you the reason where we can. If you disagree with a decision,
                        email us with a link to the content and your reasons, and we will review it again.
                    </>,
                ]}/>
            </LegalSection>

            <LegalSection title="6. Reporting content">
                <LegalText>
                    If you believe content on the site is illegal or breaks these Terms, use the report option on that page where
                    available, or email <LegalEmailLink email={LEGAL_CONTACT_EMAIL}/> with a link to the content, why you are reporting
                    it, and your name and email address. We review every report and may remove the content.
                </LegalText>
            </LegalSection>

            <LegalSection title="7. Suspension and account deletion">
                <LegalList items={[
                    <>
                        We may suspend or deactivate accounts that break these Terms, especially for serious or repeated breaches. You can
                        contact us to ask for the reason or to challenge the decision.
                    </>,
                    <>
                        You can stop using the site at any time and request deletion of your account from your Profile page.
                    </>,
                ]}/>
            </LegalSection>

            <LegalSection title="8. Intellectual property and Capcom">
                <LegalText>
                    Fighting Game Theory is an independent, fan-created educational project dedicated to fighting game analysis.
                    Street Fighter and related characters, trademarks, artwork and game assets are the property of Capcom Co., Ltd.
                    and their respective rights holders. This website is not affiliated with, endorsed by, or sponsored by Capcom.
                </LegalText>
                <LegalText>
                    Original analyses, calculations, tools and community contributions remain subject to their respective rights and
                    licences. The site&apos;s source code is published in the FGCNotepad
                    <TextLink href="https://github.com/AntonioCheca/FGCNotepad/">GitHub repository</TextLink> under the
                    GNU Affero General Public License v3.0 only (AGPL-3.0-only). The logo and brand assets are not covered by that
                    licence; see the
                    <TextLink href="https://github.com/AntonioCheca/FGCNotepad/blob/main/NOTICE.md">project notice</TextLink>.
                    If you believe something on the site infringes your rights, report it as described in section 6.
                </LegalText>
            </LegalSection>

            <LegalSection title="9. Availability and accuracy">
                <LegalText>
                    The site is provided free of charge and as it is. We do not guarantee that it will always be available or free of
                    errors, or that frame data, damage values, combos or other information are accurate. Information is provided for
                    educational purposes, so check it in game before relying on it.
                </LegalText>
                <LegalText>
                    Nothing in these Terms excludes or limits any liability that cannot be excluded or limited under applicable law.
                </LegalText>
            </LegalSection>

            <LegalSection title="10. Changes to these Terms">
                <LegalText>
                    We may update these Terms. The date at the top of this page shows the current version. For material changes, we
                    announce them on the site in advance where possible, and you will be asked to accept the new version before you can
                    keep using your account. Editorial corrections that do not change your rights or obligations only update the date.
                </LegalText>
            </LegalSection>

            <LegalSection title="11. Applicable law">
                <LegalText>
                    These Terms are governed by Spanish law. This does not take away any mandatory consumer protection you have under
                    the law of the country where you live.
                </LegalText>
            </LegalSection>

            <LegalSection title="12. Contact">
                <LegalText>
                    For any question about these Terms, email <LegalEmailLink email={LEGAL_CONTACT_EMAIL}/>.
                </LegalText>
            </LegalSection>
        </LegalDocument>
    );
}
