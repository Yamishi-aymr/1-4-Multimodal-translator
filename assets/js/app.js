/* ============================================================
   CONFIGURACIÓN
============================================================ */

const CHAT_API_URL =
    "https://1-4-multimodal-translator.vercel.app/api/chat";

const IMAGE_API_URL =
    "https://1-4-multimodal-translator.vercel.app/api/image";


const MAX_MESSAGE_LENGTH =
    2000;

const MAX_HISTORY_MESSAGES =
    8;

const MAX_IMAGE_SIZE =
    3 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


/* ============================================================
   CLASE PRINCIPAL DEL CHAT
============================================================ */

class TranslationChatApp {

    constructor() {

        this.form =
            document.getElementById(
                "chatForm"
            );

        this.messageInput =
            document.getElementById(
                "messageInput"
            );

        this.sendButton =
            document.getElementById(
                "sendButton"
            );

        this.conversation =
            document.getElementById(
                "conversation"
            );

        this.sourceLanguage =
            document.getElementById(
                "sourceLanguage"
            );

        this.targetLanguage =
            document.getElementById(
                "targetLanguage"
            );

        this.swapButton =
            document.getElementById(
                "swapLanguagesButton"
            );

        this.newConversationButton =
            document.getElementById(
                "newConversationButton"
            );

        this.characterCounter =
            document.getElementById(
                "characterCounter"
            );

        this.formMessage =
            document.getElementById(
                "formMessage"
            );

        this.statusText =
            document.getElementById(
                "statusText"
            );

        this.statusIndicator =
            document.getElementById(
                "statusIndicator"
            );

        this.translationDirection =
            document.getElementById(
                "translationDirection"
            );


        this.history = [];


        this.languageNames = {
            es: "Español",
            en: "English"
        };


        this.initialize();
    }


    /* ========================================================
       INICIALIZAR
    ======================================================== */

