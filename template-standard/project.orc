#include "@kunstmusik/libsyi/ringmod.udo"

ga1 init 0
ga2 init 0

opcode db, i, i
  idb xin
  xout ampdbfs(idb)
endop

instr Test
    asig = vco2(p5, p4)
    asig += vco2(p5 * db(-12), p4 * 2)
    asig *= 0.75

    asig = zdf_ladder(asig, cpsoct(linseg(14, .1, 10, 2, 5, 1, 5)), 2)

    asig = ringmod(asig, oscili(0.25, p4 * 1.5) + oscili(0.25, p4 * 2.25))

    asig *= expsegr:a(0.001, .005, 1, .75, 0.001, .75, 0.001)

    out(asig, asig)
    awet = asig * db(-24)
    ga1 += awet 
    ga2 += awet 
endin

;; Simple reverb bus
instr Mixer
    a1, a2 reverbsc ga1, ga2, 0.9, 18000, sr, 0.5
    out(a1,a2)
    clear(ga1, ga2)
endin

schedule("Mixer", 0, -1)

;; Test algorithmic score generation
instr Run
    ipch = (p4 >> (p4 % 3)) % 11
    idur = floor(random:i(1, 4)) * .25
    schedule("Test", 0, idur, cpsmidinn(ipch + 60), db(-12))
    schedule("Test", 0, idur, cpsmidinn(ipch + 64), db(-12))
    schedule("Test", 0, idur, cpsmidinn(ipch + 67), db(-12))

    if (p3 < 0 || p3 - idur > 0) then
        schedule(p1, idur, p3 < 0 ? p3 : p3 - idur, p4 + 1)
    endif
    
endin


