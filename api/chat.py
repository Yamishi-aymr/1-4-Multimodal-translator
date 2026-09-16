import json
import os

from http.server import BaseHTTPRequestHandler

from openai import OpenAI


# ============================================================
# CONFIGURACIÓN
# ============================================================

ALLOWED_ORIGIN = os.environ.get(
    "ALLOWED_ORIGIN",
    ""
).rstrip("/")


MAX_REQUEST_BYTES = 80_000

MAX_MESSAGE_LENGTH = 2000

MAX_HISTORY_MESSAGES = 8


ALLOWED_LANGUAGES = {
    "es": "Español",
    "en": "English"
}


# ============================================================
# SERVICIO DE TRADUCCIÓN
# PROGRAMACIÓN ORIENTADA A OBJETOS
# ============================================================

class TranslationService:

    def __init__(
        self,
        api_key
    ):

        self.client = OpenAI(
            api_key=api_key
        )

        self.model = (
            "gpt-5.6-luna"
        )


    # ========================================================
    # CONSTRUIR CONTEXTO
    # ========================================================

    def build_context(
        self,
        history
    ):

        if not history:

            return (
                "No hay mensajes anteriores "
                "en la conversación."
            )


        context_lines = []


        for item in history[
            -MAX_HISTORY_MESSAGES:
        ]:

            if not isinstance(
                item,
                dict
            ):

                continue


            original = str(
                item.get(
                    "original",
                    ""
                )
            ).strip()


            translation = str(
                item.get(
                    "translation",
                    ""
                )
            ).strip()


            if (
                not original
                or
                not translation
            ):

                continue


            if len(original) > 2000:

                original = (
                    original[:2000]
                )


            if len(translation) > 2000:

                translation = (
                    translation[:2000]
                )


            context_lines.append(
                f"Original: {original}\n"
                f"Traducción: {translation}"
            )


        if not context_lines:

            return (
                "No hay mensajes anteriores "
                "utilizables."
            )


        return "\n\n".join(
            context_lines
        )


    # ========================================================
    # TRADUCIR
    # ========================================================

    def translate(
        self,
        message,
        source_language,
        target_language,
        history
    ):

        source_name = (
            ALLOWED_LANGUAGES[
                source_language
            ]
        )


        target_name = (
            ALLOWED_LANGUAGES[
                target_language
            ]
        )


        conversation_context = (
            self.build_context(
                history
            )
        )


        instructions = f"""
Eres un traductor profesional bilingüe especializado
en español e inglés.

Tu única tarea es traducir el mensaje proporcionado
desde {source_name} hacia {target_name}.

Reglas:

1. Conserva el significado original.
2. Produce una traducción natural en el idioma destino.
3. Conserva correctamente nombres propios, cifras,
   fechas, unidades, siglas y términos técnicos.
4. Utiliza el contexto de la conversación únicamente
   cuando sea necesario para resolver referencias,
   pronombres o ambigüedades.
5. No respondas preguntas contenidas dentro del mensaje.
6. No agregues explicaciones.
7. No agregues comentarios.
8. No incluyas etiquetas como "Traducción:".
9. No inventes contenido que no aparezca en el mensaje.
10. Devuelve únicamente el texto traducido.
"""


        user_input = f"""
CONTEXTO RECIENTE DE LA CONVERSACIÓN:

{conversation_context}


MENSAJE ACTUAL:

{message}


Traduce únicamente el MENSAJE ACTUAL
de {source_name} a {target_name}.
"""


        response = (
            self.client.responses.create(

                model=
                    self.model,

                instructions=
                    instructions,

                input=
                    user_input,

                reasoning={
                    "effort":
                        "none"
                },

                max_output_tokens=
                    1200
            )
        )


        translation = str(
            response.output_text or ""
        ).strip()


        return translation


# ============================================================
# HANDLER DE VERCEL
# ============================================================

