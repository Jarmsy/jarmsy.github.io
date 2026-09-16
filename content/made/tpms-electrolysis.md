---
title: A better sponge for splitting water
summary: My senior design project — designing lattice geometries for the porous layer inside a hydrogen electrolyzer, and simulating how water gets in and oxygen gets out.
date: 2026-05-01
period: Spring 2026
org: UW–Madison, ME 352 senior design with the HERD Lab
role: Led the modeling and simulation
tools: [nTop, ANSYS Fluent, a custom C UDF, SpaceClaim]
outcome: The best lidinoid lattice let water through 3.7× more easily than the gyroid baseline, with 70% lower inlet pressure and 17% less oxygen trapped at the catalyst.
# cover: ./tpms-electrolysis.png   # save the results figure next to this file with that name, then remove the leading #
topics: [engineering, energy, simulation]
featured: true
---

<!-- Draft written from your handoff guide. Things to check: teammates and advisor
     you'd want to name, whether the geometries were designed in nTop (the guide
     says so), and the two "why" sentences in the first section. -->

A PEM electrolyzer splits water into hydrogen and oxygen with electricity. Between the electrode where the reaction happens and the channel that feeds it sits a thin porous layer — the *porous transport layer*, or PTL — that has to do two things at once: let water in, and let the oxygen bubbles that form at the electrode get out. If the bubbles can't leave, they sit on the catalyst and block the water, and the whole thing gets less efficient the harder you push it.

The question our senior design team took on: can you design that sponge instead of just using whatever sintered metal comes off the shelf?

## What we made

We built the PTL out of *triply periodic minimal surfaces* — TPMS lattices, the kind of smooth, self-supporting geometry you can 3D-print but not machine. The baseline was a gyroid (called G10 in our runs). Against it we designed a family of **lidinoid** lattices at different unit-cell sizes, and then simulated all of them in ANSYS Fluent two ways:

1. **Single-phase**: push water through slowly enough that the flow is purely viscous, measure the pressure drop, and back out the Darcy permeability and the *tortuosity* — how much longer the actual path through the pores is than a straight line.
2. **Two-phase**: add the electrochemistry. I wrote a small C function that injects oxygen into a 50-micron band at the electrode face at the rate Faraday's law says it should for 10,000 A/m², and consumes water to match. Then watch where the gas goes.

Every lidinoid beat the gyroid. The best one, at a 2.21 mm unit cell, had **3.7× the permeability** of the baseline, because its tortuosity was 24–35% lower — the pores run more directly through the plane. In two-phase, the same geometry showed **70% lower inlet pressure** and **17% less oxygen** sitting in the catalyst zone, with a more even pressure gradient from bottom to top.

One honest footnote: the lidinoids are also more porous (39% vs 23%), so some of the gain is simply more hole. The interesting result is that even per unit of porosity they win, and that the cheap single-phase simulation predicted the ranking of the expensive two-phase one every time.

## What actually happened

The numbers above are the clean version. The semester was mostly the unclean version.

- **We overestimated permeability by a factor of a thousand** for weeks. Fluent reports mass flow in kg/s; Darcy's law wants volume flow in m³/s; water's density is 1000. One missing division, every lidinoid result wrong by exactly the same factor, and nothing in the software says a word.
- **Fluent will tell you it has converged after one iteration** if the starting residuals happen to be below its threshold. We learned to ignore the "Converged" message and check that mass in equalled mass out to within 0.01%.
- **The metric we planned to compare on was meaningless.** "Oxygen escape efficiency" — gas out over gas generated — is ~100% for *any* converged solution, because that's what conservation of mass means. It can't distinguish a good PTL from a bad one. We switched to local saturation and pressure.
- **The fluid domain was named `..._solid`**, because the geometry tool names the void after the thing it was subtracted from. Trusting labels instead of looking at the mesh cost a day.
- **The GUI silently discarded our source terms** after switching multiphase models. The function was compiled, loaded, and connected to nothing. Assigning through the text interface instead was the only fix.

Every one of those is a systems-made-of-people failure: the software was doing exactly what it was designed to do, and the design assumed an operator who already knew the trap.

## What it taught me

So the last thing I made for the project wasn't a geometry. It was a handoff guide — every trap above, the exact commands to avoid it, the reference numbers a future student can check their first run against. Whoever picks this up next in the lab shouldn't have to lose the weeks we lost.

That instinct — that the result isn't done until the next person can reproduce it — turned out to matter more to me than the 3.7×.
