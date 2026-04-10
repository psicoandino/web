document.addEventListener("DOMContentLoaded", () => {
    // Palabras dinámicas alineadas con los nuevos territorios
    const words = [
        "En Desarrollo...", 
        "Estructuras y Colectivos", 
        "La Forma y el Tiempo", 
        "Percepción y Silencio", 
        "Método y Texturas"
    ];
    
    const textElement = document.getElementById('changing-text');
    let index = 0;

    setInterval(() => {
        textElement.style.opacity = 0;
        setTimeout(() => {
            index = (index + 1) % words.length;
            textElement.innerText = words[index];
            textElement.style.opacity = 1;
        }, 500);
    }, 3000);

    // Lógica del menú móvil (Hamburguesa)
    const btn = document.getElementById('hamburger-btn');
    const menu = document.getElementById('nav-links');
    
    btn.onclick = () => menu.classList.toggle('active');
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.onclick = () => menu.classList.remove('active');
    });
});