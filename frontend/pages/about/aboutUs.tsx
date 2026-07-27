"use client";

import Image from "next/image";
import {AppBox} from "@/src/components/ui/AppBox";
import {AppCard} from "@/src/components/ui/AppCard";
import {AppCardContent} from "@/src/components/ui/AppCardContent";
import {AppTypography} from "@/src/components/ui/AppTypography";
import {NormalParagraph} from "@/src/components/ui/NormalParagraph";
import {TextLink} from "@/src/components/ui/TextLink";
import {useMode} from "@/src/context/ThemeContext";

export default function AboutPage() {
    const {mode} = useMode();
    const logoSrc = mode === "light" ? "/logos/fgt-completo-color-pos.svg" : "/logos/fgt-completo-color-neg.svg";

    return (
        <AppBox sx={{maxWidth: 760, mx: "auto", p: 3}}>
            <AppBox sx={{display: "flex", justifyContent: "center", mb: 4}}>
                <Image
                    src={logoSrc}
                    alt="FGC Notepad Logo"
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{width: "50%", height: "auto"}}
                    priority
                />
            </AppBox>

            <AppCard sx={{mb: 3}}>
                <AppCardContent sx={{py: 3}}>
                    <AppTypography variant="h4" component="h1" align="center" sx={{fontWeight: 700, mb: 2}}>
                        What is Fighting Game Theory?
                    </AppTypography>

                    <NormalParagraph last>
                        <strong>Fighting Game Theory </strong> is an open source platform to break down game theory in
                        fighting
                        games. From analysing risk reward in oki and blockstrings, to help players recognise and
                        memorise
                        errors, helping them with replay watching and with a collective Wikipedia-style combo and
                        scenarios that can be searched and filtered quickly for checking things after a game.
                    </NormalParagraph>
                </AppCardContent>
            </AppCard>

            <AppCard sx={{mb: 3}}>
                <AppCardContent sx={{py: 3}}>
                    <AppTypography variant="h5" component="h2" sx={{fontWeight: 600, mb: 2}}>
                        Credits and thanks
                    </AppTypography>

                    <NormalParagraph>
                        Built by <strong>Antonio Checa</strong>, software engineer, trying to improve at these games.
                        If you want to contribute to the project, check out the
                        <TextLink href="https://github.com/AntonioCheca/FGCNotepad/">
                            GitHub repository
                        </TextLink> or join our discord server.
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
                </AppCardContent>
            </AppCard>

            <AppCard>
                <AppCardContent sx={{py: 3}}>
                    <AppTypography variant="h5" component="h2" sx={{fontWeight: 600, mb: 2}}>
                        AI usage transparency note
                    </AppTypography>

                    <NormalParagraph>
                        AI was used for the code, both in backend and frontend. All the images, logos, and
                        anything visual was done either by a person (specifically the logo of the website and color
                        scheme), or taken from an open-source logo library (specifically the logos for sidebar, from
                        MUI).
                    </NormalParagraph>

                    <NormalParagraph>
                        An estimation of energy used for this, in the point of writing, is 120€ which translated into
                        around ~6 days of a normal household electricity usage in Europe, estimation done by some
                        rough estimates in Codex 5.3 - 5.5 models around summer 2026.
                    </NormalParagraph>
                    <NormalParagraph>
                        <strong>Why this note? </strong> I think the law should force companies and individuals to be
                        transparent on
                        AI usage, both for how they use it, and estimate the energy cost of it. This is my attempt
                        at that. I am very open to hear complaints with this note, I do take ethical AI usage seriously.
                    </NormalParagraph>
                    <NormalParagraph>
                        I personally monitor my usage using
                        <TextLink
                            href="https://github.com/jacobjmc/OpenCodeMonitor">
                            ocmonitor (OpenCode Monitor)
                        </TextLink>.
                    </NormalParagraph>
                </AppCardContent>
            </AppCard>
        </AppBox>
    );
}
