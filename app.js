document.addEventListener("DOMContentLoaded", () => {
    // Palabras que rotarán en el Hero
    const words = [
        "En Desarrollo...", 
        "Control de Gestión", 
        "Arquitectura Web", 
        "Materia & Arcilla", 
        "Ciencia y Mente"
    ];
    
    const textElement = document.getElementById('changing-text');
    let index = 0;

    // Función para cambiar el texto con transición suave
    setInterval(() => {
        // Desvanece el texto actual
        textElement.style.opacity = 0;
        
        setTimeout(() => {
            // Cambia la palabra mientras está invisible
            index = (index + 1) % words.length;
            textElement.innerText = words[index];
            
            // Aparece la nueva palabra
            textElement.style.opacity = 1;
            textElement.style.transition = "opacity 0.5s ease";
        }, 500); 

    }, 3000); // Se ejecuta cada 3 segundos
});