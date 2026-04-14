document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================
    // LÓGICA DEL TEXTO DINÁMICO
    // =========================================
    const words = [
        "Método y Texturas.",
        "La Forma y el Tiempo.",
        "Percepción y Silencio.",
        "Estructuras y Colectivos.",
        "Código y Arcilla.",
        "Lógica del Territorio.",
        "Tensión Material.",
        "Sistemas e Incentivos.",
        "Frecuencia y Movimiento.",
        "Síntesis del Caos.",
        "Observación del Vacío."
    ];
    
    const textElement = document.getElementById('changing-text');
    let index = 0;

    setInterval(() => {
        textElement.style.opacity = 0;
        
        setTimeout(() => {
            index = (index + 1) % words.length;
            textElement.innerText = words[index];
            textElement.style.opacity = 1;
            textElement.style.transition = "opacity 0.6s ease";
        }, 600); 
        
    }, 3500); 

    // =========================================
    // LÓGICA DEL MODAL DEL CV
    // =========================================
    const openBtn = document.getElementById('open-cv-btn');
    const closeBtn = document.getElementById('close-cv-btn');
    const modal = document.getElementById('cv-modal');

    // Abrir modal
    if (openBtn && modal) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            modal.classList.add('active');
            modal.style.display = 'flex'; 
            setTimeout(() => modal.style.opacity = '1', 10);
        });
    }

    // Función para cerrar modal
    const closeModal = () => {
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }, 300); 
        }
    };

    // Cerrar con la X
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Cerrar al hacer clic en el fondo oscuro
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});