    initialize() {

        this.form.addEventListener(
            "submit",
            (event) => {

                this.handleSubmit(
                    event
                );

            }
        );


        this.messageInput.addEventListener(
            "input",
            () => {

                this.updateCharacterCounter();

            }
        );


        this.messageInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    this.form.requestSubmit();

                }

            }
        );


        this.swapButton.addEventListener(
            "click",
            () => {

                this.swapLanguages();

            }
        );


        this.sourceLanguage.addEventListener(
            "change",
            () => {

                this.handleSourceLanguageChange();

            }
        );


        this.targetLanguage.addEventListener(
            "change",
            () => {

                this.handleTargetLanguageChange();

            }
        );


        this.newConversationButton.addEventListener(
            "click",
            () => {

                this.resetConversation();

            }
        );


        this.updateCharacterCounter();

        this.updateLanguageDirection();

        this.setStatus(
            "ready",
            "IA disponible"
        );
    }


    /* ========================================================
       CAMBIO DE IDIOMA ORIGEN
    ======================================================== */

    handleSourceLanguageChange() {

        if (
            this.sourceLanguage.value ===
            this.targetLanguage.value
        ) {

            this.targetLanguage.value =
                this.sourceLanguage.value === "es"
                    ? "en"
                    : "es";
        }


        this.updateLanguageDirection();
    }


    /* ========================================================
       CAMBIO DE IDIOMA DESTINO
    ======================================================== */

    handleTargetLanguageChange() {

        if (
            this.sourceLanguage.value ===
            this.targetLanguage.value
        ) {

            this.sourceLanguage.value =
                this.targetLanguage.value === "es"
                    ? "en"
                    : "es";
        }


        this.updateLanguageDirection();
    }


    /* ========================================================
       INTERCAMBIAR IDIOMAS
    ======================================================== */

    swapLanguages() {

        const source =
            this.sourceLanguage.value;


        this.sourceLanguage.value =
            this.targetLanguage.value;


        this.targetLanguage.value =
            source;


        this.updateLanguageDirection();

        this.messageInput.focus();
    }


    /* ========================================================
       DIRECCIÓN DE TRADUCCIÓN
    ======================================================== */

    updateLanguageDirection() {

        const sourceName =
            this.languageNames[
                this.sourceLanguage.value
            ];


        const targetName =
            this.languageNames[
                this.targetLanguage.value
            ];


        this.translationDirection.textContent =
            `${sourceName} → ${targetName}`;
    }


    /* ========================================================
       CONTADOR
    ======================================================== */

    updateCharacterCounter() {

        const length =
            this.messageInput.value.length;


        this.characterCounter.textContent =
            `${length} / ${MAX_MESSAGE_LENGTH}`;
    }


    /* ========================================================
       ESTADO
    ======================================================== */

    setStatus(
        type,
        message
    ) {

        this.statusIndicator.classList.remove(
            "loading",
            "error"
        );


        if (type === "loading") {

            this.statusIndicator.classList.add(
                "loading"
            );
        }


        if (type === "error") {

            this.statusIndicator.classList.add(
                "error"
            );
        }


        this.statusText.textContent =
            message;
    }


    /* ========================================================
       MENSAJE DE ERROR
    ======================================================== */

    showFormMessage(message = "") {

        this.formMessage.textContent =
            message;
    }


    /* ========================================================
       ENVIAR MENSAJE
    ======================================================== */

    async handleSubmit(event) {

        event.preventDefault();


        this.showFormMessage();


        const message =
            this.messageInput.value.trim();


        const source =
            this.sourceLanguage.value;


        const target =
            this.targetLanguage.value;


        if (!message) {

            this.showFormMessage(
                "Escribe un mensaje antes de traducir."
            );

            this.messageInput.focus();

            return;
        }


        if (
            message.length >
            MAX_MESSAGE_LENGTH
        ) {

            this.showFormMessage(
                "El mensaje no puede superar los 2000 caracteres."
            );

            return;
        }


        if (source === target) {

            this.showFormMessage(
                "El idioma de origen y destino deben ser diferentes."
            );

            return;
        }


        const historyForRequest =
            this.history.slice(
                -MAX_HISTORY_MESSAGES
            );


        this.setLoading(
            true
        );


        this.setStatus(
            "loading",
            "Traduciendo..."
        );


        try {

            const response =
                await fetch(
                    CHAT_API_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                message:
                                    message,

                                source_language:
                                    source,

                                target_language:
                                    target,

                                history:
                                    historyForRequest
                            })
                    }
                );


            let data;


            try {

                data =
                    await response.json();

            }
            catch {

                throw new Error(
                    "El servidor devolvió una respuesta no válida."
                );
            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "No fue posible realizar la traducción."
                );
            }


            if (!data.translation) {

                throw new Error(
                    "La IA no devolvió una traducción."
                );
            }


            const chatMessage = {

                original:
                    data.original ||
                    message,

                translation:
                    data.translation,

                source_language:
                    data.source_language ||
                    source,

                target_language:
                    data.target_language ||
                    target
            };


            this.history.push(
                chatMessage
            );


            this.renderMessage(
                chatMessage
            );


            this.messageInput.value =
                "";


            this.updateCharacterCounter();


            this.setStatus(
                "ready",
                "Traducción terminada"
            );


            this.messageInput.focus();
        }
        catch (error) {

            console.error(
                "Error al traducir:",
                error
            );


            this.showFormMessage(
                error.message
            );


            this.setStatus(
                "error",
                "Error"
            );
        }
        finally {

            this.setLoading(
                false
            );
        }
    }


    /* ========================================================
       CARGANDO
    ======================================================== */

    setLoading(isLoading) {

        this.sendButton.disabled =
            isLoading;


        this.messageInput.disabled =
            isLoading;


        this.sourceLanguage.disabled =
            isLoading;


        this.targetLanguage.disabled =
            isLoading;


        this.swapButton.disabled =
            isLoading;


        this.sendButton.textContent =
            isLoading
                ? "Traduciendo..."
                : "Traducir mensaje";
    }


    /* ========================================================
       RENDERIZAR MENSAJE
    ======================================================== */

    renderMessage(chatMessage) {

        const emptyConversation =
            document.getElementById(
                "emptyConversation"
            );


        if (emptyConversation) {

            emptyConversation.remove();
        }


        const wrapper =
            document.createElement(
                "article"
            );


        wrapper.className =
            `chat-message message-${chatMessage.source_language}`;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "message-card";


        /* ====================================================
           CABECERA
        ==================================================== */

        const header =
            document.createElement(
                "div"
            );


        header.className =
            "message-header";


        const participant =
            document.createElement(
                "span"
            );


        participant.className =
            "participant-name";


        participant.textContent =
            chatMessage.source_language === "es"
                ? "Participante Español"
                : "English Participant";


        const languageBadge =
            document.createElement(
                "span"
            );


        languageBadge.className =
            "language-badge";


        languageBadge.textContent =
            `${this.languageNames[
                chatMessage.source_language
            ]} → ${this.languageNames[
                chatMessage.target_language
            ]}`;


        header.appendChild(
            participant
        );


        header.appendChild(
            languageBadge
        );


        /* ====================================================
           ORIGINAL
        ==================================================== */

        const originalSection =
            this.createMessageSection(
                "Original",
                chatMessage.original,
                false
            );


        /* ====================================================
           TRADUCCIÓN
        ==================================================== */

        const translationSection =
            this.createMessageSection(
                "Traducción",
                chatMessage.translation,
                true
            );


        card.appendChild(
            header
        );


        card.appendChild(
            originalSection
        );


        card.appendChild(
            translationSection
        );


        wrapper.appendChild(
            card
        );


        this.conversation.appendChild(
            wrapper
        );


        this.conversation.scrollTop =
            this.conversation.scrollHeight;
    }


    /* ========================================================
       CREAR SECCIÓN
    ======================================================== */

    createMessageSection(
        label,
        text,
        isTranslation
    ) {

        const section =
            document.createElement(
                "div"
            );


        section.className =
            isTranslation
                ? "message-section translation-section"
                : "message-section";


        const labelElement =
            document.createElement(
                "span"
            );


        labelElement.className =
            "message-label";


        labelElement.textContent =
            label;


        const textElement =
            document.createElement(
                "p"
            );


        textElement.className =
            "message-text";


        textElement.textContent =
            text;


        section.appendChild(
            labelElement
        );


        section.appendChild(
            textElement
        );


        return section;
    }


    /* ========================================================
       NUEVA CONVERSACIÓN
    ======================================================== */

    resetConversation() {

        this.history = [];


        this.conversation.innerHTML = `
            <div
                id="emptyConversation"
                class="empty-conversation"
            >
                <div class="empty-icon">
                    💬
                </div>

                <h3>
                    Inicia una conversación
                </h3>

                <p>
                    Escribe un mensaje en español o inglés.
                    Aquí aparecerán el contenido original y
                    su traducción.
                </p>
            </div>
        `;


        this.messageInput.value =
            "";


        this.showFormMessage();

        this.updateCharacterCounter();


        this.setStatus(
            "ready",
            "IA disponible"
        );


        this.messageInput.focus();
    }
}


