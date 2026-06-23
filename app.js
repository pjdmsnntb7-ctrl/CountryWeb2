function getFlagEmoji(countryCode) {
    if (!countryCode) return "🏳️";
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

const initialCountries = [
    {
        id: "usa",
        name: "USA",
        code: "US",
        mainText: "Spojené státy americké. Prozkoumej úchvatná místa, divokou přírodu i velkoměsta na autorských fotografiích.",
        photos: [
            { img: "Podklady/IMG_0896.jpeg", desc: "Pohled na krajinu a cestu" },
            { img: "Podklady/IMG_0960.jpeg", desc: "Americká příroda státu Montana" },
            { img: "Podklady/IMG_1052.jpeg", desc: "Městská architektura a ulice" },
            { img: "Podklady/IMG_1274.jpeg", desc: "Interiér / detailní pohled na výšku" }
        ]
    },
    { id: "cesko", name: "Česká republika", code: "CZ", mainText: "Česká republika je srdcem Evropy. Zatím zde nejsou nahrané žádné fotografie.", photos: [] },
    { id: "kanada", name: "Kanada", code: "CA", mainText: "Kanada je země javorového listu, rozlehlých lesů a ledovcových jezer. Čeká na nahrání fotografií.", photos: [] }
];

let appState = { countries: [] };

function initApp() {
    const savedData = localStorage.getItem('amos_gallery_data');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        const hasOldData = parsedData.some(c => c.id === 'italie' || !c.code);
        if (hasOldData) {
            appState.countries = initialCountries;
            localStorage.setItem('amos_gallery_data', JSON.stringify(initialCountries));
        } else {
            appState.countries = parsedData;
        }
    } else {
        appState.countries = initialCountries;
        localStorage.setItem('amos_gallery_data', JSON.stringify(initialCountries));
    }
    renderCountriesGrid();
}

function renderCountriesGrid() {
    const grid = document.getElementById('countries-grid');
    if (!grid) return;
    grid.innerHTML = '';
    appState.countries.forEach(country => {
        const tile = document.createElement('div');
        tile.className = 'country-tile-emoji';
        tile.textContent = getFlagEmoji(country.code);
        tile.addEventListener('click', () => openCountryDetail(country.id));
        grid.appendChild(tile);
    });
}

// KLÍČOVÁ ZMĚNA: Načtení jedné fotky a vygenerování pásu ovladačů
function openCountryDetail(countryId) {
    const country = appState.countries.find(c => c.id === countryId);
    if (!country) return;

    document.getElementById('country-title').textContent = country.name;
    document.getElementById('main-country-desc').textContent = country.mainText;

    const mainImg = document.getElementById('main-display-img');
    const mainCaption = document.getElementById('main-display-caption');
    const thumbContainer = document.getElementById('thumbnails-container');
    
    thumbContainer.innerHTML = '';

    if (country.photos.length === 0) {
        mainImg.src = '';
        mainImg.style.display = 'none';
        mainCaption.textContent = 'Zatím zde nejsou žádné fotografie. Přidejte je přes administraci.';
        thumbContainer.innerHTML = '<div style="font-weight:700; color:#64748b;">Žádné miniatury k zobrazení</div>';
    } else {
        mainImg.style.display = 'block';
        
        // Nastavíme jako první zobrazenou fotku tu nultou v pořadí
        mainImg.src = country.photos[0].img;
        mainCaption.textContent = country.photos[0].desc;

        // Vygenerujeme horizontální pás miniatur pod ní
        country.photos.forEach((photo, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumb-item ${index === 0 ? 'active' : ''}`;
            
            const img = document.createElement('img');
            img.src = photo.img;
            
            thumb.appendChild(img);
            
            // Kliknutí změní velkou zobrazenou fotku na středu
            thumb.addEventListener('click', () => {
                document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                
                mainImg.src = photo.img;
                mainCaption.textContent = photo.desc;
            });
            
            thumbContainer.appendChild(thumb);
        });
    }
    switchView('detail-view');
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

if (document.getElementById('back-btn')) {
    document.getElementById('back-btn').addEventListener('click', () => switchView('home-view'));
}

window.onload = initApp;