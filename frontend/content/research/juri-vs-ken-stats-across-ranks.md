---
title: "Deep dive at Juri vs Ken stats across ranks"
description: "How the matchup changes from Iron to Ultimate Master: trends on combos, jumps, punishes, damage left behind and oki."
date: 2026-10-31
author: Checa
tags: [ SF6, Juri, Ken ]
draft: true
---

The data is hundreds of Juri vs Ken matches with both players on Classic
controls. I split them into five rank groups: Iron-Silver, Gold-Diamond, Master,
High/Grand Master (H/GM) and Ultimate Master and up (UM+). Most of the data
comes from UM+ though, as I needed more data from them to have a good baseline.

Why Juri vs Ken? I just needed one fixed matchup to gather data. If I changed
characters, some of the stats like how much you jump per round or what normals
people use start getting noise, because of course you're going to jump more
if the matchup requires it. I needed to fix as many variables as I could.
Juri and Ken are popular in all ranks, which helped to gather data, and they are
also relatively simple characters. My knowledge on them is quite low, I haven't
played any of them, and I'm a 1500MR player, so I come to this analysis as an
'external scientist', and not so much as a player.

Huge thanks to Juri discord and Ken discord for helping me solve my doubts and
questions regarding specific statistics and choices from UM+ that I couldn't
understand properly from the get-go.

## How gameplay changes across ranks

I will define stuff you are already familiar with in these boxes by the
mathematical definition I used in the analysis (which may be very different
from the actual concept, but I needed to draw the line somewhere).

> *Combo*: Any sequence of hits that is 2
> moves or more, the entire sequence dealing damage. This means 'dumb stuff' like
> 2lp, 2lp does count as a combo for this report.

Combos are easy to measure and track, so I started there. I expected to see
a big difference on combos between high ranks and lower ranks. Specifically,
I expected more damage in high rank, less interactions to finish the round,
and possibly more amount of combos in lower ranks.

I was very surprised to see that we have more combos in UM+ than in Iron-Silver,
and also the difference in damage is about 30% in average. There is also the
trivial concept that people that lose simply do less combos than the person
winning the round, around 2 less combos in average.

![Combos per match and mean combo damage for Juri by rank, split by won and lost matches](figures/combos-by-rank.png)

In retrospect, the amount of average damage can be explained through different
reasons: UM+ do triple the amount of light combos than lower ranks; they also
do more heavies. This means they deal way more damage across all the starters,
an even with triple the amount of lights, they still gain a 30% in general.

Now, jumps. The following image shows one dot per player recorded, depending on
rank and the amount of jumps they did per round. We can see a noticeable trend
that people in higher ranks jump way less than in lower ranks, which was to
expect. I also tracked specifically the 'jumpiest' character in each rank.

![Jumps per round for each player, grouped by rank](figures/jumps-per-player.png)

It's funny to see that, yes, there are very 'jumpy' players in all ranks, but
the jumpiest players all behave more or less the same relative to their peers:
they jump 3x more per round than the average on their rank. When HM, GM or UM+
talk about 'jump maniacs', note that their maniacs still jump less than the
average in lowest ranks.

On jumps, I wanted also to measure Juri's dive kick, as it changes a bit the
risk reward of the jumps. That said, this graph would probably look very
different in characters like Cammy or Akuma. On Juri, we see simply a sharp
decline on usage. Also to note, the consequences of said dive kick remain
largely the same across ranks, there wasn't much of a change on if the dive
kick hit or got blocked.

