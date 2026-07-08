// Espejo de Operación Pasiva Inmobiliaria — Vanilla Estricto
(function () {
    'use strict';

    // ── Constante de operación (ajustar número de la corredora aquí) ──────────
    const BROKER_PHONE = "56934545677";

    // ── Modelo de Score (4 preguntas × 25 pts = 100 máx) ─────────────────────
    const SCORE_QUESTIONS = [
        {
            text: 'Urgencia para concretar la operación',
            options: [
                { label: 'Inmediato — menos de 30 días',     weight: 25 },
                { label: 'Próximos 3 meses',                  weight: 15 },
                { label: '6 meses o más',                     weight: 5  },
                { label: 'Solo explorando opciones',          weight: 0  }
            ]
        },
        {
            text: 'Estado del financiamiento',
            options: [
                { label: 'Preaprobado o pago al contado',    weight: 25 },
                { label: 'En proceso de preaprobación',       weight: 15 },
                { label: 'Por explorar opciones de crédito', weight: 5  },
                { label: 'Sin claridad aún',                  weight: 0  }
            ]
        },
        {
            text: 'Pie disponible aproximado',
            options: [
                { label: 'Más del 20%',     weight: 25 },
                { label: 'Entre 15% y 20%', weight: 15 },
                { label: 'Entre 10% y 15%', weight: 5  },
                { label: 'Menos del 10%',   weight: 0  }
            ]
        },
        {
            text: 'Capacidad de decisión de compra',
            options: [
                { label: 'Decido solo/a',                 weight: 25 },
                { label: 'Con pareja o socio',             weight: 15 },
                { label: 'Requiere aprobación adicional', weight: 5  },
                { label: 'Aún no está definido',           weight: 0  }
            ]
        }
    ];

    // ── Helpers de Score y Llave ──────────────────────────────────────────────
    function scoreToTier(score) {
        if (score >= 75) return 'A';
        if (score >= 40) return 'B1';
        return 'B2';
    }

    // UTF-8 safe Base64
    function encodeKey(name, phone, slug, score, tier) {
        const raw = [name, phone, slug, score, tier].join('|');
        return btoa(unescape(encodeURIComponent(raw)));
    }

    function decodeKey(b64) {
        return decodeURIComponent(escape(atob(b64)));
    }

    // ── Estado ────────────────────────────────────────────────────────────────
    let state = JSON.parse(localStorage.getItem('psicoandino_state')) || {};

    if (!state.templates) {
        state.templates = {
            'A':  'Hola {name}, soy del equipo de Boutique Assets. Analicé sus requerimientos de alta prioridad para la propiedad {slug}. Coordinemos una llamada de inmediato.',
            'B1': 'Hola {name}, coordinemos una llamada para revisar los detalles sobre la propiedad {slug} en Boutique Assets.',
            'B2': 'Hola {name}, recibimos su solicitud de información para la propiedad {slug} en Boutique Assets. Le comparto los datos de inmediato.'
        };
    }
    if (!state.leads)       state.leads       = [];
    if (!state.properties)  state.properties  = [];
    if (!state.brokerName)  state.brokerName  = 'Boutique Assets';
    saveState();

    function saveState() {
        localStorage.setItem('psicoandino_state', JSON.stringify(state));
    }

    // ── Enrutamiento ──────────────────────────────────────────────────────────
    function checkRoutingContext() {
        const params   = new URLSearchParams(window.location.search);
        const formSlug = params.get('form');
        const brokerB  = params.get('b');
        if (formSlug) {
            document.getElementById('admin-app-shell')?.classList.add('hidden');
            document.getElementById('client-form-view')?.classList.remove('hidden');
            setupClientForm(formSlug, brokerB ? decodeURIComponent(brokerB) : '');
            return true;
        }
        return false;
    }

    // ── Formulario Cliente ────────────────────────────────────────────────────
    function setupClientForm(slug, brokerName) {
        // Título y subtítulo con contexto
        const title    = document.getElementById('client-form-title');
        const subtitle = document.getElementById('client-subtitle');
        const slugIn   = document.getElementById('client-target-slug');
        const brokerIn = document.getElementById('client-broker-name');

        if (slugIn)   slugIn.value   = slug;
        if (brokerIn) brokerIn.value = brokerName;
        if (title)    title.textContent    = `Validación de Interés: ${slug.toUpperCase()}`;
        if (subtitle) subtitle.textContent = brokerName
            ? `Gestionado por ${brokerName}`
            : 'Complete los parámetros solicitados.';

        // Renderizar preguntas de score
        const qContainer = document.getElementById('score-questions');
        if (qContainer) {
            SCORE_QUESTIONS.forEach((q, qi) => {
                const group = document.createElement('div');
                group.className = 'form-group score-question';
                group.innerHTML = `<label class="score-q-label">${qi + 1}. ${q.text}</label>`
                    + q.options.map((opt, oi) => `
                        <label class="score-option">
                            <input type="radio" name="q${qi}" value="${opt.weight}" required>
                            <span>${opt.label}</span>
                        </label>`
                    ).join('');
                qContainer.appendChild(group);
            });
        }

        // Submit — calcula score, genera LLAVE opaca, abre WhatsApp
        document.getElementById('qualification-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name     = document.getElementById('client-name').value.trim();
            const phone    = document.getElementById('client-phone').value.trim().replace(/\s+/g, '');
            const targetSlug = document.getElementById('client-target-slug').value;
            const broker   = document.getElementById('client-broker-name').value || brokerName || 'Corredora';

            // Calcular score total
            let score = 0;
            SCORE_QUESTIONS.forEach((_, qi) => {
                const sel = document.querySelector(`input[name="q${qi}"]:checked`);
                if (sel) score += parseInt(sel.value, 10);
            });

            const tier = scoreToTier(score);
            const key  = encodeKey(name, phone, targetSlug, score, tier);

            // Mensaje opaco — el cliente no ve su score
            const msg = `Hola ${broker}, envío mi validación para ${targetSlug}. LLAVE: REF-${key}`;
            window.open(
                `https://api.whatsapp.com/send?phone=${BROKER_PHONE}&text=${encodeURIComponent(msg)}`,
                '_blank'
            );
        });
    }

    // ── Campo de Nombre de Corredora ──────────────────────────────────────────
    function setupBrokerField() {
        const display  = document.getElementById('broker-display');
        const input    = document.getElementById('broker-input');
        const editBtn  = document.getElementById('broker-edit-btn');
        const saveBtn  = document.getElementById('broker-save-btn');
        if (!display || !input || !editBtn || !saveBtn) return;

        display.textContent = state.brokerName;
        input.value = state.brokerName;

        function enterEditMode() {
            display.classList.add('hidden');
            editBtn.classList.add('hidden');
            input.classList.remove('hidden');
            saveBtn.classList.remove('hidden');
            input.focus();
            input.select();
        }

        function commitSave() {
            const val = input.value.trim();
            if (!val) return;
            state.brokerName = val;
            saveState();
            display.textContent = val;
            display.classList.remove('hidden');
            input.classList.add('hidden');
            saveBtn.classList.add('hidden');
            // Flash verde en el ícono de editar
            editBtn.textContent  = '✓';
            editBtn.style.color  = '#22c55e';
            editBtn.classList.remove('hidden');
            setTimeout(() => {
                editBtn.textContent = '✏';
                editBtn.style.color = '';
            }, 1500);
        }

        editBtn.addEventListener('click', enterEditMode);
        saveBtn.addEventListener('click', commitSave);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')  { e.preventDefault(); commitSave(); }
            if (e.key === 'Escape') {
                input.value = state.brokerName;
                display.classList.remove('hidden');
                editBtn.classList.remove('hidden');
                input.classList.add('hidden');
                saveBtn.classList.add('hidden');
            }
        });
    }

    // ── Render Leads ──────────────────────────────────────────────────────────
    function renderLeads() {
        const container = document.getElementById('leads-container');
        if (!container) return;
        container.innerHTML = '';

        const active = state.leads.filter(l => !l.archived);
        if (active.length === 0) {
            container.innerHTML = `<div class="empty-state">Esperando captura...<br>(Copia y pega un lead aquí)</div>`;
            return;
        }

        active.forEach(lead => {
            const matched     = state.properties.find(p => p.slug.toLowerCase() === lead.slug.toLowerCase());
            const propSnippet = matched
                ? `<div class="prop-badge-inline">Activo Enlazado: ${matched.price} — ${matched.details}</div>`
                : '';
            const scoreSnippet = (lead.score !== undefined)
                ? `<div class="score-badge">Score: <strong>${lead.score}</strong> — ${lead.tier}</div>`
                : '';
            const isQualified = lead.status === 'qualified';

            const card = document.createElement('div');
            card.className = `card ${isQualified ? 'qualified' : 'pending'}`;
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${lead.name}${isQualified ? ' ✓' : ''}</div>
                        <div class="card-subtitle">${lead.phone} — ${lead.slug}</div>
                        ${propSnippet}
                        ${scoreSnippet}
                    </div>
                    <div class="card-meta">
                        <span class="badge" style="border-left: 3px solid var(--scale-${lead.tier.toLowerCase()})">${lead.tier}</span>
                        <button class="archive-btn" data-id="${lead.id}">Archivar</button>
                    </div>
                </div>
                <div class="matrix-actions">
                    <button class="action-btn p-a"  data-id="${lead.id}" data-tmpl="A">Tmpl A</button>
                    <button class="action-btn p-b1" data-id="${lead.id}" data-tmpl="B1">Tmpl B1</button>
                    <button class="action-btn p-b2" data-id="${lead.id}" data-tmpl="B2">Tmpl B2</button>
                </div>`;
            container.appendChild(card);
        });
    }

    // ── Render Propiedades ────────────────────────────────────────────────────
    function renderProperties() {
        const container = document.getElementById('properties-container');
        if (!container) return;
        container.innerHTML = '';

        if (state.properties.length === 0) {
            container.innerHTML = `<div class="empty-state">No hay activos registrados en cartera.</div>`;
            return;
        }

        const base        = window.location.origin + window.location.pathname;
        const brokerParam = encodeURIComponent(state.brokerName);

        state.properties.forEach((prop, idx) => {
            const link = `${base}?form=${encodeURIComponent(prop.slug)}&b=${brokerParam}`;
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${prop.slug}</div>
                    <div class="card-meta">
                        <span class="badge" style="background-color: var(--scale-a);">${prop.price}</span>
                        <button class="delete-btn" data-idx="${idx}">Eliminar</button>
                    </div>
                </div>
                <div class="card-subtitle" style="margin-top: 8px;">${prop.details}</div>
                <div class="field-hint" style="margin-top: 6px;">⚠ Este nombre es visible para el cliente en el link</div>
                <div style="margin-top: 8px; font-size: 11px; word-break: break-all;">
                    <a href="${link}" target="_blank" style="color: var(--scale-a); text-decoration: underline;">Link del Formulario Cliente</a>
                </div>`;
            container.appendChild(card);
        });
    }

    // ── Captura Pasiva ────────────────────────────────────────────────────────
    function setupPassiveCapture() {
        const pastebox    = document.getElementById('passive-pastebox');
        const errorMsg    = document.getElementById('capture-error');
        const captureZone = document.getElementById('capture-zone');
        const clearBtn    = document.getElementById('clear-pastebox');
        if (!pastebox) return;

        clearBtn?.addEventListener('click', () => {
            pastebox.value = '';
            errorMsg?.classList.add('hidden');
            pastebox.focus();
        });

        pastebox.addEventListener('input', (e) => {
            const raw = e.target.value.trim();
            if (!raw) return;

            // ── Detección de LLAVE REF- (prioridad máxima) ────────────────────
            const refMatch = raw.match(/REF-([A-Za-z0-9+/=]+)/);
            if (refMatch) {
                try {
                    const decoded = decodeKey(refMatch[1]);
                    const parts   = decoded.split('|');
                    if (parts.length >= 5) {
                        const [dName, dPhone, dSlug, dScore, dTier] = parts;
                        const existing = state.leads.find(l =>
                            l.phone === dPhone || l.phone.includes(dPhone) || dPhone.includes(l.phone)
                        );
                        if (existing) {
                            existing.status = 'qualified';
                            existing.score  = parseInt(dScore, 10);
                            existing.tier   = dTier;
                            existing.name   = dName || existing.name;
                        } else {
                            state.leads.unshift({
                                id: Date.now(), name: dName, phone: dPhone,
                                slug: dSlug, tier: dTier,
                                score: parseInt(dScore, 10),
                                status: 'qualified', archived: false
                            });
                        }
                        saveState();
                        renderLeads();
                        e.target.value = '';
                        captureZone?.classList.add('collapsed');
                        errorMsg?.classList.add('hidden');
                        return;
                    }
                } catch (_) { /* clave malformada, continuar */ }
            }

            // ── Captura estándar por Regex ────────────────────────────────────
            const hasSuccessCode   = /CAPTURA_PSICO/i.test(raw);
            const hasQualifyingTag = /(?:Pie\s*:\s*\d+%|Urgencia\s*:\s*[^\n\r]+|Score\s*:\s*\d+)/i.test(raw);
            const isQualified      = hasSuccessCode || hasQualifyingTag;

            const nameMatch  = raw.match(/(?:Nombre|Name|Cliente)\s*:\s*([^\n\r]+)/i);
            const phoneMatch = raw.match(/(?:Teléfono|Fono|Celular|Phone|WhatsApp)\s*:\s*([^\n\r]+)/i);
            const slugMatch  = raw.match(/(?:Propiedad|Código|Ref|Slug)\s*:\s*([^\n\r]+)/i);
            const tierMatch  = raw.match(/(?:Tier|Prioridad|Clasificación)\s*:\s*([^\n\r]+)/i);
            const scoreMatch = raw.match(/Score\s*:\s*(\d+)/i);

            const parsedPhone = phoneMatch ? phoneMatch[1].trim().replace(/\s+/g, '') : null;
            const parsedName  = nameMatch  ? nameMatch[1].trim()  : null;
            const parsedSlug  = slugMatch  ? slugMatch[1].trim()  : 'General';
            let   parsedTier  = 'A';
            if (tierMatch) {
                const t = tierMatch[1].trim().toUpperCase();
                if (['A', 'B1', 'B2'].includes(t)) parsedTier = t;
            }

            // Actualización de lead existente por teléfono
            if (parsedPhone && isQualified) {
                const existing = state.leads.find(l =>
                    l.phone === parsedPhone || l.phone.includes(parsedPhone) || parsedPhone.includes(l.phone)
                );
                if (existing) {
                    existing.status = 'qualified';
                    if (tierMatch)  existing.tier  = parsedTier;
                    if (scoreMatch) existing.score = parseInt(scoreMatch[1], 10);
                    saveState();
                    renderLeads();
                    e.target.value = '';
                    captureZone?.classList.add('collapsed');
                    errorMsg?.classList.add('hidden');
                    return;
                }
            }

            if (!parsedName || !parsedPhone) {
                if (errorMsg) {
                    errorMsg.textContent = 'Captura Fallida: Falta Nombre o Teléfono. Usa Carga Manual.';
                    errorMsg.classList.remove('hidden');
                }
                return;
            }

            errorMsg?.classList.add('hidden');
            state.leads.unshift({
                id: Date.now(), name: parsedName, phone: parsedPhone,
                slug: parsedSlug, tier: parsedTier,
                status: isQualified ? 'qualified' : 'pending',
                archived: false
            });
            saveState();
            renderLeads();
            e.target.value = '';
            captureZone?.classList.add('collapsed');
        });

        // Cerrar al tocar fuera
        document.addEventListener('click', (e) => {
            const fab = document.getElementById('fab-toggle-capture');
            if (captureZone && !captureZone.classList.contains('collapsed')) {
                if (!captureZone.contains(e.target) && !fab?.contains(e.target)) {
                    captureZone.classList.add('collapsed');
                    pastebox.value = '';
                    errorMsg?.classList.add('hidden');
                }
            }
        });
    }

    // ── Carga Manual de Lead ──────────────────────────────────────────────────
    function setupManualLead() {
        const toggleBtn = document.getElementById('manual-lead-toggle');
        const formEl    = document.getElementById('manual-lead-form');
        const submitBtn = document.getElementById('manual-lead-submit');
        if (!toggleBtn || !formEl) return;

        toggleBtn.addEventListener('click', () => formEl.classList.toggle('hidden'));

        submitBtn?.addEventListener('click', () => {
            const name  = document.getElementById('manual-name').value.trim();
            const phone = document.getElementById('manual-phone').value.trim().replace(/\s+/g, '');
            const slug  = document.getElementById('manual-slug').value.trim() || 'General';
            const tier  = document.getElementById('manual-tier').value;
            if (!name || !phone) return;

            state.leads.unshift({ id: Date.now(), name, phone, slug, tier, status: 'pending', archived: false });
            saveState();
            renderLeads();
            document.getElementById('manual-name').value  = '';
            document.getElementById('manual-phone').value = '';
            document.getElementById('manual-slug').value  = '';
            formEl.classList.add('hidden');
        });
    }

    // ── Formulario de Activos ─────────────────────────────────────────────────
    function setupPropertyForm() {
        const form      = document.getElementById('property-form');
        const submitBtn = document.getElementById('asset-submit-btn');
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            state.properties.push({
                slug:    document.getElementById('prop-slug').value.trim().replace(/\s+/g, '-').toLowerCase(),
                price:   document.getElementById('prop-price').value.trim(),
                details: document.getElementById('prop-details').value.trim()
            });
            saveState();
            renderProperties();
            renderLeads();
            form.reset();
            // Flash verde de confirmación de guardado
            if (submitBtn) {
                const orig = submitBtn.textContent;
                submitBtn.textContent = '✓ Guardado';
                submitBtn.style.background = '#22c55e';
                setTimeout(() => {
                    submitBtn.textContent  = orig;
                    submitBtn.style.background = '';
                }, 1500);
            }
        });
    }

    // ── Vistas y Navegación ───────────────────────────────────────────────────
    const VIEWS = ['view-matrix', 'view-inventory'];
    const TABS  = ['tab-matrix',  'tab-inventory'];

    function changeView(index) {
        VIEWS.forEach((v, i) => {
            document.getElementById(v)?.classList.toggle('active', i === index);
            document.getElementById(TABS[i])?.classList.toggle('active', i === index);
        });
    }

    function setupInterface() {
        TABS.forEach((tabId, idx) => {
            document.getElementById(tabId)?.addEventListener('click', () => changeView(idx));
        });

        const fab         = document.getElementById('fab-toggle-capture');
        const captureZone = document.getElementById('capture-zone');
        const pastebox    = document.getElementById('passive-pastebox');

        fab?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = captureZone.classList.toggle('collapsed');
            if (!isCollapsed && pastebox) pastebox.focus();
        });

        // ── Delegación — Leads ────────────────────────────────────────────────
        document.getElementById('leads-container')?.addEventListener('click', (e) => {
            const archiveBtn = e.target.closest('.archive-btn');
            const actionBtn  = e.target.closest('.action-btn');

            if (archiveBtn) {
                const id   = parseInt(archiveBtn.dataset.id, 10);
                const lead = state.leads.find(l => l.id === id);
                if (lead) { lead.archived = true; saveState(); renderLeads(); }
                return;
            }
            if (actionBtn) {
                const id   = parseInt(actionBtn.dataset.id, 10);
                const tmpl = actionBtn.dataset.tmpl;
                const lead = state.leads.find(l => l.id === id);
                if (!lead || !state.templates[tmpl]) return;
                const text = state.templates[tmpl]
                    .replace('{name}', lead.name)
                    .replace('{slug}', lead.slug);
                window.open(`https://api.whatsapp.com/send?phone=${lead.phone}&text=${encodeURIComponent(text)}`, '_blank');
            }
        });

        // ── Delegación — Propiedades ──────────────────────────────────────────
        document.getElementById('properties-container')?.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const idx = parseInt(deleteBtn.dataset.idx, 10);
                state.properties.splice(idx, 1);
                saveState();
                renderProperties();
                renderLeads();
            }
        });
    }

    function setupSwipeGestures() {
        const slider = document.querySelector('.views-slider');
        if (!slider) return;
        let startX = 0, startY = 0;
        slider.addEventListener('touchstart', e => {
            startX = e.touches[0].screenX; startY = e.touches[0].screenY;
        }, { passive: true });
        slider.addEventListener('touchend', e => {
            const diffX = e.changedTouches[0].screenX - startX;
            const diffY = e.changedTouches[0].screenY - startY;
            if (Math.abs(diffX) > 85 && Math.abs(diffY) < 35) {
                const idx = VIEWS.findIndex(v => document.getElementById(v)?.classList.contains('active'));
                if (diffX < 0 && idx < VIEWS.length - 1) changeView(idx + 1);
                else if (diffX > 0 && idx > 0)           changeView(idx - 1);
            }
        }, { passive: true });
    }

    // ── Ciclo de Inicialización ───────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        if (!checkRoutingContext()) {
            setupBrokerField();
            setupInterface();
            setupSwipeGestures();
            setupPassiveCapture();
            setupManualLead();
            setupPropertyForm();
            renderLeads();
            renderProperties();
        }
    });
})();