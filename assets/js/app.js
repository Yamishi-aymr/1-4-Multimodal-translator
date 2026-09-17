/* ============================================================
   CONFIGURACIÓN
============================================================ */

const CHAT_API_URL =
    "https://1-4-multimodal-translator.vercel.app/api/chat";

const IMAGE_API_URL =
    "https://1-4-multimodal-translator.vercel.app/api/image";

const DOCUMENT_API_URL =
    "https://1-4-multimodal-translator.vercel.app/api/document";

const AUDIO_API_URL =
    "https://1-4-multimodal-translator.vercel.app/api/audio";

const SPEECH_API_URL =
    "https://1-4-multimodal-translator.vercel.app/api/speech";


const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 8;

const MAX_IMAGE_SIZE =
    3 * 1024 * 1024;

const MAX_DOCUMENT_SIZE =
    2 * 1024 * 1024;

const MAX_AUDIO_SIZE =
    3 * 1024 * 1024;


const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


const ALLOWED_DOCUMENT_EXTENSIONS = [
    ".pdf",
    ".txt",
    ".docx"
];


const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];


const ALLOWED_AUDIO_EXTENSIONS = [
    ".mp3",
    ".wav",
    ".m4a",
    ".webm"
];


const ALLOWED_AUDIO_TYPES = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/webm",
    "video/webm"
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
       DIRECCIÓN
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
       MENSAJE
    ======================================================== */

    showFormMessage(message = "") {

        this.formMessage.textContent =
            message;
    }


    /* ========================================================
       ENVIAR
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
       RENDERIZAR
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


        const originalSection =
            this.createMessageSection(
                "Original",
                chatMessage.original,
                false
            );


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


    showFormMessage(message = "") {

        this.formMessage.textContent =
            message;
    }


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
   CLASE PARA TRADUCCIÓN DE AUDIO
============================================================ */

class AudioTranslationApp {