/* ============================================================
   CLASE PARA TRADUCCIÓN DE IMÁGENES
============================================================ */

class ImageTranslationApp {

    constructor() {

        this.form =
            document.getElementById(
                "imageForm"
            );

        this.fileInput =
            document.getElementById(
                "imageInput"
            );

        this.preview =
            document.getElementById(
                "imagePreview"
            );

        this.previewPlaceholder =
            document.getElementById(
                "imagePreviewPlaceholder"
            );

        this.translateButton =
            document.getElementById(
                "imageTranslateButton"
            );

        this.sourceLanguage =
            document.getElementById(
                "imageSourceLanguage"
            );

        this.targetLanguage =
            document.getElementById(
                "imageTargetLanguage"
            );

        this.swapButton =
            document.getElementById(
                "imageSwapLanguagesButton"
            );

        this.translationDirection =
            document.getElementById(
                "imageTranslationDirection"
            );

        this.formMessage =
            document.getElementById(
                "imageFormMessage"
            );

        this.results =
            document.getElementById(
                "imageResults"
            );

        this.detectedText =
            document.getElementById(
                "detectedImageText"
            );

        this.translatedText =
            document.getElementById(
                "translatedImageText"
            );

        this.detectedLanguage =
            document.getElementById(
                "detectedImageLanguage"
            );

        this.confidence =
            document.getElementById(
                "imageConfidence"
            );

        this.warning =
            document.getElementById(
                "imageWarning"
            );

        this.statusText =
            document.getElementById(
                "statusText"
            );

        this.statusIndicator =
            document.getElementById(
                "statusIndicator"
            );


        this.imageData =
            "";


        this.languageNames = {
            es: "Español",
            en: "English",
            unknown: "No identificado"
        };


        this.confidenceNames = {
            high: "Alto",
            medium: "Medio",
            low: "Bajo"
        };


        this.initialize();
    }


