"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import {AppCardContent} from "@/src/components/ui/AppCardContent";
import {AppCard} from "@/src/components/ui/AppCard";

export default function AboutPage() {
    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-center mb-8">
                <Image
                    src="/logos/fgt-completo-color-pos.svg"
                    alt="FGC Notepad Logo"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-1/2 h-auto"
                    priority
                />
            </div>

            <AppCard className="mb-6 shadow-md">
                <AppCardContent className="py-6">
                    <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">What is FGC Notepad?</h1>
                    <p className="text-gray-700 leading-relaxed">
                        <strong>FGC Notepad</strong> is an open source project, a platform to analyze, discuss, and
                        break down matches in fighting games. Whether you&apos;re recording combos, referencing frame data,
                        or sharing match insights, the goal is to offer a clean, interactive, and efficient experience
                        for players and analysts alike.
                    </p>
                </AppCardContent>
            </AppCard>

            <AppCard className="shadow-md">
                <AppCardContent className="py-6">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-800">Who built this?</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Built by <strong>Antonio Checa</strong>, an FGC enthusiast and software engineer.
                        If you want to contribute to the project, check out the{" "}
                        <Link
                            href="https://github.com/AntonioCheca/FGCNotepad/"
                            target="_blank"
                            className="text-blue-600 underline hover:text-blue-800"
                        >
                            GitHub repository
                        </Link>
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Special thanks to the amazing team behind{" "}
                        <Link
                            href="https://github.com/D4RKONION/FAT"
                            target="_blank"
                            className="text-blue-600 underline hover:text-blue-800"
                        >
                            Frame Assistant Tool (FAT)
                        </Link>
                        , whose open-source frame data powers much of what FGC Notepad does today.
                    </p>
                </AppCardContent>
            </AppCard>
        </div>
    );
}
