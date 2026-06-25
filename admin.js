let adminState = { countries: [] };
let uploadedPhotosTemp = [];
let uploadedTileTemp = null; // Držitel nahrané dlaždice

const initialCountriesBackup = [
    {
        id: "usa",
        name: "USA",
        tileImg: "Podklady/CountryWebUSA.png",
        mainText: "Spojené státy americké. Prozkoumej úchvatná místa, divokou přírodu i velkoměsta na autorských fotografiích.",
        photos: [
            { img: "Podklady/IMG_0896.jpeg", desc: "Pohled na krajinu a cestu" },
            { img: "Podklady/IMG_0960.jpeg", desc: "Americká příroda státu Montana" },
            { img: "Podklady/IMG_1052.jpeg", desc: "Městská architektura a ulice" },
            { img: "Podklady/IMG_1274.jpeg", desc: "Interiér / detailní pohled na výšku" }
        ]
    },
    { id: "nemecko", name: "Německo", tileImg: "Podklady/CountryWebDE.png", mainText: "Spolková republika Německo. Zatím zde nejsou nahrané žádné fotografie.", photos: [] },
    { id: "velka-britanie", name: "Velká Británie", tileImg: "Podklady/CountryWebENG.png", mainText: "Velká Británie a Severní Irsko. Čeká na nahrání fotografií.", photos: [] }
];

document.getElementById('admin-login-btn').addEventListener('click', () => {
    const pwd = document.getElementById('admin-password-input').value;
    if (pwd === 'admin_Amos2026') {
        document.getElementById('admin-auth-page').classList.add('hidden');
        document.getElementById('admin-dashboard-page').classList.remove('hidden');
        loadAdminData();
        setupDragAndDrop();
    } else {
        alert('Nesprávné heslo administrátora!');
    }
});

function loadAdminData() {
    const savedData = localStorage.getItem('amos_gallery_data');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        const hasOldData = parsedData.some(c => c.id === 'italie' || c.code);
        if (hasOldData) {
            adminState.countries = initialCountriesBackup;
            localStorage.setItem('amos_gallery_data', JSON.stringify(initialCountriesBackup));
        } else {
            adminState.countries = parsedData;
        }
    } else {
        adminState.countries = initialCountriesBackup;
        localStorage.setItem('amos_gallery_data', JSON.stringify(initialCountriesBackup));
    }
    renderAdminCountries();
}

function renderAdminCountries() {
    const listContainer = document.getElementById('admin-countries-list');
    listContainer.innerHTML = '';
    adminState.countries.forEach(country => {
        const item = document.createElement('div');
        item.className = 'admin-country-item';
        item.innerHTML = `
            <div class="admin-country-info">
                <img class="admin-country-tile-preview" src="${country.tileImg || 'https://picsum.photos/50/50'}">
                <span>${country.name} (${country.photos.length} fotek)</span>
            </div>
            <button class="btn-danger" onclick="deleteCountry('${country.id}')">Smazat zemi</button>
        `;
        listContainer.appendChild(item);
    });
}

window.deleteCountry = function(countryId) {
    if (confirm('Opravdu chcete tuto zemi smazat?')) {
        adminState.countries = adminState.countries.filter(c => c.id !== countryId);
        localStorage.setItem('amos_gallery_data', JSON.stringify(adminState.countries));
        renderAdminCountries();
    }
};

// COMPRESSION ENGINE: Zmenší rozlišení (max 1200px) a upraví kvalitu na 80 %
function compressImage(base64Str, maxSide, callback) {
    const img = new Image();
    img.src = base64Str;
    img.onload = function() {
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
            if (width > maxSide) { height *= maxSide / width; width = maxSide; }
        } else {
            if (height > maxSide) { width *= maxSide / height; height = maxSide; }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export zkomprimovaného JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        callback(compressedBase64);
    };
}

