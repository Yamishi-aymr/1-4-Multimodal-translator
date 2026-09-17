/* ============================================================
   CONFIGURACIÓN
============================================================ */

const CHAT_API_URL =
    "https://1-4-multimodal-translator.vercel.app/api/chat";
    
const MAX_MESSAGE_LENGTH =
    2000;

const MAX_HISTORY_MESSAGES =
    8;


/* ============================================================
   CLASE PRINCIPAL
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


        if (isLoading) {

            this.sendButton.textContent =
                "Traduciendo...";

        }
        else {

            this.sendButton.textContent =
                "Traducir mensaje";

        }

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
       CREAR SECCIÓN DE MENSAJE
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


        /*
         * textContent se utiliza intencionalmente
         * para evitar insertar HTML recibido
         * desde el servidor.
         */

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
   INICIAR APLICACIÓN
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        new TranslationChatApp();

    }
);