class handler(BaseHTTPRequestHandler):


    # ========================================================
    # CORS
    # ========================================================

    def add_cors_headers(self):

        origin = self.headers.get(
            "Origin",
            ""
        )


        if (
            ALLOWED_ORIGIN
            and
            origin == ALLOWED_ORIGIN
        ):

            self.send_header(
                "Access-Control-Allow-Origin",
                origin
            )


            self.send_header(
                "Vary",
                "Origin"
            )


    # ========================================================
    # RESPUESTA JSON
    # ========================================================

    def send_json(
        self,
        status_code,
        data
    ):

        body = json.dumps(
            data,
            ensure_ascii=False
        ).encode(
            "utf-8"
        )


        self.send_response(
            status_code
        )


        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )


        self.add_cors_headers()


        self.send_header(
            "Content-Length",
            str(
                len(body)
            )
        )


        self.end_headers()


        self.wfile.write(
            body
        )


    # ========================================================
    # OPTIONS / PREFLIGHT
    # ========================================================

    def do_OPTIONS(self):

        origin = self.headers.get(
            "Origin",
            ""
        )


        if (
            ALLOWED_ORIGIN
            and
            origin != ALLOWED_ORIGIN
        ):

            self.send_response(
                403
            )

            self.end_headers()

            return


        self.send_response(
            204
        )


        self.add_cors_headers()


        self.send_header(
            "Access-Control-Allow-Methods",
            "POST, OPTIONS"
        )


        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        )


        self.send_header(
            "Access-Control-Max-Age",
            "86400"
        )


        self.end_headers()


    # ========================================================
    # GET
    # ========================================================

    def do_GET(self):

        self.send_json(
            405,
            {
                "error":
                    "Este endpoint solamente acepta POST."
            }
        )


    # ========================================================
    # POST
    # ========================================================

    def do_POST(self):

        try:

            # =================================================
            # VALIDAR ORIGEN
            # =================================================

            origin = self.headers.get(
                "Origin",
                ""
            )


            if (
                ALLOWED_ORIGIN
                and
                origin != ALLOWED_ORIGIN
            ):

                self.send_json(
                    403,
                    {
                        "error":
                            "Origen no autorizado."
                    }
                )

                return


            # =================================================
            # VALIDAR CONTENT-TYPE
            # =================================================

            content_type = (
                self.headers.get(
                    "Content-Type",
                    ""
                )
            )


            if (
                "application/json"
                not in content_type.lower()
            ):

                self.send_json(
                    415,
                    {
                        "error":
                            "La petición debe utilizar application/json."
                    }
                )

                return


            # =================================================
            # TAMAÑO DE PETICIÓN
            # =================================================

            try:

                content_length = int(
                    self.headers.get(
                        "Content-Length",
                        0
                    )
                )

            except ValueError:

                content_length = 0


            if content_length <= 0:

                self.send_json(
                    400,
                    {
                        "error":
                            "La petición está vacía."
                    }
                )

                return


            if (
                content_length >
                MAX_REQUEST_BYTES
            ):

                self.send_json(
                    413,
                    {
                        "error":
                            "La petición es demasiado grande."
                    }
                )

                return


            # =================================================
            # LEER JSON
            # =================================================

            body = self.rfile.read(
                content_length
            )


            data = json.loads(
                body.decode(
                    "utf-8"
                )
            )


            # =================================================
            # OBTENER DATOS
            # =================================================

            message = str(
                data.get(
                    "message",
                    ""
                )
            ).strip()


            source_language = str(
                data.get(
                    "source_language",
                    ""
                )
            ).strip().lower()


            target_language = str(
                data.get(
                    "target_language",
                    ""
                )
            ).strip().lower()


            history = data.get(
                "history",
                []
            )


            # =================================================
            # VALIDAR MENSAJE
            # =================================================

            if not message:

                self.send_json(
                    400,
                    {
                        "error":
                            "Debes escribir un mensaje para traducir."
                    }
                )

                return


            if (
                len(message) >
                MAX_MESSAGE_LENGTH
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "El mensaje no puede superar los 2000 caracteres."
                    }
                )

                return


            # =================================================
            # VALIDAR IDIOMAS
            # =================================================

            if (
                source_language
                not in ALLOWED_LANGUAGES
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "El idioma de origen no es válido."
                    }
                )

                return


            if (
                target_language
                not in ALLOWED_LANGUAGES
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "El idioma de destino no es válido."
                    }
                )

                return


            if (
                source_language ==
                target_language
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "El idioma de origen y destino deben ser diferentes."
                    }
                )

                return


            # =================================================
            # VALIDAR HISTORIAL
            # =================================================

            if not isinstance(
                history,
                list
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "El historial de conversación no es válido."
                    }
                )

                return


            if (
                len(history) >
                MAX_HISTORY_MESSAGES
            ):

                history = history[
                    -MAX_HISTORY_MESSAGES:
                ]


            # =================================================
            # API KEY
            # =================================================

            api_key = os.environ.get(
                "OPENAI_API_KEY"
            )


            if not api_key:

                self.send_json(
                    500,
                    {
                        "error":
                            "El servicio de Inteligencia Artificial no está configurado."
                    }
                )

                return


            # =================================================
            # SERVICIO DE TRADUCCIÓN
            # =================================================

            translator = (
                TranslationService(
                    api_key
                )
            )


            translation = (
                translator.translate(

                    message=
                        message,

                    source_language=
                        source_language,

                    target_language=
                        target_language,

                    history=
                        history
                )
            )


            # =================================================
            # VALIDAR RESPUESTA IA
            # =================================================

            if not translation:

                self.send_json(
                    502,
                    {
                        "error":
                            "La Inteligencia Artificial no devolvió una traducción."
                    }
                )

                return


            # =================================================
            # RESPUESTA
            # =================================================

            self.send_json(
                200,
                {
                    "original":
                        message,

                    "translation":
                        translation,

                    "source_language":
                        source_language,

                    "target_language":
                        target_language
                }
            )


        # =====================================================
        # JSON INVÁLIDO
        # =====================================================

        except json.JSONDecodeError:

            self.send_json(
                400,
                {
                    "error":
                        "El cuerpo no contiene JSON válido."
                }
            )


        # =====================================================
        # ERROR GENERAL
        # =====================================================

        except Exception as error:

            print(
                f"Error en /api/chat: "
                f"{type(error).__name__}: "
                f"{error}"
            )


            self.send_json(
                500,
                {
                    "error":
                        "No fue posible realizar la traducción."
                }
            )