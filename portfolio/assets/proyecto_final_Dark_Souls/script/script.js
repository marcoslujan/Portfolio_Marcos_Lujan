// ============================================
// VARIABLES GLOBALES
// ============================================
let juegosData = [];
let juegosFiltrados = [];
let archivoDeJuegoSeleccionado = null;
let modoActual = 'claro';
let coloresPersonalizados = { headerColor: '', mainColor: '', footerColor: '' };
let imagenDeFondoPersonalizada = '';
let temaPersonalizadoActivado = false;

// Definición de modos de tema
const modos = [
    {
        nombre: 'claro',
        bgImage: 'url("assets/proyecto_final_Dark_Souls/img/fondoClaro.gif")',
        bgPrimary: '#f5f5f5',
        bgSecondary: '#ffffff',
        textPrimary: '#333333',
        textSecondary: '#666666',
        accentColor: '#6c63ff',
        accentHover: '#5a52d5',
        borderColor: '#e0e0e0',
        shadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    {
        nombre: 'oscuro',
        bgImage: 'url("assets/proyecto_final_Dark_Souls/img/fondoOscuro.gif")',
        bgPrimary: '#1a1a1a',
        bgSecondary: '#2d2d2d',
        textPrimary: '#ffffff',
        textSecondary: '#b0b0b0',
        accentColor: '#8a7fff',
        accentHover: '#7b6fff',
        borderColor: '#444444',
        shadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    },
    {
        nombre: 'personalizado',
        bgImage: 'none',
        bgPrimary: '#BABABA',
        bgSecondary: '#999999',
        textPrimary: '#333333',
        textSecondary: '#666666',
        accentColor: '#6c63ff',
        accentHover: '#5a52d5',
        borderColor: '#444444',
        shadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    }
];

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    iniciarApp();
});

// Función principal de inicialización
function iniciarApp() {
    cargarDatosXML();
    prepararEventListeners();
    cargarTemaGuardado();
    aplicarModo();
    configurarTemaModal();
    prepararAnyadirCartaModal();
}

// Cargar tema guardado en localStorage
function cargarTemaGuardado() {
    const temaGuardado = localStorage.getItem('theme');
    const guardarTemaPersonalizado = JSON.parse(localStorage.getItem('customTheme') || '{}');

    if (temaGuardado === 'oscuro') {
        modoActual = 'oscuro';
    } else if (temaGuardado === 'custom') {
        modoActual = 'personalizado';
        coloresPersonalizados = {
            headerColor: guardarTemaPersonalizado.headerColor || '#ffffff',
            mainColor: guardarTemaPersonalizado.mainColor || '#f5f5f5',
            footerColor: guardarTemaPersonalizado.footerColor || '#ffffff'
        };
        imagenDeFondoPersonalizada = guardarTemaPersonalizado.backgroundImage || '';
    } else {
        modoActual = 'claro';
    }
}

// ============================================
// CARGAR DATOS DEL XML
// ============================================
function cargarDatosXML() {
    const xmlUrl = 'data/data.xml';

    fetch(xmlUrl)
        .then(response => response.text())
        .then(xmlText => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

            // Verificar si hay errores en el XML
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                console.error('Error al parsear el XML');
                mostrarError('Error al cargar los datos del XML');
                return;
            }

            // Extraer datos de los elementos "juego"
            const juegos = xmlDoc.getElementsByTagName('juego');

            juegosData = Array.from(juegos).map(juego => ({
                id: juego.getAttribute('id'),
                titulo: juego.querySelector('titulo')?.textContent || 'Sin título',
                descripcion: juego.querySelector('descripcion')?.textContent || 'Sin descripción',
                imagen: juego.querySelector('imagen')?.textContent || 'img/placeholder.png',
                nivel: juego.querySelector('nivel')?.textContent || 'Sin nivel',
                horas: juego.querySelector('horas')?.textContent || 'N/A',
                categoria: juego.querySelector('categoria')?.textContent || 'General'
            }));

            juegosFiltrados = [...juegosData];
            renderizarCartas();
        })
        .catch(error => {
            console.error('Error al cargar el XML:', error);
            mostrarError('No se pudo cargar los datos. Verifica que data/data.xml exista.');
        });
}

