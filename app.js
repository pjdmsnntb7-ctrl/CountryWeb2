// VÝCHOZÍ DATA NAPOJENÁ PŘÍMO NA TVOU SLOŽKU PODKLADY S GRAFICKÝMI DLAŽDICEMI
const initialCountries = [
    {
        id: "usa",
        name: "USA",
        tileImg: "Podklady/CountryWebUSA.png", // Tvoje reálná grafická dlaždice 600x600
        mainText: "Spojené státy americké. Prozkoumej úchvatná místa, divokou přírodu i velkoměsta na autorských fotografiích.",
        photos: [
            { img: "Podklady/IMG_0896.jpeg", desc: "Pohled na krajinu a cestu" },
            { img: "Podklady/IMG_0960.jpeg", desc: "Americká příroda státu Montana" },
            { img: "Podklady/IMG_1052.jpeg", desc: "Městská architektura a ulice" },
            { img: "Podklady/IMG_1274.jpeg", desc: "Interiér / detailní pohled na výšku" }
        ]
    },
    {
        id: "nemecko",
        name: "Německo",
        tileImg: "Podklady/CountryWebDE.png", // Tvoje reálná grafická dlaždice 600x600
        mainText: "Spolková republika Německo. Zatím zde nejsou nahrané žádné fotografie.",
        photos: []
    },
    {
        id: "velka-britanie",
        name: "Velká Británie",
        tileImg: "Podklady/CountryWebENG.png", // Tvoje reálná grafická dlaždice 600x600
        mainText: "Velká Británie a Severní Irsko. Čeká na nahrání fotografií.",
        photos: []
    }
];

let appState = { 
    countries: [],
    currentCountry: null,
    currentPhotoIndex: 0
};

function initApp() {
    const savedData = localStorage.getItem('amos_gallery_data');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Reset starých pokusů (poznáme podle přítomnosti starého klíče code místo tileImg)
        const hasOldData = parsedData.some(c => c.id === 'italie' || c.code);
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
    setupArrowNavigation();
}

function renderCountriesGrid() {
    const grid = document.getElementById('countries-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    appState.countries.forEach(country => {
        const tile = document.createElement('div');
        tile.className = 'country-tile-img-box';
        
        const img = document.createElement('img');
        img.src = country.tileImg || 'https://picsum.photos/600/600?random=99';
        tile.appendChild(img);
        
        tile.addEventListener('click', () => openCountryDetail(country.id));
        grid.appendChild(tile);
    });
}

function openCountryDetail(countryId) {
    const country = appState.countries.find(c => c.id === countryId);
    if (!country) return;

    appState.currentCountry = country;
    appState.currentPhotoIndex = 0;

    document.getElementById('country-title').textContent = country.name;
    document.getElementById('main-country-desc').textContent = country.mainText;

    const prevBtn = document.getElementById('prev-photo-btn');
    const nextBtn = document.getElementById('next-photo-btn');

    if (country.photos.length === 0) {
        document.getElementById('main-display-img').style.display = 'none';
        document.getElementById('main-display-caption').textContent = 'Zatím zde nejsou žádné fotografie. Přidejte je přes administraci.';
        document.getElementById('thumbnails-container').innerHTML = '<div style="font-weight:700; color:#64748b; padding-top:10px;">Žádné fotky k zobrazení</div>';
        if(prevBtn) prevBtn.style.display = 'none';
        if(nextBtn) nextBtn.style.display = 'none';
    } else {
        document.getElementById('main-display-img').style.display = 'block';
        if(prevBtn) prevBtn.style.display = 'flex';
        if(nextBtn) nextBtn.style.display = 'flex';
        
        updateMainPhotoDisplay();
        renderThumbnails();
    }
    switchView('detail-view');
}

function updateMainPhotoDisplay() {
    const country = appState.currentCountry;
    const index = appState.currentPhotoIndex;
    if (!country || !country.photos[index]) return;
    
    document.getElementById('main-display-img').src = country.photos[index].img;
    document.getElementById('main-display-caption').textContent = country.photos[index].desc;
    
    document.querySelectorAll('.thumb-item').forEach((thumb, tIndex) => {
        if (tIndex === index) {
            thumb.classList.add('active');
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            thumb.classList.remove('active');
        }
    });
}

function renderThumbnails() {
    const thumbContainer = document.getElementById('thumbnails-container');
    thumbContainer.innerHTML = '';
    
    appState.currentCountry.photos.forEach((photo, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${index === appState.currentPhotoIndex ? 'active' : ''}`;
        
        const img = document.createElement('img');
        img.src = photo.img;
        thumb.appendChild(img);
        
        thumb.addEventListener('click', () => {
            appState.currentPhotoIndex = index;
            updateMainPhotoDisplay();
        });
        
        thumbContainer.appendChild(thumb);
    });
}

function setupArrowNavigation() {
    const prevBtn = document.getElementById('prev-photo-btn');
    const nextBtn = document.getElementById('next-photo-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const country = appState.currentCountry;
            if (!country || country.photos.length <= 1) return;
            appState.currentPhotoIndex = (appState.currentPhotoIndex === 0) ? country.photos.length - 1 : appState.currentPhotoIndex - 1;
            updateMainPhotoDisplay();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const country = appState.currentCountry;
            if (!country || country.photos.length <= 1) return;
            appState.currentPhotoIndex = (appState.currentPhotoIndex === country.photos.length - 1) ? 0 : appState.currentPhotoIndex + 1;
            updateMainPhotoDisplay();
        });
    }
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

if (document.getElementById('back-btn')) {
    document.getElementById('back-btn').addEventListener('click', () => switchView('home-view'));
}

window.onload = initApp;