    /* ========================================================
       INICIALIZAR
    ======================================================== */

    initialize() {

        this.fileInput.addEventListener(
            "change",
            () => {

                this.handleImageSelection();

            }
        );


        this.form.addEventListener(
            "submit",
            (event) => {

                this.handleSubmit(
                    event
                );

            }
        );


        this.swapButton.addEventListener(
            "click",
            () => {

                this.swapLanguages();

            }
        );


        this.sourceLanguage.addEventListener(
            "change",
            () => {

                this.handleSourceLanguageChange();

            }
        );


        this.targetLanguage.addEventListener(
            "change",
            () => {

                this.handleTargetLanguageChange();

            }
        );


        this.updateLanguageDirection();
    }


    /* ========================================================
       CAMBIO DE IDIOMA ORIGEN
    ======================================================== */

    handleSourceLanguageChange() {

        if (
            this.sourceLanguage.value ===
            this.targetLanguage.value
        ) {

            this.targetLanguage.value =
                this.sourceLanguage.value === "es"
                    ? "en"
                    : "es";
        }


        this.updateLanguageDirection();

        this.clearResults();
    }


    /* ========================================================
       CAMBIO DE IDIOMA DESTINO
    ======================================================== */

    handleTargetLanguageChange() {

        if (
            this.sourceLanguage.value ===
            this.targetLanguage.value
        ) {

            this.sourceLanguage.value =
                this.targetLanguage.value === "es"
                    ? "en"
                    : "es";
        }


        this.updateLanguageDirection();

        this.clearResults();
    }


    /* ========================================================
       INTERCAMBIAR IDIOMAS
    ======================================================== */

    swapLanguages() {

        const source =
            this.sourceLanguage.value;


        this.sourceLanguage.value =
            this.targetLanguage.value;


        this.targetLanguage.value =
            source;


        this.updateLanguageDirection();

        this.clearResults();
    }


    /* ========================================================
       ACTUALIZAR DIRECCIÓN
    ======================================================== */

    updateLanguageDirection() {

        const sourceName =
            this.languageNames[
                this.sourceLanguage.value
            ];


        const targetName =
            this.languageNames[
                this.targetLanguage.value
            ];


        this.translationDirection.textContent =
            `${sourceName} → ${targetName}`;
    }


    /* ========================================================
       SELECCIONAR IMAGEN
    ======================================================== */