// ============================================
// GENERADOR DE TARJETAS
// ============================================
function renderizarCartas() {
    const contenedor = document.getElementById('contenedorCarta');
    if (juegosFiltrados.length === 0) {
        contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);"><p>No se encontraron resultados.</p></div>';
        return;
    }

    contenedor.innerHTML = juegosFiltrados.map(juego => crearCartaHTML(juego)).join('');

    // Añadir event listeners a las tarjetas
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => manejarClickCartas(card.dataset.id));
    });
}

// Función para crear el HTML de una tarjeta a partir de un objeto juego
function crearCartaHTML(juego) {
    const claseNivel = `level-${juego.nivel.toLowerCase()}`;
    return `
    <div class="card" data-id="${juego.id}">
    <img src="${juego.imagen}" alt="${juego.titulo}" class="card-image">
    <div class="card-content">
    <h3 class="card-title">${juego.titulo}</h3>
    <p class="card-description">${juego.descripcion}</p>
    <div class="card-meta">
    <span class="card-badge ${claseNivel}">${juego.nivel}</span>
    <span class="card-badge">${juego.horas} hrs</span>
    <span class="card-badge">${juego.categoria}</span>
    </div>
    </div>
    </div>
    `;
}

// ============================================
// FUNCIONALIDAD DE BÚSQUEDA
// ============================================
function prepararEventListeners() {
    const buscarInput = document.getElementById('inputBusqueda');
    const buscarBtn = document.getElementById('btnBuscar');
    const anyadirCartaBtn = document.getElementById('anadirCartaBtn');
    const botonTema = document.getElementById('botonTema');

    // Búsqueda en input (evento input)
    buscarInput.addEventListener('input', manejarBuscar);

    // Búsqueda con botón
    buscarBtn.addEventListener('click', manejarBuscar);

    // Enter en el input dispara la búsqueda
    buscarInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            manejarBuscar();
        }
    });

    // Botón de añadir tarjeta
    anyadirCartaBtn.addEventListener('click', openAddCardModal);

    // Selector de tema
    botonTema.addEventListener('click', abrirTemaModal);
}

function manejarBuscar() {
    const buscarTermino = document.getElementById('inputBusqueda').value.toLowerCase().trim();

    if (buscarTermino === '') {
        juegosFiltrados = [...juegosData];
    } else {
        juegosFiltrados = juegosData.filter(juego =>
            juego.titulo.toLowerCase().includes(buscarTermino) ||
            juego.categoria.toLowerCase().includes(buscarTermino)
        );
    }
    renderizarCartas();
}


// INTERACCIONES CON TARJETAS
function manejarClickCartas(cardId) {
    const juego = juegosData.find(j => j.id === cardId);
    if (juego) {
        console.log('Tarjeta seleccionada:', juego);
        alert(`Has seleccionado: ${juego.titulo}\nNivel: ${juego.nivel}\nHoras: ${juego.horas}`);
    }
}


// Selector del color del tema
function configurarTemaModal() {
    const temaModal = document.getElementById('temaModal');
    const cerrarTemaModal = document.getElementById('cerrarTemaModal');
    const botonTemaPersonalizado = document.getElementById('botonTemaPersonalizado');
    const aplicarTemaPersonalizado = document.getElementById('aplicarTemaPersonalizado');
    const opcionesTema = document.querySelectorAll('.opcionTema');

    // Cerrar modal
    cerrarTemaModal.addEventListener('click', cerrarTemaModalFunc);

    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', (event) => {
        if (event.target === temaModal) {
            cerrarTemaModalFunc();
        }
    });

    // Opciones de tema predefinidas
    opcionesTema.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            if (theme) {
                aplicarTema(theme);
                cerrarTemaModalFunc();
            }
        });
    });

    // Botón de personalización
    botonTemaPersonalizado.addEventListener('click', mostrarSeccionCustomizacion);

    // Aplicar tema personalizado
    aplicarTemaPersonalizado.addEventListener('click', aplicarColoresPersonalizados);

    // Quitar fondo personalizado
    const limpiarFondoBtn = document.getElementById('limpiarFondoPersonalizado');
    limpiarFondoBtn.addEventListener('click', function () {
        imagenDeFondoPersonalizada = '';
        localStorage.setItem('customTheme', JSON.stringify({
            ...JSON.parse(localStorage.getItem('customTheme') || '{}'),
            backgroundImage: ''
        }));
        document.body.style.backgroundImage = 'none';
        document.querySelector('.main-slide').style.backgroundColor = coloresPersonalizados.mainColor || '#f5f5f5';
        document.getElementById('fondoPersonalizadoURL').value = '';
        document.getElementById('fondoPersonalizadoFile').value = '';
        const fondoPreview = document.getElementById('fondoPersonalizadoPreview');
        fondoPreview.src = '';
        fondoPreview.classList.add('oculto');
    });
}

