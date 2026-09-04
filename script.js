document.addEventListener("DOMContentLoaded", () => {
    // Referensi DOM
    const modelViewer = document.getElementById('tower-viewer');
    const wipeLayer = document.getElementById('golden-wipe');
    const statsPanel = document.getElementById('stats-panel');
    const panelHandle = document.querySelector('.panel-handle');
    const body = document.body;
    
    // Panel Interaktif Sliding
    panelHandle.addEventListener('click', () => {
        statsPanel.classList.toggle('open');
        const arrow = panelHandle.querySelector('span');
        arrow.innerHTML = statsPanel.classList.contains('open') ? '&#9664;' : '&#9654;';
    });

    // Menghapus animasi kilap (shiny) secara PERMANEN saat diklik pertama kali
    const allButtons = document.querySelectorAll('.btn');
    allButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.remove('shiny');
        });
    });

    // Data Stats
    const statsData = {
        standard: {
            hp: "1500", atk: "1.2s", dmg: "253", res: "40%", weak: "150%", src: "assets/BombTower1.glb"
        },
        elite: {
            hp: "5587", atk: "0.65s", dmg: "554", res: "85%", weak: "75%", src: "assets/BombTower2.glb"
        }
    };

    let currentTheme = 'standard';

    // Logika Transisi Golden Wipe & Pergantian Model
    function triggerThemeChange(themeType) {
        if (currentTheme === themeType) return;
        currentTheme = themeType;

        // 1. Jalankan Animasi
        wipeLayer.classList.add('wipe-animate');

        // 2. Transisi Midpoint (Tepat di tengah durasi Wipe: ~500ms)
        setTimeout(() => {
            // Update CSS Background via Body Class
            body.className = themeType === 'elite' ? 'theme-elite' : 'theme-standard';
            
            // Update Model 3D
            modelViewer.src = statsData[themeType].src;
            
            // Update Text Stats
            document.getElementById('stat-hp').innerText = statsData[themeType].hp;
            document.getElementById('stat-atk').innerText = statsData[themeType].atk;
            document.getElementById('stat-dmg').innerText = statsData[themeType].dmg;
            document.getElementById('stat-res').innerText = statsData[themeType].res;
            document.getElementById('stat-weak').innerText = statsData[themeType].weak;

            // Toggle Ikon Attribute Khusus
            const attrText = document.getElementById('stat-attr');
            const attrIcons = document.getElementById('attr-icons');
            if (themeType === 'elite') {
                attrText.classList.add('hidden');
                attrIcons.classList.remove('hidden');
            } else {
                attrText.classList.remove('hidden');
                attrIcons.classList.add('hidden');
            }
            
            // Matikan Wireframe jika sedang aktif saat ganti skin
            if (isWireframeOn) toggleWireframe(); 

        }, 500); // 500ms = Titik tengah animasi

        // 3. Reset Animasi setelah selesai (Durasi Wipe total = 1000ms)
        setTimeout(() => {
            wipeLayer.classList.remove('wipe-animate');
        }, 1100);
    }

    document.getElementById('btn-standard').addEventListener('click', () => triggerThemeChange('standard'));
    document.getElementById('btn-elite').addEventListener('click', () => triggerThemeChange('elite'));

    // --- MODUL WIREFRAME 3D ---
    let isWireframeOn = false;
    const btnWireframe = document.getElementById('btn-wireframe');
    const wireframeOptions = document.getElementById('wireframe-options');
    const subButtons = document.querySelectorAll('.btn-sub');
    let originalMaterials = new Map();

    // Cache material asli saat model dimuat
    modelViewer.addEventListener('load', () => {
        originalMaterials.clear();
        if(!modelViewer.model || !modelViewer.model.materials) return;
        
        modelViewer.model.materials.forEach(mat => {
            originalMaterials.set(mat.name, {
                baseColorFactor: mat.pbrMetallicRoughness.baseColorFactor.slice(),
                emissiveFactor: mat.emissiveFactor.slice(),
                alphaMode: mat.alphaMode
            });
        });
    });

    // Toggle Utama Wireframe
    function toggleWireframe() {
        if (!modelViewer.model || !modelViewer.model.materials) return;
        isWireframeOn = !isWireframeOn;

        if (isWireframeOn) {
            btnWireframe.style.boxShadow = "0 0 15px var(--neon-blue)";
            wireframeOptions.classList.remove('disabled');
            applyWireframeStyle('face'); // Default mode
            subButtons.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-mode="face"]').classList.add('active');
        } else {
            btnWireframe.style.boxShadow = "none";
            wireframeOptions.classList.add('disabled');
            restoreMaterials();
        }
    }
    btnWireframe.addEventListener('click', toggleWireframe);

    // Manipulasi Material untuk Simulasi Efek Matrix/Wireframe
    // (Native model-viewer tidak memilki native vertex/edge shader API,
    // jadi kita mensimulasikannya via transparansi & emissive color neon blue)
    function applyWireframeStyle(mode) {
        if (!modelViewer.model || !modelViewer.model.materials) return;
        
        modelViewer.model.materials.forEach(mat => {
            mat.setAlphaMode('BLEND');
            
            // Neon Blue Color [R, G, B]
            const neonBlue = [0.0, 0.95, 1.0]; 

            if (mode === 'face') {
                mat.pbrMetallicRoughness.setBaseColorFactor([...neonBlue, 0.4]);
                mat.setEmissiveFactor([...neonBlue]);
            } else if (mode === 'edge') {
                mat.pbrMetallicRoughness.setBaseColorFactor([...neonBlue, 0.1]);
                mat.setEmissiveFactor([...neonBlue]);
            } else if (mode === 'vertex') {
                mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 0.05]);
                mat.setEmissiveFactor([1, 1, 1]);
            }
        });
    }

    // Sub-tombol Viewing Mode
    subButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!isWireframeOn) return;
            subButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            applyWireframeStyle(e.target.dataset.mode);
        });
    });

    function restoreMaterials() {
        if (!modelViewer.model || !modelViewer.model.materials) return;
        modelViewer.model.materials.forEach(mat => {
            const cache = originalMaterials.get(mat.name);
            if (cache) {
                mat.pbrMetallicRoughness.setBaseColorFactor(cache.baseColorFactor);
                mat.setEmissiveFactor(cache.emissiveFactor);
                mat.setAlphaMode(cache.alphaMode);
            }
        });
    }
});