function setupDragAndDrop() {
    // 1. Zóna pro dlaždici
    const tileZone = document.getElementById('tile-drop-zone');
    const tileInput = document.getElementById('tile-file-input');
    tileZone.addEventListener('click', () => tileInput.click());
    tileInput.addEventListener('change', (e) => handleTileFile(e.target.files[0]));
    
    // 2. Zóna pro fotky z alba
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleAlbumFiles(e.target.files));

    // Přetahovací listenery
    bindDragEvents(tileZone, (files) => handleTileFile(files[0]));
    bindDragEvents(dropZone, (files) => handleAlbumFiles(files));
}

function bindDragEvents(zone, dropCallback) {
    ['dragenter', 'dragover'].forEach(eName => {
        zone.addEventListener(eName, (e) => { e.preventDefault(); zone.classList.add('dragover'); }, false);
    });
    ['dragleave', 'drop'].forEach(eName => {
        zone.addEventListener(eName, (e) => { e.preventDefault(); zone.classList.remove('dragover'); }, false);
    });
    zone.addEventListener('drop', (e) => { dropCallback(e.dataTransfer.files); }, false);
}

function handleTileFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        // Dlaždici zkomprimujeme na čtvercový náhled max 600px
        compressImage(reader.result, 600, (compressedData) => {
            uploadedTileTemp = compressedData;
            document.getElementById('tile-preview-status').innerHTML = "<b>Obrázek nahrán a zkomprimován! ✓</b>";
        });
    };
}

function handleAlbumFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            // AUTOMATICKÁ KOMPRESE PŘI PŘETAŽENÍ (Max 1200px)
            compressImage(reader.result, 1200, (compressedData) => {
                const photoId = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
                uploadedPhotosTemp.push({ id: photoId, imgData: compressedData });
                renderUploadedPhotosList();
            });
        };
    });
}

function renderUploadedPhotosList() {
    const container = document.getElementById('uploaded-photos-list');
    container.innerHTML = '';
    uploadedPhotosTemp.forEach(photo => {
        const row = document.createElement('div');
        row.className = 'uploaded-photo-row';
        row.innerHTML = `
            <img src="${photo.imgData}">
            <input type="text" class="photo-desc-input" data-id="${photo.id}" placeholder="Napište popisek k této fotografii...">
            <button class="btn-danger" style="min-height:38px; padding:0 10px;" onclick="removeTempPhoto('${photo.id}')">✕</button>
        `;
        container.appendChild(row);
    });
}

window.removeTempPhoto = function(photoId) {
    uploadedPhotosTemp = uploadedPhotosTemp.filter(p => p.id !== photoId);
    renderUploadedPhotosList();
};

document.getElementById('save-country-btn').addEventListener('click', () => {
    const name = document.getElementById('new-country-name').value.trim();
    const mainText = document.getElementById('new-country-main-text').value.trim();
    
    if (!name || !uploadedTileTemp) { 
        alert('Prosím vyplňte Název země a nahrajte hlavní obrázek dlaždice.'); 
        return; 
    }
    
    const finalPhotos = [];
    document.querySelectorAll('.uploaded-photo-row').forEach(row => {
        const input = row.querySelector('.photo-desc-input');
        const photoId = input.getAttribute('data-id');
        const desc = input.value.trim() || 'Bez popisku';
        const tempPhoto = uploadedPhotosTemp.find(p => p.id === photoId);
        if (tempPhoto) finalPhotos.push({ img: tempPhoto.imgData, desc: desc });
    });
    
    const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    adminState.countries.push({ id, name, tileImg: uploadedTileTemp, mainText, photos: finalPhotos });
    localStorage.setItem('amos_gallery_data', JSON.stringify(adminState.countries));
    
    // Vyčištění formuláře
    document.getElementById('new-country-name').value = '';
    document.getElementById('new-country-main-text').value = '';
    document.getElementById('uploaded-photos-list').innerHTML = '';
    document.getElementById('tile-preview-status').textContent = 'nebo klikněte pro výběr';
    uploadedPhotosTemp = [];
    uploadedTileTemp = null;
    renderAdminCountries();
    alert('Země byla úspěšně uložena s plně zkomprimovanými daty!');
});

document.getElementById('admin-logout-btn').addEventListener('click', () => {
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-dashboard-page').classList.add('hidden');
    document.getElementById('admin-auth-page').classList.remove('hidden');
});