// Funciones para abrir/cerrar el modal de tema
function abrirTemaModal() {
    const temaModal = document.getElementById('temaModal');
    temaModal.classList.add('show');
}

function cerrarTemaModalFunc() {
    const temaModal = document.getElementById('temaModal');
    temaModal.classList.remove('show');
    ocultarSeccionCustomizacion();
}

// Funciones para mostrar la sección de personalización
function mostrarSeccionCustomizacion() {
    const seccionCustomizacion = document.getElementById('seccionCustomizacion');
    seccionCustomizacion.classList.remove('hidden');

    // Cargar valores actuales
    const colorHeader = getComputedStyle(document.querySelector('.header')).backgroundColor;
    const colorMain = getComputedStyle(document.querySelector('.main-slide')).backgroundColor;
    const colorFooter = getComputedStyle(document.querySelector('.footer')).backgroundColor;

    document.getElementById('colorEncabezado').value = rgbAHexadecimal(colorHeader);
    document.getElementById('colorMain').value = rgbAHexadecimal(colorMain);
    document.getElementById('colorFooter').value = rgbAHexadecimal(colorFooter);

    const fondoURLInput = document.getElementById('fondoPersonalizadoURL');
    const fondoFileInput = document.getElementById('fondoPersonalizadoFile');
    const fondoPreview = document.getElementById('fondoPersonalizadoPreview');

    fondoURLInput.value = imagenDeFondoPersonalizada.startsWith('data:') ? '' : imagenDeFondoPersonalizada;

    if (imagenDeFondoPersonalizada) {
        fondoPreview.src = imagenDeFondoPersonalizada;
        fondoPreview.classList.remove('oculto');
    } else {
        fondoPreview.src = '';
        fondoPreview.classList.add('oculto');
    }

    fondoFileInput.addEventListener('change', (event) => {
        const archivo = event.target.files[0];
        if (archivo) {
            const lector = new FileReader();
            lector.onload = function (e) {
                imagenDeFondoPersonalizada = e.target.result;
                fondoURLInput.value = '';
                fondoPreview.src = imagenDeFondoPersonalizada;
                fondoPreview.classList.remove('oculto');
            };
            lector.readAsDataURL(archivo);
        }
    });
}

// Funciones para ocultar la sección de personalización
function ocultarSeccionCustomizacion() {
    const seccionCustomizacion = document.getElementById('seccionCustomizacion');
    seccionCustomizacion.classList.add('hidden');
}

// Función para aplicar el tema seleccionado
function aplicarTema(theme) {
    if (theme === 'modoClaro') {
        modoActual = 'claro';
    } else if (theme === 'modoOscuro' || theme === 'modoOscuro') {
        modoActual = 'oscuro';
    }
    aplicarModo();
}

