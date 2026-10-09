"use client";

import Image from "next/image";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {NormalParagraph} from "@/src/components/ui/NormalParagraph";
import {TextLink} from "@/src/components/ui/TextLink";
import {PageShell} from "@/src/components/ui/tactical/PageShell";
import {SectionCard} from "@/src/components/ui/tactical/SectionCard";

export default function AboutPage() {
    const logoSrc = "/logos/fgt-completo-color-neg.svg";

    return (
        <AppContainer maxWidth="md" sx={{py: {xs: 2.25, md: 3.25}, px: {xs: 1.75, md: 3}}}>
            <PageShell title="About">
                <AppBox sx={{display: "flex", justifyContent: "center", mb: {xs: 0.5, md: 1.5}}}>
                    <Image
                        src={logoSrc}
                        alt="FGC Notepad Logo"
                        width={360}
                        height={160}
                        sizes="(max-width: 600px) 72vw, 360px"
                        style={{width: "min(72vw, 360px)", height: "auto"}}
                        priority
                    />
                </AppBox>

                <SectionCard title="What Is Fighting Game Theory?" tone="raised">

                    <NormalParagraph>
                        <strong>Fighting Game Theory </strong> is an open source platform to break down game theory in
                        fighting
                        games. From analysing risk reward in oki and blockstrings, to help players recognise and
                        memorise
                        errors, helping them with replay watching and with a collective Wikipedia-style combo and
                        scenarios that can be searched and filtered quickly for checking things after a game.
                    </NormalParagraph>
                    <NormalParagraph last>
                        Questions, feedback, or want to contribute? Join our
                        <TextLink href="https://discord.gg/SSQwtSjUeD">Discord server</TextLink>.
                    </NormalParagraph>
                </SectionCard>

                <SectionCard title="Credits And Thanks">

                    <NormalParagraph>
                        Built by <strong>Checa</strong>, software engineer, trying to improve at these games.
                        If you want to contribute to the project, check out the
                        <TextLink href="https://github.com/AntonioCheca/FGCNotepad/">
                            GitHub repository
                        </TextLink> or join our
                        <TextLink href="https://discord.gg/SSQwtSjUeD">Discord server</TextLink>.
                    </NormalParagraph>

                    <NormalParagraph>
                        Logo and color schemes for dark and light mode have been created by Miguel Ángel, spanish
                        designer,
                        you can check his other works in his instagram at
                        <TextLink href="https://www.instagram.com/miguel.type/">
                            @miguel.type
                        </TextLink>.
                    </NormalParagraph>

                    <NormalParagraph>
                        Special thanks to the amazing team behind
                        <TextLink href="https://github.com/D4RKONION/FAT">
                            Frame Assistant Tool (FAT)
                        </TextLink>, whose open-source frame data serves as the foundation of data for the combo
                        database.
                    </NormalParagraph>

                    <NormalParagraph>
                        Thanks to
                        <TextLink href="https://www.youtube.com/user/Shintroy">
                            ThirtyFourEC
                        </TextLink>, whose optimal videos on combos served as a baseline for drive bar value and super
                        bar value for each character for resource-adjusted calculations.
                    </NormalParagraph>

                    <NormalParagraph>
                        Also special thanks to the people at
                        <TextLink href="https://discord.com/servers/new-challenger-195518118603390977">
                            New Challenger discord
                        </TextLink> for being a platform for beginners
                        to learn the games and offering amazing free coaching everyday. Much of what appears
                        here is the workflow I built over years thanks to them and other people in the community.
                        Special thanks to Sestze for the spreadsheets of basic breakdown and combos, that fill this
                        database.
                    </NormalParagraph>
                    <NormalParagraph last>
                        Additional thanks to my friend Niakky for making fighting games a place I feel
                        happy in. Thanks to Cammy Discord and everyone over there for the help, lightheartedness and
                        positive attitude. As well as Broski, Coastguard, Brian_F and Breakfasty from the Akumacord for
                        making incredible educational content for the FGC. You all made me fall in love with the
                        technical side of the game.
                    </NormalParagraph>
                </SectionCard>
            </PageShell>
        </AppContainer>
    );
}
