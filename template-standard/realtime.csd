<CsoundSynthesizer>
<CsOptions>
-o dac -m0 --port=10000
</CsOptions>
<CsInstruments>
sr = 44100
ksmps = 64 
0dbfs = 1
nchnls = 2

#include "project.orc"

schedule("Run", 0, -1)

</CsInstruments>

</CsoundSynthesizer>