    handleImageSelection() {

        this.showFormMessage();

        this.clearResults();

        this.imageData =
            "";


        this.translateButton.disabled =
            true;


        this.preview.removeAttribute(
            "src"
        );


        this.preview.classList.add(
            "d-none"
        );


        this.previewPlaceholder.classList.remove(
            "d-none"
        );


        const file =
            this.fileInput.files[0];


        if (!file) {

            return;
        }


        /* ====================================================
           VALIDAR TIPO
        ==================================================== */

        if (
            !ALLOWED_IMAGE_TYPES.includes(
                file.type
            )
        ) {

            this.showFormMessage(
                "Formato no permitido. Usa JPG, PNG o WebP."
            );


            this.fileInput.value =
                "";


            return;
        }


        /* ====================================================
           VALIDAR TAMAÑO
        ==================================================== */

        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            this.showFormMessage(
                "La imagen debe pesar como máximo 3 MB."
            );


            this.fileInput.value =
                "";


            return;
        }


        if (
            file.size === 0
        ) {

            this.showFormMessage(
                "La imagen seleccionada está vacía."
            );


            this.fileInput.value =
                "";


            return;
        }


        /* ====================================================
           LEER ARCHIVO
        ==================================================== */

        const reader =
            new FileReader();


        reader.onload =
            () => {

                this.imageData =
                    reader.result;


                this.preview.src =
                    this.imageData;


                this.preview.classList.remove(
                    "d-none"
                );


                this.previewPlaceholder.classList.add(
                    "d-none"
                );


                this.translateButton.disabled =
                    false;


                this.setStatus(
                    "ready",
                    "Imagen lista"
                );
            };


        reader.onerror =
            () => {

                this.imageData =
                    "";


                this.translateButton.disabled =
                    true;


                this.showFormMessage(
                    "No fue posible leer la imagen seleccionada."
                );


                this.setStatus(
                    "error",
                    "Error"
                );
            };


