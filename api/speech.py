import json
import os
import tempfile

from http.server import BaseHTTPRequestHandler
from pathlib import Path

from openai import OpenAI


# ============================================================
# CONFIGURACIÓN
# ============================================================

ALLOWED_ORIGIN = os.environ.get(
    "ALLOWED_ORIGIN",
    ""
).rstrip("/")


MAX_TEXT_LENGTH = 4000

MAX_REQUEST_BYTES = 20_000


ALLOWED_LANGUAGES = {
    "es": "Español",
    "en": "English"
}


# ============================================================
# SERVICIO DE TEXTO A VOZ
# ============================================================

class SpeechService:

    def __init__(
        self,
        api_key
    ):

        self.client = OpenAI(
            api_key=api_key
        )


        self.model = (
            "gpt-4o-mini-tts"
        )


        self.voice = (
            "alloy"
        )


    # ========================================================
    # INSTRUCCIONES DE VOZ
    # ========================================================

    def build_instructions(
        self,
        target_language
    ):

        if (
            target_language ==
            "es"
        ):

            return (
                "Habla con pronunciación clara y natural en español. "
                "Usa un tono neutral, amable y profesional. "
                "Lee únicamente el texto proporcionado y no agregues comentarios."
            )


        return (
            "Speak clearly and naturally in English. "
            "Use a neutral, friendly, professional tone. "
            "Read only the provided text and do not add commentary."
        )


    # ========================================================
    # GENERAR AUDIO
    # ========================================================

    def create_speech(
        self,
        text,
        target_language
    ):

        temp_path = None


        try:

            # =================================================
            # ARCHIVO TEMPORAL MP3
            # =================================================

            with tempfile.NamedTemporaryFile(
                suffix=".mp3",
                delete=False
            ) as temp_file:

                temp_path = (
                    temp_file.name
                )


            # =================================================
            # OPENAI TEXT TO SPEECH
            # =================================================

            with (
                self.client
                .audio
                .speech
                .with_streaming_response
                .create(

                    model=
                        self.model,

                    voice=
                        self.voice,

                    input=
                        text,

                    instructions=
                        self.build_instructions(
                            target_language
                        ),

                    response_format=
                        "mp3"
                )
            ) as response:

                response.stream_to_file(
                    temp_path
                )


            # =================================================
            # LEER MP3 GENERADO
            # =================================================

            audio_bytes = (
                Path(
                    temp_path
                )
                .read_bytes()
            )


            if not audio_bytes:

                raise ValueError(
                    "OpenAI no devolvió contenido de audio."
                )


            return audio_bytes


        finally:

            # =================================================
            # BORRAR ARCHIVO TEMPORAL
            # =================================================

            if temp_path:

                try:

                    Path(
                        temp_path
                    ).unlink(
                        missing_ok=True
                    )

                except Exception as error:

                    print(
                        "No fue posible eliminar "
                        f"el archivo temporal: "
                        f"{type(error).__name__}: "
                        f"{error}"
                    )


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
            "Cache-Control",
            "no-store"
        )


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
    # RESPUESTA DE AUDIO
    # ========================================================

    def send_audio(
        self,
        audio_bytes
    ):

        self.send_response(
            200
        )


        self.send_header(
            "Content-Type",
            "audio/mpeg"
        )


        self.add_cors_headers()


        self.send_header(
            "Cache-Control",
            "no-store"
        )


        self.send_header(
            "Content-Disposition",
            'inline; filename="translation.mp3"'
        )


        self.send_header(
            "Content-Length",
            str(
                len(audio_bytes)
            )
        )


        self.end_headers()


        self.wfile.write(
            audio_bytes
        )


    # ========================================================
    # PREFLIGHT
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
            # CONTENT TYPE
            # =================================================

            content_type = self.headers.get(
                "Content-Type",
                ""
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
            # CONTENT LENGTH
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

            raw_body = self.rfile.read(
                content_length
            )


            data = json.loads(
                raw_body.decode(
                    "utf-8"
                )
            )


            # =================================================
            # TEXTO
            # =================================================

            text = str(
                data.get(
                    "text",
                    ""
                )
            ).strip()


            # =================================================
            # IDIOMA DESTINO
            # =================================================

            target_language = str(
                data.get(
                    "target_language",
                    ""
                )
            ).strip().lower()


            # =================================================
            # VALIDAR TEXTO
            # =================================================

            if not text:

                self.send_json(
                    400,
                    {
                        "error":
                            "No se recibió texto para convertir a voz."
                    }
                )

                return


            if (
                len(text) >
                MAX_TEXT_LENGTH
            ):

                self.send_json(
                    413,
                    {
                        "error":
                            "La traducción es demasiado larga para convertirla a voz."
                    }
                )

                return


            # =================================================
            # VALIDAR IDIOMA
            # =================================================

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
            # GENERAR VOZ
            # =================================================

            speech_service = (
                SpeechService(
                    api_key
                )
            )


            audio_bytes = (
                speech_service.create_speech(

                    text=
                        text,

                    target_language=
                        target_language
                )
            )


            # =================================================
            # DEVOLVER MP3
            # =================================================

            self.send_audio(
                audio_bytes
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
        # TEXTO INVÁLIDO
        # =====================================================

        except UnicodeDecodeError:

            self.send_json(
                400,
                {
                    "error":
                        "La petición contiene texto no válido."
                }
            )


        # =====================================================
        # ERROR GENERAL
        # =====================================================

        except Exception as error:

            print(
                "Error en /api/speech: "
                f"{type(error).__name__}: "
                f"{error}"
            )


            self.send_json(
                500,
                {
                    "error":
                        "No fue posible generar el audio de la traducción."
                }
            )