// Función para aplicar colores personalizados
function aplicarColoresPersonalizados() {
    const headerColor = document.getElementById('colorEncabezado').value;
    const mainColor = document.getElementById('colorMain').value;
    const footerColor = document.getElementById('colorFooter').value;
    const fondoURL = document.getElementById('fondoPersonalizadoURL').value.trim();

    // Aplicar colores personalizados
    document.querySelector('.header').style.backgroundColor = `rgba(${hexToRgb(headerColor)}, 0.8)`;
    document.querySelector('.main-slide').style.backgroundColor = mainColor;
    document.querySelector('.footer').style.backgroundColor = `rgba(${hexToRgb(footerColor)}, 0.8)`;
    coloresPersonalizados = { headerColor, mainColor, footerColor };

    // Aplicar fondo personalizado si se ha configurado
    if (fondoURL) {
        imagenDeFondoPersonalizada = fondoURL;
    }

    if (imagenDeFondoPersonalizada) {
        document.body.style.backgroundImage = `url('${imagenDeFondoPersonalizada}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.querySelector('.main-slide').style.backgroundColor = 'transparent';
    } else {
        document.body.style.backgroundImage = 'none';
        document.querySelector('.main-slide').style.backgroundColor = mainColor;
    }

    // Guardar en localStorage
    const temaPersonalizado = { headerColor, mainColor, footerColor, backgroundImage: imagenDeFondoPersonalizada };
    localStorage.setItem('customTheme', JSON.stringify(temaPersonalizado));
    localStorage.setItem('theme', 'custom');
    temaPersonalizadoActivado = true;

    modoActual = 'personalizado';

    // Remover temas predefinidos
    document.body.classList.remove('modo-oscuro');

    actualizarBotonTema();
    cerrarTemaModalFunc();
}


// Función para aplicar el tema seleccionado
function aplicarModo() {
    modos.forEach(modo => {
        if (modo.nombre === modoActual) {
            if (modo.nombre === 'personalizado') {
                // Configuración de color por defecto para modo personalizado
                const customDefaults = {
                    bgPrimary: '#f5f5f5',
                    bgSecondary: '#ffffff',
                    textPrimary: '#333333',
                    textSecondary: '#666666',
                    accentColor: '#6c63ff',
                    accentHover: '#5a52d5',
                    borderColor: '#e0e0e0',
                    shadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                };

                const bgPrimary = coloresPersonalizados.mainColor || customDefaults.bgPrimary;
                const headerColor = coloresPersonalizados.headerColor || customDefaults.bgSecondary;
                const footerColor = coloresPersonalizados.footerColor || customDefaults.bgSecondary;

                // Aplicar fondo y colores
                if (imagenDeFondoPersonalizada) {
                    document.body.style.backgroundImage = `url('${imagenDeFondoPersonalizada}')`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                    document.body.style.backgroundColor = 'transparent';
                    document.querySelector('.main-slide').style.backgroundColor = 'transparent';
                } else {
                    document.body.style.backgroundImage = 'none';
                    document.body.style.backgroundColor = customDefaults.bgPrimary;
                    document.querySelector('.main-slide').style.backgroundColor = bgPrimary;
                }

                document.body.style.setProperty('--bg-primary', bgPrimary);
                document.body.style.setProperty('--bg-secondary', customDefaults.bgSecondary);
                document.body.style.setProperty('--text-primary', customDefaults.textPrimary);
                document.body.style.setProperty('--text-secondary', customDefaults.textSecondary);
                document.body.style.setProperty('--accent-color', customDefaults.accentColor);
                document.body.style.setProperty('--accent-hover', customDefaults.accentHover);
                document.body.style.setProperty('--border-color', customDefaults.borderColor);
                document.body.style.setProperty('--shadow', customDefaults.shadow);

                document.querySelector('.header').style.backgroundColor = `rgba(${hexToRgb(headerColor)}, 0.8)`;
                document.querySelector('.footer').style.backgroundColor = `rgba(${hexToRgb(footerColor)}, 0.8)`;
                document.body.classList.remove('modo-oscuro');
            } else {
                // Aplicar modo predefinido
                document.body.style.backgroundImage = modo.bgImage;
                document.body.style.setProperty('--bg-primary', modo.bgPrimary);
                document.body.style.setProperty('--bg-secondary', modo.bgSecondary);
                document.body.style.setProperty('--text-primary', modo.textPrimary);
                document.body.style.setProperty('--text-secondary', modo.textSecondary);
                document.body.style.setProperty('--accent-color', modo.accentColor);
                document.body.style.setProperty('--accent-hover', modo.accentHover);
                document.body.style.setProperty('--border-color', modo.borderColor);
                document.body.style.setProperty('--shadow', modo.shadow);
                if (modo.nombre === 'oscuro') {
                    document.body.classList.add('modo-oscuro');
                } else {
                    document.body.classList.remove('modo-oscuro');
                }
                // Resetear colores personalizados
                document.querySelector('.header').style.backgroundColor = '';
                document.querySelector('.main-slide').style.backgroundColor = '';
                document.querySelector('.footer').style.backgroundColor = '';
            }
        }
    });
    actualizarBotonTema();
}

// Función para actualizar el ícono del botón de tema según el modo actual
function actualizarBotonTema() {
    const boton = document.getElementById('botonTema');
    const esTemaOscuro = document.body.classList.contains('modo-oscuro');
    boton.textContent = esTemaOscuro ? ' ☀️' : '🌙';
}

// ============================================
// MODAL DE AÑADIR TARJETA
// ============================================

function prepararAnyadirCartaModal() {
    const anyadirCartaModal = document.getElementById('modalAnadirCarta');
    const cerrarAnyadirModal = document.getElementById('cerrarModalAnadir');
    const cancelAddCard = document.getElementById('cancelarAnadirCarta');
    const addCardForm = document.getElementById('formularioAnadirCarta');
    const cardImage = document.getElementById('imagenCarta');

    // Cerrar modal
    cerrarAnyadirModal.addEventListener('click', closeAddCardModalFunc);
    cancelAddCard.addEventListener('click', closeAddCardModalFunc);

    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', (event) => {
        if (event.target === anyadirCartaModal) {
            closeAddCardModalFunc();
        }
    });

    // Manejar selección de archivo
    cardImage.addEventListener('change', handleFileSelect);

    // Enviar formulario
    addCardForm.addEventListener('submit', handleFormSubmit);
}

// Funciones para abrir el modal de añadir tarjeta
function openAddCardModal() {
    const addCardModal = document.getElementById('modalAnadirCarta');
    addCardModal.classList.add('show');
    resetFormData();
}

// Funciones para cerrar el modal de añadir tarjeta
function closeAddCardModalFunc() {
    const addCardModal = document.getElementById('modalAnadirCarta');
    addCardModal.classList.remove('show');
    resetFormData();
}

// Función para resetear los datos del formulario de añadir tarjeta
function resetFormData() {
    document.getElementById('formularioAnadirCarta').reset();
    document.getElementById('nombreArchivo').textContent = 'Ningún archivo seleccionado';
    document.getElementById('PreviewImagen').classList.add('oculto');
    archivoDeJuegoSeleccionado = null;
}

// Función para manejar la selección de archivo e mostrar vista previa
function handleFileSelect(e) {
    const file = e.target.files[0];
    const fileNameSpan = document.getElementById('nombreArchivo');
    const imagePreview = document.getElementById('PreviewImagen');

    if (file) {
        fileNameSpan.textContent = file.name;

        // Crear vista previa con FileReader
        const reader = new FileReader();
        reader.onload = function (event) {
            imagePreview.src = event.target.result;
            imagePreview.classList.remove('oculto');
            archivoDeJuegoSeleccionado = event.target.result; // Guardar como Data URL
        };
        reader.readAsDataURL(file);
    } else {
        fileNameSpan.textContent = 'Ningún archivo seleccionado';
        imagePreview.classList.add('oculto');
        archivoDeJuegoSeleccionado = null;
    }
}

// Función para manejar el envío del formulario de añadir tarjeta
function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('cartaTitulo').value.trim();
    const description = document.getElementById('cartaDescripcion').value.trim();
    const level = document.getElementById('cartaNivel').value;
    const category = document.getElementById('cartaCategoria').value;
    const hours = document.getElementById('cartaHoras').value.trim();

    if (!title || !description || !archivoDeJuegoSeleccionado) {
        alert('Por favor completa todos los campos e incluye una imagen.');
        return;
    }

    const newCard = {
        id: `c${juegosData.length + 1}`,
        titulo: title,
        descripcion: description,
        imagen: archivoDeJuegoSeleccionado,
        nivel: level,
        horas: hours,
        categoria: category
    };

    juegosData.push(newCard);
    juegosFiltrados = [...juegosData];

    renderizarCartas();
    document.getElementById('inputBusqueda').value = '';

    closeAddCardModalFunc();
    alert('✅ Nueva tarjeta añadida correctamente!');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function rgbAHexadecimal(rgb) {
    // Si ya es un hex, devolverlo
    if (rgb.startsWith('#')) {
        return rgb;
    }

    // Convertir rgb(255, 255, 255) a #ffffff
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return '#ffffff';

    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);

    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Función para convertir un color hex a rgb (sin el prefijo #)
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255'; 
}

// Función para mostrar un mensaje de error en el contenedor de tarjetas
function mostrarError(mensaje) {
    const container = document.getElementById('contenedorCarta');
    container.innerHTML = `
<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #f44336;">
<p style="font-size: 1.2rem; margin: 0;">⚠️ ${mensaje}</p>
</div>
`;
}