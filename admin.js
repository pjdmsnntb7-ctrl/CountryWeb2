function getFlagEmoji(countryCode) {
    if (!countryCode) return "🏳️";
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

let adminState = {
    countries: []
};

let uploadedPhotosTemp = [];

const initialCountriesBackup = [
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

// AUTENTIKACE
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
        const hasOldData = parsedData.some(c => c.id === 'italie' || !c.code);
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

    if (adminState.countries.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:#64748b;">Žádné země v systému.</p>';
        return;
    }

    adminState.countries.forEach(country => {
        const item = document.createElement('div');
        item.className = 'admin-country-item';
        item.innerHTML = `
            <div class="admin-country-info">
                <span class="admin-country-flag-preview">${getFlagEmoji(country.code)}</span>
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

// DRAG & DROP LOGIKA
function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        handleFiles(dt.files);
    }, false);
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64data = reader.result;
            const photoId = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
            
            uploadedPhotosTemp.push({
                id: photoId,
                imgData: base64data
            });

            renderUploadedPhotosList();
        };
    });
}

// Vykreslení řádku s fotkou a políčkem pro text k fotce
function renderUploadedPhotosList() {
    const container = document.getElementById('uploaded-photos-list');
    container.innerHTML = '';

    uploadedPhotosTemp.forEach(photo => {
        const row = document.createElement('div');
        row.className = 'uploaded-photo-row';
        row.innerHTML = `
            <img src="${photo.imgData}" alt="Náhled">
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

// ULOŽENÍ
document.getElementById('save-country-btn').addEventListener('click', () => {
    const name = document.getElementById('new-country-name').value.trim();
    const code = document.getElementById('new-country-code').value.trim();
    const mainText = document.getElementById('new-country-main-text').value.trim();

    if (!name || !code) {
        alert('Prosím vyplňte Název země a ISO kód.');
        return;
    }

    const finalPhotos = [];
    const rows = document.querySelectorAll('.uploaded-photo-row');
    
    rows.forEach(row => {
        const input = row.querySelector('.photo-desc-input');
        const photoId = input.getAttribute('data-id');
        const desc = input.value.trim() || 'Bez popisku';
        
        const tempPhoto = uploadedPhotosTemp.find(p => p.id === photoId);
        if (tempPhoto) {
            finalPhotos.push({
                img: tempPhoto.imgData,
                desc: desc
            });
        }
    });

    const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const newCountry = { id, name, code: code.toUpperCase(), mainText, photos: finalPhotos };
    
    adminState.countries.push(newCountry);
    localStorage.setItem('amos_gallery_data', JSON.stringify(adminState.countries));

    // Reset formuláře
    document.getElementById('new-country-name').value = '';
    document.getElementById('new-country-code').value = '';
    document.getElementById('new-country-main-text').value = '';
    document.getElementById('uploaded-photos-list').innerHTML = '';
    uploadedPhotosTemp = [];

    renderAdminCountries();
    alert('Země a přetažené fotografie byly úspěšně uloženy do systému!');
});

document.getElementById('admin-logout-btn').addEventListener('click', () => {
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-dashboard-page').classList.add('hidden');
    document.getElementById('admin-auth-page').classList.remove('hidden');
});