    constructor() {

        this.form =
            document.getElementById(
                "audioForm"
            );

        this.fileInput =
            document.getElementById(
                "audioInput"
            );

        this.sourceLanguage =
            document.getElementById(
                "audioSourceLanguage"
            );

        this.targetLanguage =
            document.getElementById(
                "audioTargetLanguage"
            );

        this.swapButton =
            document.getElementById(
                "audioSwapLanguagesButton"
            );

        this.translationDirection =
            document.getElementById(
                "audioTranslationDirection"
            );

        this.translateButton =
            document.getElementById(
                "audioTranslateButton"
            );

        this.formMessage =
            document.getElementById(
                "audioFormMessage"
            );


        /* ====================================================
           GRABACIÓN
        ==================================================== */

        this.recordButton =
            document.getElementById(
                "audioRecordButton"
            );

        this.stopButton =
            document.getElementById(
                "audioStopButton"
            );

        this.recordingStatus =
            document.getElementById(
                "audioRecordingStatus"
            );

        this.recordingTimer =
            document.getElementById(
                "audioRecordingTimer"
            );


        /* ====================================================
           INFORMACIÓN DEL AUDIO
        ==================================================== */

        this.filePlaceholder =
            document.getElementById(
                "audioFilePlaceholder"
            );

        this.fileInfo =
            document.getElementById(
                "audioFileInfo"
            );

        this.fileName =
            document.getElementById(
                "audioFileName"
            );

        this.fileSize =
            document.getElementById(
                "audioFileSize"
            );

        this.preview =
            document.getElementById(
                "audioPreview"
            );


        /* ====================================================
           RESULTADOS
        ==================================================== */

        this.results =
            document.getElementById(
                "audioResults"
            );

        this.processedFileName =
            document.getElementById(
                "processedAudioName"
            );

        this.transcription =
            document.getElementById(
                "audioTranscription"
            );

        this.translatedText =
            document.getElementById(
                "audioTranslatedText"
            );

        this.detectedLanguage =
            document.getElementById(
                "detectedAudioLanguage"
            );

        this.warning =
            document.getElementById(
                "audioWarning"
            );


        /* ====================================================
           VOZ DE LA TRADUCCIÓN
        ==================================================== */

        this.speechButton =
            document.getElementById(
                "audioSpeechButton"
            );

        this.speechStatus =
            document.getElementById(
                "audioSpeechStatus"
            );

        this.speechPlayerContainer =
            document.getElementById(
                "audioSpeechPlayerContainer"
            );

        this.speechPlayer =
            document.getElementById(
                "audioSpeechPlayer"
            );


        /* ====================================================
           ESTADO GLOBAL
        ==================================================== */

        this.statusText =
            document.getElementById(
                "statusText"
            );

        this.statusIndicator =
            document.getElementById(
                "statusIndicator"
            );


        this.audioData = "";

        this.selectedFile = null;

        this.previewUrl = null;


        /* ====================================================
           ESTADO DE GRABACIÓN
        ==================================================== */

        this.mediaRecorder = null;

        this.mediaStream = null;

        this.recordingChunks = [];

        this.recordingMimeType = "";

        this.recordingStartTime = 0;

        this.recordingTimerInterval = null;

        this.recordingAutoStopTimeout = null;

        this.maxRecordingSeconds = 60;

        this.isRecording = false;

        this.isProcessing = false;


        /* ====================================================
           ESTADO DE VOZ
        ==================================================== */

        this.speechUrl = null;

        this.speechText = "";

        this.speechTargetLanguage = "";

        this.isGeneratingSpeech = false;


        this.languageNames = {
            es: "Español",
            en: "English",
            unknown: "No identificado"
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

                this.handleFileSelection();
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


        if (this.recordButton) {

            this.recordButton.addEventListener(
                "click",
                () => {

                    this.startRecording();
                }
            );
        }


        if (this.stopButton) {

            this.stopButton.addEventListener(
                "click",
                () => {

                    this.stopRecording();
                }
            );
        }


        if (this.speechButton) {

            this.speechButton.addEventListener(
                "click",
                () => {

                    this.handleSpeech();
                }
            );
        }


        window.addEventListener(
            "beforeunload",
            () => {

                this.cleanupRecordingResources();

                this.cleanupSpeech();
            }
        );


        this.updateLanguageDirection();

        this.updateControls();
    }


    /* ========================================================
       IDIOMA ORIGEN
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
       IDIOMA DESTINO
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
       DIRECCIÓN
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
       SELECCIONAR AUDIO
    ======================================================== */

    handleFileSelection() {

        this.showFormMessage();

        this.clearResults();


        const file =
            this.fileInput.files[0];


        if (!file) {

            this.resetSelectedFile(
                false
            );

            return;
        }


        this.loadAudioFile(
            file,
            true
        );
    }


    /* ========================================================
       CARGAR AUDIO
    ======================================================== */

    loadAudioFile(
        file,
        clearInputOnError = false
    ) {

        this.resetSelectedFile(
            false
        );


        const extension =
            this.getFileExtension(
                file.name
            );


        if (
            !ALLOWED_AUDIO_EXTENSIONS.includes(
                extension
            )
        ) {

            this.showFormMessage(
                "Formato no permitido. Usa MP3, WAV, M4A o WebM."
            );


            if (clearInputOnError) {

                this.fileInput.value = "";
            }


            this.updateControls();

            return;
        }


        if (
            file.type &&
            !ALLOWED_AUDIO_TYPES.includes(
                file.type
            )
        ) {

            this.showFormMessage(
                "El tipo de archivo de audio no es válido."
            );


            if (clearInputOnError) {

                this.fileInput.value = "";
            }


            this.updateControls();

            return;
        }


        if (
            file.size >
            MAX_AUDIO_SIZE
        ) {

            this.showFormMessage(
                "El audio debe pesar como máximo 3 MB."
            );


            if (clearInputOnError) {

                this.fileInput.value = "";
            }


            this.updateControls();

            return;
        }


        if (file.size === 0) {

            this.showFormMessage(
                "El archivo de audio está vacío."
            );


            if (clearInputOnError) {

                this.fileInput.value = "";
            }


            this.updateControls();

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            () => {

                this.audioData =
                    reader.result;

                this.selectedFile =
                    file;


                this.showFileInformation(
                    file
                );


                this.setAudioPreview(
                    file
                );


                this.setStatus(
                    "ready",
                    "Audio listo"
                );


                this.updateControls();
            };


        reader.onerror =
            () => {

                this.resetSelectedFile(
                    clearInputOnError
                );


                this.showFormMessage(
                    "No fue posible leer el archivo de audio."
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
       INICIAR GRABACIÓN
    ======================================================== */

    async startRecording() {

        this.showFormMessage();

        this.clearResults();


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia ||
            typeof MediaRecorder === "undefined"
        ) {

            this.showFormMessage(
                "Este navegador no permite grabar audio desde el micrófono."
            );

            return;
        }


        if (this.isRecording) {

            return;
        }


        this.fileInput.value = "";

        this.resetSelectedFile(
            false
        );


        try {

            this.mediaStream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });


            this.recordingMimeType =
                this.getSupportedRecordingMimeType();


            const recorderOptions =
                this.recordingMimeType
                    ? {
                        mimeType:
                            this.recordingMimeType
                    }
                    : undefined;


            this.mediaRecorder =
                recorderOptions
                    ? new MediaRecorder(
                        this.mediaStream,
                        recorderOptions
                    )
                    : new MediaRecorder(
                        this.mediaStream
                    );


            this.recordingChunks = [];


            this.mediaRecorder.addEventListener(
                "dataavailable",
                (event) => {

                    if (
                        event.data &&
                        event.data.size > 0
                    ) {

                        this.recordingChunks.push(
                            event.data
                        );
                    }
                }
            );


            this.mediaRecorder.addEventListener(
                "stop",
                () => {

                    this.finishRecording();
                },
                {
                    once: true
                }
            );


            this.mediaRecorder.addEventListener(
                "error",
                () => {

                    this.handleRecordingError(
                        "Ocurrió un error durante la grabación."
                    );
                },
                {
                    once: true
                }
            );


            this.isRecording = true;

            this.recordingStartTime =
                Date.now();


            this.updateRecordingTimer();

            this.recordingTimerInterval =
                window.setInterval(
                    () => {

                        this.updateRecordingTimer();
                    },
                    250
                );


            this.recordingAutoStopTimeout =
                window.setTimeout(
                    () => {

                        if (this.isRecording) {

                            this.stopRecording();
                        }
                    },
                    this.maxRecordingSeconds * 1000
                );


            this.mediaRecorder.start(
                250
            );


            this.recordingStatus.textContent =
                "🔴 Grabando... habla ahora";


            this.setStatus(
                "loading",
                "Grabando audio..."
            );


            this.updateControls();

        }
        catch (error) {

            console.error(
                "Error al acceder al micrófono:",
                error
            );


            this.cleanupRecordingResources();

            this.isRecording = false;


            let message =
                "No fue posible acceder al micrófono.";


            if (
                error &&
                error.name === "NotAllowedError"
            ) {

                message =
                    "Permite el acceso al micrófono en el navegador para poder grabar.";
            }
            else if (
                error &&
                error.name === "NotFoundError"
            ) {

                message =
                    "No se encontró ningún micrófono disponible.";
            }


            this.showFormMessage(
                message
            );


            this.recordingStatus.textContent =
                "Micrófono inactivo";


            this.setStatus(
                "error",
                "Error"
            );


            this.updateControls();
        }
    }


    /* ========================================================
       DETENER GRABACIÓN
    ======================================================== */

    stopRecording() {

        if (
            !this.mediaRecorder ||
            !this.isRecording
        ) {

            return;
        }


        this.isRecording = false;


        this.recordingStatus.textContent =
            "Procesando grabación...";


        this.clearRecordingTimers();


        if (
            this.mediaRecorder.state !==
            "inactive"
        ) {

            this.mediaRecorder.stop();
        }


        this.stopMediaStream();

        this.updateControls();
    }


    /* ========================================================
       FINALIZAR GRABACIÓN
    ======================================================== */

    finishRecording() {

        try {

            const recorderType =
                this.mediaRecorder &&
                this.mediaRecorder.mimeType
                    ? this.mediaRecorder.mimeType
                    : this.recordingMimeType;


            const isMp4 =
                String(
                    recorderType
                )
                .toLowerCase()
                .includes(
                    "mp4"
                );


            const normalizedMimeType =
                isMp4
                    ? "audio/mp4"
                    : "audio/webm";


            const extension =
                isMp4
                    ? ".m4a"
                    : ".webm";


            const blob =
                new Blob(
                    this.recordingChunks,
                    {
                        type:
                            normalizedMimeType
                    }
                );


            this.cleanupRecordingResources();


            if (blob.size === 0) {

                this.showFormMessage(
                    "La grabación está vacía. Intenta nuevamente."
                );


                this.recordingStatus.textContent =
                    "Micrófono inactivo";


                this.setStatus(
                    "error",
                    "Error"
                );


                this.updateControls();

                return;
            }


            if (
                blob.size >
                MAX_AUDIO_SIZE
            ) {

                this.showFormMessage(
                    "La grabación supera el límite de 3 MB. Intenta grabar un audio más corto."
                );


                this.recordingStatus.textContent =
                    "Grabación demasiado grande";


                this.setStatus(
                    "error",
                    "Error"
                );


                this.updateControls();

                return;
            }


            const file =
                new File(
                    [
                        blob
                    ],
                    this.createRecordingFilename(
                        extension
                    ),
                    {
                        type:
                            normalizedMimeType,

                        lastModified:
                            Date.now()
                    }
                );


            this.recordingStatus.textContent =
                "Grabación lista";


            this.loadAudioFile(
                file,
                false
            );

        }
        catch (error) {

            console.error(
                "Error al preparar la grabación:",
                error
            );


            this.handleRecordingError(
                "No fue posible preparar el audio grabado."
            );
        }
    }


    /* ========================================================
       MIME PARA GRABACIÓN
    ======================================================== */

    getSupportedRecordingMimeType() {

        const candidates = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4"
        ];


        for (
            const candidate
            of candidates
        ) {

            if (
                MediaRecorder.isTypeSupported(
                    candidate
                )
            ) {

                return candidate;
            }
        }


        return "";
    }


    /* ========================================================
       NOMBRE DE GRABACIÓN
    ======================================================== */

    createRecordingFilename(extension) {

        const now =
            new Date();


        const pad =
            (value) =>
                String(
                    value
                ).padStart(
                    2,
                    "0"
                );


        const stamp =
            `${now.getFullYear()}-${pad(
                now.getMonth() + 1
            )}-${pad(
                now.getDate()
            )}_${pad(
                now.getHours()
            )}-${pad(
                now.getMinutes()
            )}-${pad(
                now.getSeconds()
            )}`;


        return `grabacion_${stamp}${extension}`;
    }


    /* ========================================================
       TEMPORIZADOR
    ======================================================== */

    updateRecordingTimer() {

        const elapsedSeconds =
            Math.min(
                Math.floor(
                    (
                        Date.now() -
                        this.recordingStartTime
                    ) /
                    1000
                ),
                this.maxRecordingSeconds
            );


        this.recordingTimer.textContent =
            this.formatDuration(
                elapsedSeconds
            );
    }


    formatDuration(seconds) {

        const minutes =
            Math.floor(
                seconds / 60
            );


        const remainingSeconds =
            seconds % 60;


        return `${
            String(
                minutes
            ).padStart(
                2,
                "0"
            )
        }:${
            String(
                remainingSeconds
            ).padStart(
                2,
                "0"
            )
        }`;
    }


    /* ========================================================
       LIMPIAR TEMPORIZADORES
    ======================================================== */

    clearRecordingTimers() {

        if (
            this.recordingTimerInterval
        ) {

            window.clearInterval(
                this.recordingTimerInterval
            );

            this.recordingTimerInterval =
                null;
        }


        if (
            this.recordingAutoStopTimeout
        ) {

            window.clearTimeout(
                this.recordingAutoStopTimeout
            );

            this.recordingAutoStopTimeout =
                null;
        }
    }


    /* ========================================================
       DETENER MICRÓFONO
    ======================================================== */

    stopMediaStream() {

        if (!this.mediaStream) {

            return;
        }


        this.mediaStream
            .getTracks()
            .forEach(
                (track) => {

                    track.stop();
                }
            );


        this.mediaStream =
            null;
    }


    /* ========================================================
       LIMPIAR RECURSOS DE GRABACIÓN
    ======================================================== */

    cleanupRecordingResources() {

        this.clearRecordingTimers();

        this.stopMediaStream();

        this.recordingChunks = [];

        this.recordingMimeType = "";

        this.mediaRecorder = null;
    }


    /* ========================================================
       ERROR DE GRABACIÓN
    ======================================================== */

    handleRecordingError(message) {

        this.isRecording = false;

        this.cleanupRecordingResources();


        this.recordingStatus.textContent =
            "Micrófono inactivo";


        this.recordingTimer.textContent =
            "00:00";


        this.showFormMessage(
            message
        );


        this.setStatus(
            "error",
            "Error"
        );


        this.updateControls();
    }


    /* ========================================================
       EXTENSIÓN
    ======================================================== */

    getFileExtension(filename) {

        const lastDot =
            filename.lastIndexOf(".");


        if (lastDot === -1) {

            return "";
        }


        return filename
            .slice(lastDot)
            .toLowerCase();
    }


    /* ========================================================
       INFORMACIÓN DEL AUDIO
    ======================================================== */

    showFileInformation(file) {

        this.filePlaceholder.classList.add(
            "d-none"
        );


        this.fileInfo.classList.remove(
            "d-none"
        );


        this.fileName.textContent =
            file.name;


        this.fileSize.textContent =
            this.formatFileSize(
                file.size
            );
    }


    /* ========================================================
       REPRODUCTOR
    ======================================================== */

    setAudioPreview(file) {

        if (this.previewUrl) {

            URL.revokeObjectURL(
                this.previewUrl
            );
        }


        this.previewUrl =
            URL.createObjectURL(
                file
            );


        this.preview.src =
            this.previewUrl;


        this.preview.load();
    }


    /* ========================================================
       FORMATEAR TAMAÑO
    ======================================================== */

    formatFileSize(bytes) {

        if (bytes < 1024) {

            return `${bytes} bytes`;
        }


        if (
            bytes <
            1024 * 1024
        ) {

            return `${
                (
                    bytes / 1024
                ).toFixed(1)
            } KB`;
        }


        return `${
            (
                bytes /
                (1024 * 1024)
            ).toFixed(2)
        } MB`;
    }


    /* ========================================================
       RESTABLECER AUDIO
    ======================================================== */

    resetSelectedFile(
        clearInput = false
    ) {

        this.audioData = "";

        this.selectedFile = null;


        if (clearInput) {

            this.fileInput.value = "";
        }


        this.fileInfo.classList.add(
            "d-none"
        );


        this.filePlaceholder.classList.remove(
            "d-none"
        );


        this.fileName.textContent = "-";

        this.fileSize.textContent = "-";


        if (this.preview) {

            this.preview.pause();

            this.preview.removeAttribute(
                "src"
            );

            this.preview.load();
        }


        if (this.previewUrl) {

            URL.revokeObjectURL(
                this.previewUrl
            );

            this.previewUrl = null;
        }


        this.updateControls();
    }


    /* ========================================================
       ACTUALIZAR CONTROLES
    ======================================================== */

    updateControls() {

        const locked =
            this.isProcessing ||
            this.isRecording ||
            this.isGeneratingSpeech;


        this.fileInput.disabled =
            locked;

        this.sourceLanguage.disabled =
            locked;

        this.targetLanguage.disabled =
            locked;

        this.swapButton.disabled =
            locked;


        if (this.recordButton) {

            this.recordButton.disabled =
                this.isProcessing ||
                this.isRecording;
        }


        if (this.stopButton) {

            this.stopButton.disabled =
                this.isProcessing ||
                !this.isRecording;
        }


        this.translateButton.disabled =
            locked ||
            !this.audioData ||
            !this.selectedFile;


        if (this.speechButton) {

            this.speechButton.disabled =
                locked ||
                !this.speechText;
        }
    }


    /* ========================================================
       ENVIAR AUDIO
    ======================================================== */

    async handleSubmit(event) {

        event.preventDefault();

        this.showFormMessage();

        this.clearResults();


        if (
            !this.audioData ||
            !this.selectedFile
        ) {

            this.showFormMessage(
                "Selecciona o graba un audio antes de traducir."
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
            "Transcribiendo audio..."
        );


        try {

            const validMimeType =
                ALLOWED_AUDIO_TYPES.includes(
                    this.selectedFile.type
                )
                    ? this.selectedFile.type
                    : "";


            const response =
                await fetch(
                    AUDIO_API_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                audio_data:
                                    this.audioData,

                                filename:
                                    this.selectedFile.name,

                                mime_type:
                                    validMimeType,

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
                    "No fue posible traducir el audio."
                );
            }


            if (!data.has_speech) {

                this.results.classList.remove(
                    "d-none"
                );


                this.processedFileName.textContent =
                    data.filename ||
                    this.selectedFile.name;


                this.transcription.textContent =
                    "No se detectó voz comprensible en el audio.";


                this.translatedText.textContent =
                    "No hay contenido disponible para traducir.";


                this.speechText = "";

                this.speechTargetLanguage = "";

                this.updateControls();


                this.detectedLanguage.textContent =
                    this.languageNames[
                        data.detected_language
                    ] ||
                    "No identificado";


                this.showWarning(
                    data.warning ||
                    "No se detectó voz comprensible en el audio."
                );


                this.setStatus(
                    "ready",
                    "Análisis terminado"
                );


                this.scrollToResults();

                return;
            }


            this.results.classList.remove(
                "d-none"
            );


            this.processedFileName.textContent =
                data.filename ||
                this.selectedFile.name;


            this.transcription.textContent =
                data.transcription ||
                "No se recibió la transcripción.";


            this.translatedText.textContent =
                data.translation ||
                "No se recibió una traducción.";


            this.speechText =
                data.translation ||
                "";

            this.speechTargetLanguage =
                target;

            this.updateControls();


            this.detectedLanguage.textContent =
                this.languageNames[
                    data.detected_language
                ] ||
                "No identificado";


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
                "Audio traducido"
            );


            this.scrollToResults();

        }
        catch (error) {

            console.error(
                "Error al traducir audio:",
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

        this.isProcessing =
            isLoading;


        this.translateButton.textContent =
            isLoading
                ? "Transcribiendo y traduciendo..."
                : "Traducir audio";


        this.updateControls();
    }


    /* ========================================================
       LIMPIAR RESULTADOS
    ======================================================== */

    clearResults() {

        this.results.classList.add(
            "d-none"
        );


        this.processedFileName.textContent = "-";

        this.transcription.textContent = "";

        this.translatedText.textContent = "";

        this.detectedLanguage.textContent = "-";


        this.cleanupSpeech();

        this.hideWarning();

        this.updateControls();
    }


    /* ========================================================
       ESCUCHAR TRADUCCIÓN
    ======================================================== */

    async handleSpeech() {

        if (
            !this.speechText ||
            !this.speechTargetLanguage
        ) {

            this.showSpeechStatus(
                "No hay una traducción disponible para escuchar."
            );

            return;
        }


        if (
            this.speechUrl &&
            this.speechPlayer
        ) {

            try {

                await this.speechPlayer.play();

                this.showSpeechStatus(
                    "Reproduciendo traducción."
                );

            }
            catch {

                this.showSpeechStatus(
                    "El audio está listo. Pulsa reproducir en el reproductor."
                );
            }

            return;
        }


        this.isGeneratingSpeech = true;

        this.showSpeechStatus(
            "Generando voz..."
        );


        this.setStatus(
            "loading",
            "Generando voz..."
        );


        this.updateControls();


        try {

            const response =
                await fetch(
                    SPEECH_API_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                text:
                                    this.speechText,

                                target_language:
                                    this.speechTargetLanguage
                            })
                    }
                );


            if (!response.ok) {

                let message =
                    "No fue posible generar la voz de la traducción.";


                try {

                    const errorData =
                        await response.json();


                    if (
                        errorData &&
                        errorData.error
                    ) {

                        message =
                            errorData.error;
                    }

                }
                catch {

                    // La respuesta de error no era JSON.
                }


                throw new Error(
                    message
                );
            }


            const audioBlob =
                await response.blob();


            if (
                !audioBlob ||
                audioBlob.size === 0
            ) {

                throw new Error(
                    "El servidor no devolvió contenido de audio."
                );
            }


            this.cleanupSpeechAudio();


            this.speechUrl =
                URL.createObjectURL(
                    audioBlob
                );


            this.speechPlayer.src =
                this.speechUrl;


            this.speechPlayerContainer.classList.remove(
                "d-none"
            );


            this.speechPlayer.load();


            this.speechButton.textContent =
                "🔊 Reproducir traducción";


            this.showSpeechStatus(
                "Audio generado correctamente."
            );


            this.setStatus(
                "ready",
                "Voz lista"
            );


            try {

                await this.speechPlayer.play();

                this.showSpeechStatus(
                    "Reproduciendo traducción."
                );

            }
            catch {

                this.showSpeechStatus(
                    "Audio listo. Pulsa reproducir en el reproductor."
                );
            }

        }
        catch (error) {

            console.error(
                "Error al generar voz:",
                error
            );


            this.showSpeechStatus(
                error.message
            );


            this.setStatus(
                "error",
                "Error"
            );
        }
        finally {

            this.isGeneratingSpeech = false;

            this.updateControls();
        }
    }


    /* ========================================================
       MENSAJE DE VOZ
    ======================================================== */

    showSpeechStatus(message = "") {

        if (!this.speechStatus) {

            return;
        }


        this.speechStatus.textContent =
            message;
    }


    /* ========================================================
       LIMPIAR AUDIO TTS
    ======================================================== */

    cleanupSpeechAudio() {

        if (this.speechPlayer) {

            this.speechPlayer.pause();

            this.speechPlayer.removeAttribute(
                "src"
            );

            this.speechPlayer.load();
        }


        if (this.speechUrl) {

            URL.revokeObjectURL(
                this.speechUrl
            );

            this.speechUrl = null;
        }


        if (this.speechPlayerContainer) {

            this.speechPlayerContainer.classList.add(
                "d-none"
            );
        }
    }


    /* ========================================================
       LIMPIAR ESTADO DE VOZ
    ======================================================== */

    cleanupSpeech() {

        this.cleanupSpeechAudio();


        this.speechText = "";

        this.speechTargetLanguage = "";


        if (this.speechButton) {

            this.speechButton.textContent =
                "🔊 Escuchar traducción";

            this.speechButton.disabled =
                true;
        }


        this.showSpeechStatus();
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

        this.warning.textContent = "";


        this.warning.classList.add(
            "d-none"
        );
    }


    /* ========================================================
       MENSAJE
    ======================================================== */

    showFormMessage(message = "") {

        this.formMessage.textContent =
            message;
    }


    /* ========================================================
       RESULTADOS
    ======================================================== */

    scrollToResults() {

        this.results.scrollIntoView({
            behavior:
                "smooth",

            block:
                "nearest"
        });
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
   CLASE PARA TRADUCCIÓN DE DOCUMENTOS
============================================================ */

class DocumentTranslationApp {

    constructor() {

        this.form =
            document.getElementById(
                "documentForm"
            );

        this.fileInput =
            document.getElementById(
                "documentInput"
            );

        this.sourceLanguage =
            document.getElementById(
                "documentSourceLanguage"
            );

        this.targetLanguage =
            document.getElementById(
                "documentTargetLanguage"
            );

        this.swapButton =
            document.getElementById(
                "documentSwapLanguagesButton"
            );

        this.translationDirection =
            document.getElementById(
                "documentTranslationDirection"
            );

        this.translateButton =
            document.getElementById(
                "documentTranslateButton"
            );

        this.formMessage =
            document.getElementById(
                "documentFormMessage"
            );


        /* ====================================================
           INFORMACIÓN DEL ARCHIVO
        ==================================================== */

        this.filePlaceholder =
            document.getElementById(
                "documentFilePlaceholder"
            );

        this.fileInfo =
            document.getElementById(
                "documentFileInfo"
            );

        this.fileName =
            document.getElementById(
                "documentFileName"
            );

        this.fileSize =
            document.getElementById(
                "documentFileSize"
            );


        /* ====================================================
           RESULTADOS
        ==================================================== */

        this.results =
            document.getElementById(
                "documentResults"
            );

        this.processedFileName =
            document.getElementById(
                "processedDocumentName"
            );

        this.originalText =
            document.getElementById(
                "documentOriginalText"
            );

        this.translatedText =
            document.getElementById(
                "documentTranslatedText"
            );

        this.detectedLanguage =
            document.getElementById(
                "detectedDocumentLanguage"
            );

        this.warning =
            document.getElementById(
                "documentWarning"
            );


        /* ====================================================
           ESTADO GLOBAL
        ==================================================== */

        this.statusText =
            document.getElementById(
                "statusText"
            );

        this.statusIndicator =
            document.getElementById(
                "statusIndicator"
            );


        this.fileData =
            "";

        this.selectedFile =
            null;


        this.languageNames = {
            es: "Español",
            en: "English",
            unknown: "No identificado"
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

                this.handleFileSelection();
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
       IDIOMA ORIGEN
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
       IDIOMA DESTINO
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
       DIRECCIÓN
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
       SELECCIONAR DOCUMENTO
    ======================================================== */

    handleFileSelection() {

        this.showFormMessage();

        this.clearResults();

        this.resetSelectedFile();


        const file =
            this.fileInput.files[0];


        if (!file) {

            return;
        }


        const extension =
            this.getFileExtension(
                file.name
            );


        /* ====================================================
           VALIDAR EXTENSIÓN
        ==================================================== */

        if (
            !ALLOWED_DOCUMENT_EXTENSIONS.includes(
                extension
            )
        ) {

            this.showFormMessage(
                "Formato no permitido. Usa PDF, TXT o DOCX."
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
            MAX_DOCUMENT_SIZE
        ) {

            this.showFormMessage(
                "El documento debe pesar como máximo 2 MB."
            );


            this.fileInput.value =
                "";

            return;
        }


        if (
            file.size === 0
        ) {

            this.showFormMessage(
                "El documento seleccionado está vacío."
            );


            this.fileInput.value =
                "";

            return;
        }


        /* ====================================================
           LEER DOCUMENTO
        ==================================================== */

        const reader =
            new FileReader();


        reader.onload =
            () => {

                this.fileData =
                    reader.result;

                this.selectedFile =
                    file;


                this.showFileInformation(
                    file
                );


                this.translateButton.disabled =
                    false;


                this.setStatus(
                    "ready",
                    "Documento listo"
                );
            };


        reader.onerror =
            () => {

                this.resetSelectedFile();


                this.fileInput.value =
                    "";


                this.showFormMessage(
                    "No fue posible leer el documento seleccionado."
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
       EXTENSIÓN
    ======================================================== */

    getFileExtension(filename) {

        const lastDot =
            filename.lastIndexOf(".");


        if (lastDot === -1) {

            return "";
        }


        return filename
            .slice(lastDot)
            .toLowerCase();
    }


    /* ========================================================
       INFORMACIÓN DEL DOCUMENTO
    ======================================================== */

    showFileInformation(file) {

        this.filePlaceholder.classList.add(
            "d-none"
        );


        this.fileInfo.classList.remove(
            "d-none"
        );


        this.fileName.textContent =
            file.name;


        this.fileSize.textContent =
            this.formatFileSize(
                file.size
            );
    }


    /* ========================================================
       FORMATEAR TAMAÑO
    ======================================================== */

    formatFileSize(bytes) {

        if (bytes < 1024) {

            return `${bytes} bytes`;
        }


        if (
            bytes <
            1024 * 1024
        ) {

            return `${
                (
                    bytes / 1024
                ).toFixed(1)
            } KB`;
        }


        return `${
            (
                bytes /
                (1024 * 1024)
            ).toFixed(2)
        } MB`;
    }


    /* ========================================================
       RESTABLECER ARCHIVO
    ======================================================== */

    resetSelectedFile() {

        this.fileData =
            "";

        this.selectedFile =
            null;


        this.translateButton.disabled =
            true;


        this.fileInfo.classList.add(
            "d-none"
        );


        this.filePlaceholder.classList.remove(
            "d-none"
        );


        this.fileName.textContent =
            "-";

        this.fileSize.textContent =
            "-";
    }


    /* ========================================================
       ENVIAR DOCUMENTO
    ======================================================== */

    async handleSubmit(event) {

        event.preventDefault();

        this.showFormMessage();

        this.clearResults();


        if (
            !this.fileData ||
            !this.selectedFile
        ) {

            this.showFormMessage(
                "Selecciona un documento antes de traducir."
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
            "Analizando documento..."
        );


        try {

            const validMimeType =
                ALLOWED_DOCUMENT_TYPES.includes(
                    this.selectedFile.type
                )
                    ? this.selectedFile.type
                    : "";


            const response =
                await fetch(
                    DOCUMENT_API_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                file_data:
                                    this.fileData,

                                filename:
                                    this.selectedFile.name,

                                mime_type:
                                    validMimeType,

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
                    "No fue posible traducir el documento."
                );
            }


            /* =================================================
               DOCUMENTO SIN TEXTO
            ================================================= */

            if (!data.has_text) {

                this.results.classList.remove(
                    "d-none"
                );


                this.processedFileName.textContent =
                    data.filename ||
                    this.selectedFile.name;


                this.originalText.textContent =
                    "No se encontró texto legible en el documento.";


                this.translatedText.textContent =
                    "No hay contenido disponible para traducir.";


                this.detectedLanguage.textContent =
                    this.languageNames[
                        data.detected_language
                    ] ||
                    "No identificado";


                this.showWarning(
                    data.warning ||
                    "No se encontró texto legible en el documento."
                );


                this.setStatus(
                    "ready",
                    "Análisis terminado"
                );


                this.scrollToResults();

                return;
            }


            /* =================================================
               RESULTADO EXITOSO
            ================================================= */

            this.results.classList.remove(
                "d-none"
            );


            this.processedFileName.textContent =
                data.filename ||
                this.selectedFile.name;


            this.originalText.textContent =
                data.original_text ||
                "No se recibió el texto original.";


            this.translatedText.textContent =
                data.translation ||
                "No se recibió una traducción.";


            this.detectedLanguage.textContent =
                this.languageNames[
                    data.detected_language
                ] ||
                "No identificado";


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
                "Documento traducido"
            );


            this.scrollToResults();

        }
        catch (error) {

            console.error(
                "Error al traducir documento:",
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
            !this.fileData ||
            !this.selectedFile;


        this.translateButton.textContent =
            isLoading
                ? "Analizando y traduciendo..."
                : "Traducir documento";
    }


    /* ========================================================
       LIMPIAR RESULTADOS
    ======================================================== */

    clearResults() {

        this.results.classList.add(
            "d-none"
        );


        this.processedFileName.textContent =
            "-";

        this.originalText.textContent =
            "";

        this.translatedText.textContent =
            "";

        this.detectedLanguage.textContent =
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
       MENSAJE
    ======================================================== */

    showFormMessage(message = "") {

        this.formMessage.textContent =
            message;
    }


    /* ========================================================
       RESULTADOS
    ======================================================== */

    scrollToResults() {

        this.results.scrollIntoView({
            behavior:
                "smooth",

            block:
                "nearest"
        });
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


    const audioModeButton =
        document.getElementById(
            "audioModeButton"
        );


    const documentModeButton =
        document.getElementById(
            "documentModeButton"
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


    function resetStatus(message) {

        statusIndicator.classList.remove(
            "loading",
            "error"
        );


        statusText.textContent =
            message;
    }


    if (
        chatModeButton &&
        statusText &&
        statusIndicator
    ) {

        chatModeButton.addEventListener(
            "shown.bs.tab",
            () => {

                resetStatus(
                    "IA disponible"
                );
            }
        );
    }


    if (
        audioModeButton &&
        statusText &&
        statusIndicator
    ) {

        audioModeButton.addEventListener(
            "shown.bs.tab",
            () => {

                resetStatus(
                    "Traductor de audio disponible"
                );
            }
        );
    }


    if (
        documentModeButton &&
        statusText &&
        statusIndicator
    ) {

        documentModeButton.addEventListener(
            "shown.bs.tab",
            () => {

                resetStatus(
                    "Traductor de documentos disponible"
                );
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

                resetStatus(
                    "Traductor de imágenes disponible"
                );
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

        new AudioTranslationApp();

        new ImageTranslationApp();

        new DocumentTranslationApp();

        initializeModeNavigation();
    }
);