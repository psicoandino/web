document.addEventListener("DOMContentLoaded", () => {
    
    // Pool de 11 aforismos Psicoandinos (Sin conceptos repetidos)
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

    // Transición suave cada 3.5 segundos
    setInterval(() => {
        textElement.style.opacity = 0;
        
        setTimeout(() => {
            index = (index + 1) % words.length;
            textElement.innerText = words[index];
            textElement.style.opacity = 1;
            textElement.style.transition = "opacity 0.6s ease";
        }, 600); // Espera a que desaparezca antes de inyectar el nuevo texto
        
    }, 3500); 
});