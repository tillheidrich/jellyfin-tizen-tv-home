import numpy as np, wave
sr=44100; T=3.7; t=np.arange(int(sr*T))/sr; out=np.zeros_like(t)
def env(t0,a,d,dur):
    e=np.zeros_like(t); x=t-t0
    m=(x>=0)&(x<a); e[m]=x[m]/a
    m=(x>=a); e[m]=np.exp(-(x[m]-a)/d)
    e[t>t0+dur]*=np.exp(-(t[t>t0+dur]-(t0+dur))/0.15)
    return e
# 1) Aufsteigender Luftzug zum Dach (0.1-0.9s): gefiltertes Rauschen
rng=np.random.default_rng(7); n=rng.standard_normal(len(t))
k=np.exp(-np.linspace(0,6,400)); n=np.convolve(n,k/k.sum(),'same')
sw=np.clip((t-0.1)/0.8,0,1)**2*(t<0.95)*np.exp(-np.clip(t-0.85,0,None)*20)
out+=0.25*n*sw*8
# 2) Weicher, tiefer Puls beim F (0.72s)
x=t-0.72; m=x>=0
f=55*np.exp(-x*3)+40
ph=np.cumsum(2*np.pi*f/sr)
out+=0.9*np.sin(ph)*np.where(m,np.exp(-np.clip(x,0,None)*4.5),0)*np.clip(x*80,0,1)
# 3) Warmer Akkord blüht mit dem Schriftzug auf (ab 1.75s): D-Dur add9
freqs=[73.42,110.0,146.83,185.0,220.0,329.63]
for i,fr in enumerate(freqs):
    a=env(1.75+i*0.04,0.5,1.6,1.5)
    out+=0.11*a*(np.sin(2*np.pi*fr*t)+0.3*np.sin(2*np.pi*fr*2.003*t)+0.12*np.sin(2*np.pi*fr*3*t))
# 4) Glitzern zum Lichtstreifen (2.05-3.0s): hohe Glöckchen
for i,fr in enumerate([1174.66,1479.98,1760.0,2349.32,2959.96]):
    a=env(2.05+i*0.11,0.005,0.35,0.6)
    out+=0.045*a*np.sin(2*np.pi*fr*t)*(1+0.3*np.sin(2*np.pi*5*t))
# Ausblenden mit der Schwarzblende
out*=np.clip((3.7-t)/0.45,0,1)
# leichter Hall
d=int(0.09*sr); r=np.zeros_like(out)
for j,g in enumerate([0.35,0.22,0.14,0.08]): r[d*(j+1):]+=g*out[:-d*(j+1)]
out=out+r
out=np.tanh(out*1.1); out=out/np.abs(out).max()*0.7
st=np.stack([out,np.roll(out,int(0.012*sr))],1)
w=wave.open('intro.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