![Juri's dive kicks per round by rank, falling from 1.70 at Iron-Silver to 0.18 at Ultimate Master+](figures/dive-kicks.png)

Regarding what happens with jumps, as one would expect, we see a sharp increase
of anti-airs in higher ranks, from 3-10% to a 25% in UM+. Iron-Silver is the
only window of ranks where people still are learning to block jumps, otherwise
the block/hit remains largely the same in the other ranks, with a small increase
of hits in UM+, I assume it's because people manage to use their jumps at better
times. The amount of cross-ups also doubles from lower ranks to higher ranks.

![Stacked bars by rank for Juri and Ken: share of jump-ins that hit, crossed up, were blocked, were anti-aired, or whiffed or traded](figures/jump-in-overview.png)

Successful anti-airs on Juri: First thing to notice is the trend to use more
623MP when we increase in ranks. Favouring DP over normal moves is also
something I expected from higher ranks before I did the graph.

![Which moves Juri uses to anti-air, by rank](figures/anti-air-moves-juri.png)

What surprised me the most was the high use of 2mp as an anti-air in all ranks,
including UM+. It surprised me until I saw the
hitbox.

![Drawing of Juri's 2MP: her outline with the arm reaching up and forward, and the hitbox in red at the end of it](figures/juri-2mp-hitbox.png "Reason why Juri's 2MP works as an anti-air, drawing by yours truly")

Successful anti-airs on Ken: These are easier to explain, Kens use more 623LP,
I assume it's simply because of the lower startup making them a more reliable
and consistent option. If you're curious about the 5lp usage as anti-air, most
of those hits came from close cross-ups. They weren't an execution error, they
were deliberate jabs hitting the back of Juri in those instances.

![Which moves Ken uses to anti-air, by rank](figures/anti-air-moves-ken.png)

On the topic of Drive Impact usage, not much to discuss, very sharp decline on
higher ranks. The percentages are over the total amount of moves done in the
round in neutral.

![Neutral Drive Impacts as a share of neutral choices, by rank, one line each for Juri and Ken: both start above 8% at Iron-Silver and end near 1% or below at Ultimate Master+](figures/drive-impact-share.png)

Oh, by the way, I need to define Neutral here:

> *Neutral*: A moment in the match where both characters are in the ground,
> none is waking up and none is in recovery from a previous move. I did not want
> whiff punishes to add 'noise' in the neutral data.

Now that we have this, let's look at what moves in 'Neutral' we see underused
or overused by lower rank players, compared with UM+:

![Juri's neutral move shares by rank, with one panel per move](figures/neutral-moves-juri.png)

Sweep is expected here. Unsafe move on block, not much to discuss why it's less
used in UM+. This is also one of the top overused moves for Kens in lower ranks
as well.

Juri's 214LK though is a bit more interesting. The way I interpret the data is
that in higher ranks, you're not getting a stock for free that easily, or if you
do, it's not worth it because of the space you are giving up. In lower ranks
though, Juri seems to be free to gain stocks, and in my experience they have the
gameplan of 'backdash, stock up, fireball drive rush' as long as you let her
take that space unpunished. From more than 15% in Masters to 5% in UM+ the 
decline is very sharp.

The increase usage on 2mk is probably because of it being the party starter with
DRC, and lower ranks take less advantage of this than they should. As for 5hp,
UM+ hitconfirm it a 50% of the time, while Masters hitconfirm it 15% of the
time. Diamonds and lower don't ever try to hitconfirm it. Which makes sense, 
you have lower hanging fruit at that time. But it also means the move gets
substantially better once you cross that barrier.


Ken neutral underused and overused moves in lower ranks:

![Ken's neutral move shares by rank, with one panel per move](figures/neutral-moves-ken.png)

Similar story on sweep and 5hp. As for the OD Fireball, my interpretation is
that Kens realise it's not an efficient usage of drive. 

As for 5lk, most shotos will have this trend in my opinion. Fast 5lk's are used
to poke in neutral, or counter hit opponents that try to poke with their longer
buttons. It's also a safe button to use, very non-commital and allowing you to
poke without the risk of being whiff punished. This means in lower ranks, 
where opponents stay in the ground less, you don't see them poking that much,
and you don't have the risk of being whiff punished on slower buttons, 5lk seems
less useful.

Regarding what happens with moves in general, one would expect higher rank
players block more, parry more and whiff less. And that's exactly what we see
here:

![Share of moves that hit, were blocked, met a Drive Parry or whiffed, by rank](figures/outcome-mix.png)

Regarding punishing blocked moves, most of the data points to consistent
punishes across the ranks on very unsafe buttons. -7 or worse are answered
properly, especially in UM+. There is a stark difference with moves in the -4 
to -6 rank. 

This graph shows what happens on those cases. Most of these come specifically
from Juri's 214MK (blocked) and Ken's 5mk (blocked). These are moves that can
be punished, but they are trickier because of the timing or the spacing. Juri
214MK has tricky spacing, and most of UMs reacted properly except when the move
was exactly at 0.1 range near the edge of their punish. They still punish 
appropriately a 40% of the time in these cases, missing a 60% of possible 
punishes and also having some issues with trying to punish, being too far away 
by that 0.1 range and whiffing.

![Ultimate Master+ blocks at -4 to -6 by spacing, in two panels: punishes inside the punish's reach and punish-button whiffs past it, then unpunished blocks climbing steeply into the reach](figures/punish-focus.png)

## Missed kills

Moving from statistics to a bit of analysis. Let's try to measure missed kills.
First, a definition:

> *Missed kill*: You hit a starter sequence that was hitconfirmable (either two
lights or a medium that you could link from or hitconfirm to DRC). Then you 
routed and did a specific sequence that did not kill. 
> 
> I compare your sequence with every other sequence seen by all the UM+ in this 
analysis. If you were on your winning round, I compare your sequence that have
the same starter, spacing and corner conditions and search any that could have
killed even using supers. If there is any, it's a missed kill.
> 
> If you were not in your winning round, then I compare your sequence to all 
sequences that used the same super meter than you did, or lower. If any of them 
killed, it's a missed kill.

That defined, let's try to see the stats on kills taken: as expected, monotone
increasing. The higher the rank, the less kills we miss. Even on higher ranks
we see some missed kills. Most of the missed kills in UM+ were very close
between killing and not killing, so we come again at the same 0.1 range in
spacing problem. If you risk going into burnout for measuring badly a 100 life
difference in the health bar, it's reasonable that even UM+ leave some kills
in the table. 

There is a sharp decline on Master on Ken compared to that of Juris', but I
think that may be a bit of noise in the data more than something to draw
conclusions from. That said, it's possible Ken has harder to confirm routes
that affect Masters being affected the most.

![Share of kill chances taken by Juri and Ken, by rank](figures/kills-taken.png)

Another surprise in this graph was how low the amount of missed kills is in 
very low ranks like Iron-Silver. I believe this comes from the way we defined
missed kills. If they don't even start the combos with the appropriate starter,
we won't see their missed kills here.

## Oki

First, some stats on how oki answers change across ranks:

![Block, wake-up throw, shimmy and delay tech shares by rank after Juri's 214MK knockdown](figures/oki-options-by-rank.png)

We block, delay tech and shimmy way more in higher ranks than in lower ranks,
which is completely expected. Wake up throw is one of the few options that 
appears in lower ranks that disappears in higher ranks, likely because they
still don't know how to delay tech but they want to stop getting thrown. 

Delay tech being so low in Masters was a surprise to me, as I thought it would
be way more prevalent. So I did another player-specific study to check if the
average could be affected by some people never doing tech. And it seems that 
may be the case, the difference between the person that delays tech the most
and the least in each rank window is pretty large. A lot of players sit on
never delay teching, so the average gets lowered by them.

![Delay tech as a share of wake-ups by rank, one dot per player with at least 8 wake-ups and a bold line for the rank's average: most Masters sit at 0%, while High/Grand Master and Ultimate Master dots spread out](figures/delay-tech-per-player.png)


[Explain here RPS mathematically]

To build it, I list each side's options and estimate what each pair is worth. A
shimmy against a delay tech is a big punish, a shimmy against someone patiently
blocking is worth about nothing, and a meaty can be a combo, keep pressure on
block or lose to a reversal.

[Review: put the matrix screenshot from the Oki page here, plus the link to the interactive scenario. I don't have the production URL and won't guess it.]

The website lets you play with this yourself and see how Drive and Super change
the options and payoffs. For a readable comparison here, I use one fixed setup:
raw damage, at the gauges UM+ players typically had in each oki. So the numbers
in that screenshot won't match the table below: the page includes meter gained
and spent, and the table doesn't. Then we can compare the solved mix with what
UMs really did.

## Conclusions

What I enjoyed the most was the investigating. A weird number would show up,
lead to another question, and I'd end up asking people in Discord or checking
replays to understand it. Sometimes the answer was simple, sometimes it stayed
unclear, and sometimes I found out I was asking the wrong question.

More than anything, I hope this kind of analysis helps people learn these games.
There's so much to figure out when you start a character: what to press, how to
convert, where to stand, what's worth practicing first. Better evidence about
what players do and where they struggle can make that easier, at every level,
since even UMs clearly still have things to work on.

I'd like to keep doing this. A lot of the work on combos, anti-airs, neutral and
oki can be reused for other characters and matchups, and many of these combos
and oki situations are already on the site for you to explore. Thanks for
reading, and if you find something weird in here, please tell me. I'd love to
know.

[Add the discord link here]
