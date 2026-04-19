# Vizualizacija 3D konveksnog omotača

Interaktivna web aplikacija za vizualizaciju algoritama za određivanje konveksnog omotača u trodimenzionalnom prostoru. Razvijena kao dio magistarskog rada na Odsjeku za matematičke i kompjuterske nauke.

## Implementirani algoritmi

- **Gift Wrapping** — gradi omotač ivicu po ivicu, izlazno-osjetljiv algoritam
- **Inkrementalni algoritam** — dodaje tačke jednu po jednu uz ažuriranje horizonta
- **QuickHull 3D** — koristi strategiju "podijeli pa vladaj" uz rano odbacivanje unutrašnjih tačaka

## Zahtjevi

- [Node.js](https://nodejs.org/) verzija **18 ili novija**

## Pokretanje

```bash
# 1. Uđi u folder projekta
cd convex-hull-3d

# 2. Instaliraj zavisnosti
npm install

# 3. Pokreni razvojni server
npm run dev
```

Nakon pokretanja, otvori preglednik na adresi prikazanoj u terminalu (podrazumijevano `http://localhost:5173`).

## Korištenje aplikacije

1. **Odaberi algoritam** klikom na jedno od tri dugmeta u lijevoj traci
2. **Podesi broj tačaka** klizačem (od 6 do 40)
3. **Klikni "Generiši tačke"** — aplikacija automatski pokreće odabrani algoritam
4. **Prolazi kroz korake** ručno (dugmad ← →) ili automatski (Play/Pauza)
5. **Podesi brzinu** animacije klizačem (200 ms – 2000 ms po koraku)
6. Za direktno poređenje algoritama, odaberi drugi algoritam bez ponovnog generisanja tačaka

### Vizualne konvencije

| Boja | Značenje |
|------|----------|
| Narandžasta sfera | Aktivna tačka (trenutno se dodaje) |
| Zelena sfera | Tjeme konveksnog omotača |
| Plava sfera | Tačka unutar omotača |
| Crvena ploha | Vidljiva ploha iz aktivne tačke |
| Narandžasta linija | Horizont |
| Plava ploha | Izgrađeni omotač |

### Upravljanje pogledom

| Akcija | Rezultat |
|--------|----------|
| Lijevi klik + povlačenje | Rotacija scene |
| Desni klik + povlačenje | Pomicanje scene |
| Kotač miša | Zum |

## Build za produkciju

```bash
npm run build
```

Rezultat se nalazi u folderu `dist/` i može se servirati bilo kojim statičkim web serverom.

## Tehnologije

- [React 19](https://react.dev/)
- [Three.js 0.183](https://threejs.org/)
- [Vite 8](https://vitejs.dev/)
