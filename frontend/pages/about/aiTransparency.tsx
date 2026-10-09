"use client";

// Long hand-edited prose: plain apostrophes and quotes render fine and stay easy to edit.
/* eslint-disable react/no-unescaped-entities */

import {AppContainer} from "@/src/components/ui/AppContainer";
import {NormalList, NormalListItem} from "@/src/components/ui/NormalList";
import {NormalParagraph} from "@/src/components/ui/NormalParagraph";
import {TextLink} from "@/src/components/ui/TextLink";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

export default function AiTransparencyPage() {
    return (
        <AppContainer maxWidth="md" sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3}}}>
            <PageShell title="AI Usage Transparency">
                <SectionCard>
                    <NormalParagraph>
                        Fighting Game Theory is a project I started back in February 2025. It's free, open-source and I
                        have been a one person team for almost two years. I'm a single developer from Spain, and I've
                        been paying for the artwork, infrastructure and development tools myself.
                    </NormalParagraph>

                    <NormalParagraph>
                        I have tried to put limits to AI usage:
                    </NormalParagraph>
                    <NormalList>
                        <NormalListItem>
                            No art was AI generated (logo was commissioned, icons for sidebar and other pages come from
                            MUI library).
                        </NormalListItem>
                        <NormalListItem>
                            No AI usage in any part of the functionality or data management, only for development and
                            code.
                        </NormalListItem>
                        <NormalListItem>
                            Tech stack needed to be what I'm comfortable with, that's why it's Symfony backend + Next.js
                            frontend + Postgresql db, it's simply what I know I can handle (also the start of the
                            project was back in Feb 2025 where I was doing stuff mostly by hand).
                        </NormalListItem>
                        <NormalListItem>
                            I've added a lot of validations in the development process like React Doctor, good coverage
                            on unit tests, good integration tests and mobile accessibility checks to cover some of my
                            weak spots as a developer. I usually work mostly with backend, algorithms and database
                            modelling and transfer, not so much with accessibility or mobile stuff.
                        </NormalListItem>
                    </NormalList>

                    <NormalParagraph>
                        Even after 2 years, the website is still in public Alpha, I still expect some things to break
                        here and there. I have tried to improve both the feel and the security of the project, but this
                        is still my first "big" open-source project so I wanted to ensure some quality before making it
                        public. The code is available and I'd appreciate any feedback or contributions, whether on
                        Discord or in Github. This is also the reason the register is behind a key right now, as some
                        features are not really ready yet.
                    </NormalParagraph>

                    <NormalParagraph>
                        As for environmental impact, I have been paying the 20€ subscription for mostly this
                        entire year, more or less 160€ at the point of writing. My rough estimate, the best I've been
                        able to infer from public reports on this, is that this usage might translate to around
                        20 to 30 days of an average household electricity in Spain. That's around a 5% increase on
                        electricity to my normal usage, compared to not having payed any subscription, in these last 2
                        years.
                        I personally monitor my usage using
                        <TextLink
                            href="https://github.com/jacobjmc/OpenCodeMonitor">
                            ocmonitor (OpenCode Monitor)
                        </TextLink>, and taking into account I've been using Codex 5.3, Codex 5.5, Terra 5.6 and this
                        last month, Sol 6.1 and Opus 5.5. I've generally avoided the most expensive, compute-intensive
                        models, as that increased too much token consumption and this project didn't need that much,
                        beyond being more expensive and unsustainable long term.
                    </NormalParagraph>
                    <NormalParagraph>
                        <strong>Why this note? </strong> AI usage right now is a bit of a jungle. I strongly dislike
                        some of its uses, like indie games being copied in one week and slop filling Steam, or people
                        stealing from artists and making profit of AI-generated images. I also
                        don't mind others like the new rollback mod for USF4. I know some of these are really
                        controversial right now, and I personally advocate for more transparency around how it is used
                        and how much it is being used, so people have more information to be able to support, or not
                        support, a given project easily. This note is my attempt at being as transparent as I can.
                    </NormalParagraph>
                    <NormalParagraph>
                        I take ethical AI usage seriously. I am aware a lot of people think that's an oxymoron. I'm
                        just trying to take responsibility of how I use it, and try to make sure that whatever I do
                        helps people.
                    </NormalParagraph>
                    <NormalParagraph>
                        Thanks for reading, Antonio.
                    </NormalParagraph>
                </SectionCard>
            </PageShell>
        </AppContainer>
    );
}
