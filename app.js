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
    
    // Solo ejecuta la animación si estamos en el Home (donde existe #changing-text)
    if (textElement) {
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
    }

});