        reader.readAsDataURL(
            file
        );
    }


    /* ========================================================
       ENVIAR IMAGEN
    ======================================================== */

    async handleSubmit(event) {

        event.preventDefault();


        this.showFormMessage();

        this.clearResults();


        if (!this.imageData) {

            this.showFormMessage(
                "Selecciona una imagen antes de traducir."
            );

            return;
        }


        const source =
            this.sourceLanguage.value;


        const target =
            this.targetLanguage.value;


        if (source === target) {

            this.showFormMessage(
                "El idioma de origen y destino deben ser diferentes."
            );

            return;
        }


        this.setLoading(
            true
        );


        this.setStatus(
            "loading",
            "Analizando imagen..."
        );


        try {

            const response =
                await fetch(
                    IMAGE_API_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                image_data:
                                    this.imageData,

                                image_url:
                                    "",

                                source_language:
                                    source,

                                target_language:
                                    target
                            })
                    }
                );


            let data;


            try {

                data =
                    await response.json();

            }
            catch {

                throw new Error(
                    "El servidor devolvió una respuesta no válida."
                );
            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "No fue posible traducir la imagen."
                );
            }


            /* =================================================
               IMAGEN SIN TEXTO
            ================================================= */

            if (!data.has_text) {

                this.results.classList.remove(
                    "d-none"
                );


                this.detectedText.textContent =
                    "No se encontró texto legible.";


                this.translatedText.textContent =
                    "No hay contenido disponible para traducir.";


                this.detectedLanguage.textContent =
                    this.languageNames[
                        data.detected_language
                    ] ||
                    "No identificado";


                this.confidence.textContent =
                    this.confidenceNames[
                        data.confidence
                    ] ||
                    "Bajo";


                this.showWarning(
                    data.warning ||
                    "La imagen no contiene texto legible o su calidad no permite identificarlo con seguridad."
                );


                this.setStatus(
                    "ready",
                    "Análisis terminado"
                );


                return;
            }


            /* =================================================
               RESULTADO EXITOSO
            ================================================= */

            this.results.classList.remove(
                "d-none"
            );


            this.detectedText.textContent =
                data.detected_text ||
                "No se pudo recuperar el texto detectado.";


            this.translatedText.textContent =
                data.translation ||
                "No se recibió una traducción.";


            this.detectedLanguage.textContent =
                this.languageNames[
                    data.detected_language
                ] ||
                "No identificado";


            this.confidence.textContent =
                this.confidenceNames[
                    data.confidence
                ] ||
                "No disponible";


            if (
                data.warning &&
                data.warning.trim()
            ) {

                this.showWarning(
                    data.warning
                );

            }
            else {

                this.hideWarning();
            }


            this.setStatus(
                "ready",
                "Imagen traducida"
            );


            this.results.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "nearest"
            });
        }
        catch (error) {

            console.error(
                "Error al traducir imagen:",
                error
            );


            this.showFormMessage(
                error.message
            );


            this.setStatus(
                "error",
                "Error"
            );
        }
        finally {

            this.setLoading(
                false
            );
        }
    }


    /* ========================================================
       CARGANDO
    ======================================================== */

    setLoading(isLoading) {

        this.fileInput.disabled =
            isLoading;


        this.sourceLanguage.disabled =
            isLoading;


        this.targetLanguage.disabled =
            isLoading;


        this.swapButton.disabled =
            isLoading;


        this.translateButton.disabled =
            isLoading ||
            !this.imageData;


        this.translateButton.textContent =
            isLoading
                ? "Analizando y traduciendo..."
                : "Traducir imagen";
    }


    /* ========================================================
       LIMPIAR RESULTADOS
    ======================================================== */

    clearResults() {

        this.results.classList.add(
            "d-none"
        );


        this.detectedText.textContent =
            "";


        this.translatedText.textContent =
            "";


        this.detectedLanguage.textContent =
            "-";


        this.confidence.textContent =
            "-";


        this.hideWarning();
    }


    /* ========================================================
       ADVERTENCIA
    ======================================================== */

    showWarning(message) {

        this.warning.textContent =
            message;


        this.warning.classList.remove(
            "d-none"
        );
    }


    hideWarning() {

        this.warning.textContent =
            "";


        this.warning.classList.add(
            "d-none"
        );
    }


    /* ========================================================
       MENSAJE DE FORMULARIO
    ======================================================== */

    showFormMessage(message = "") {

        this.formMessage.textContent =
            message;
    }


    /* ========================================================
       ESTADO GLOBAL
    ======================================================== */

    setStatus(
        type,
        message
    ) {

        this.statusIndicator.classList.remove(
            "loading",
            "error"
        );


        if (type === "loading") {

            this.statusIndicator.classList.add(
                "loading"
            );
        }


        if (type === "error") {

            this.statusIndicator.classList.add(
                "error"
            );
        }


        this.statusText.textContent =
            message;
    }
}


/* ============================================================
   CAMBIO ENTRE MÓDULOS
============================================================ */

function initializeModeNavigation() {

    const chatModeButton =
        document.getElementById(
            "chatModeButton"
        );


    const imageModeButton =
        document.getElementById(
            "imageModeButton"
        );


    const statusText =
        document.getElementById(
            "statusText"
        );


    const statusIndicator =
        document.getElementById(
            "statusIndicator"
        );


    if (
        chatModeButton &&
        statusText &&
        statusIndicator
    ) {

        chatModeButton.addEventListener(
            "shown.bs.tab",
            () => {

                statusIndicator.classList.remove(
                    "loading",
                    "error"
                );


                statusText.textContent =
                    "IA disponible";
            }
        );
    }


    if (
        imageModeButton &&
        statusText &&
        statusIndicator
    ) {

        imageModeButton.addEventListener(
            "shown.bs.tab",
            () => {

                statusIndicator.classList.remove(
                    "loading",
                    "error"
                );


                statusText.textContent =
                    "Traductor de imágenes disponible";
            }
        );
    }
}


/* ============================================================
   INICIAR APLICACIÓN
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        new TranslationChatApp();

        new ImageTranslationApp();

        initializeModeNavigation();
    }
);