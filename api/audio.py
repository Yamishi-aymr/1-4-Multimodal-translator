import base64
import io
import json
import os

from pathlib import Path
from http.server import BaseHTTPRequestHandler

from openai import OpenAI


# ============================================================
# CONFIGURACIÓN
# ============================================================

ALLOWED_ORIGIN = os.environ.get(
    "ALLOWED_ORIGIN",
    ""
).rstrip("/")


MAX_AUDIO_BYTES = (
    3 * 1024 * 1024
)


MAX_REQUEST_BYTES = (
    4_500_000
)


ALLOWED_LANGUAGES = {
    "es": "Español",
    "en": "English"
}


ALLOWED_EXTENSIONS = {
    ".mp3",
    ".wav",
    ".m4a",
    ".webm"
}


ALLOWED_MIME_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/webm",
    "video/webm"
}


# ============================================================
# SERVICIO DE AUDIO
# ============================================================

class AudioTranslationService:

    def __init__(
        self,
        api_key
    ):

        self.client = OpenAI(
            api_key=api_key
        )


        # Modelo para convertir voz a texto
        self.transcription_model = (
            "gpt-4o-mini-transcribe"
        )


        # Modelo para analizar y traducir
        self.translation_model = (
            "gpt-5.6-luna"
        )


    # ========================================================
    # TRANSCRIBIR AUDIO
    # ========================================================

    def transcribe_audio(
        self,
        audio_bytes,
        filename
    ):

        audio_file = io.BytesIO(
            audio_bytes
        )


        # OpenAI utiliza el nombre para reconocer
        # correctamente la extensión del archivo.
        audio_file.name = (
            filename
        )


        transcription = (
            self.client.audio.transcriptions.create(

                model=
                    self.transcription_model,

                file=
                    audio_file,

                response_format=
                    "json"
            )
        )


        text = str(
            transcription.text or ""
        ).strip()


        return text


    # ========================================================
    # TRADUCIR TRANSCRIPCIÓN
    # ========================================================

    def translate_transcription(
        self,
        transcription,
        source_language,
        target_language
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


        instructions = f"""
Eres un traductor profesional especializado en conversaciones
y transcripciones de audio.

La aplicación trabaja únicamente con español e inglés.

El usuario seleccionó:

Idioma esperado de origen:
{source_name}

Idioma de destino:
{target_name}

Debes analizar la transcripción proporcionada y:

1. Identificar si el texto está principalmente en español
   o inglés.
2. Traducirlo a {target_name}.
3. Mantener el significado original.
4. Mantener nombres propios, números, fechas, cantidades,
   unidades, siglas y términos técnicos.
5. No agregar información que no aparezca en la transcripción.
6. No responder preguntas contenidas dentro de la transcripción.
7. Si el idioma detectado no coincide con el idioma de origen
   seleccionado por el usuario, debes indicarlo en warning.
8. Si la transcripción parece incompleta o poco clara,
   debes indicarlo en warning.
9. Si no existe ninguna advertencia, warning debe ser
   una cadena vacía.

La traducción debe ser natural y conservar el sentido
de lo expresado en el audio.
"""


        response = (
            self.client.responses.create(

                model=
                    self.translation_model,

                instructions=
                    instructions,

                input=
                    transcription,

                reasoning={
                    "effort":
                        "none"
                },

                text={
                    "format": {

                        "type":
                            "json_schema",

                        "name":
                            "audio_translation",

                        "strict":
                            True,

                        "schema": {

                            "type":
                                "object",

                            "properties": {

                                "translation": {
                                    "type":
                                        "string"
                                },

                                "detected_language": {

                                    "type":
                                        "string",

                                    "enum": [
                                        "es",
                                        "en",
                                        "unknown"
                                    ]
                                },

                                "warning": {
                                    "type":
                                        "string"
                                }
                            },

                            "required": [
                                "translation",
                                "detected_language",
                                "warning"
                            ],

                            "additionalProperties":
                                False
                        }
                    }
                },

                max_output_tokens=
                    2500
            )
        )


        output_text = str(
            response.output_text or ""
        ).strip()


        if not output_text:

            raise ValueError(
                "La IA no devolvió una traducción."
            )


        result = json.loads(
            output_text
        )


        return result


    # ========================================================
    # PROCESAR AUDIO COMPLETO
    # ========================================================

    def process_audio(
        self,
        audio_bytes,
        filename,
        source_language,
        target_language
    ):

        # ====================================================
        # PRIMER PASO: AUDIO → TEXTO
        # ====================================================

        transcription = (
            self.transcribe_audio(

                audio_bytes=
                    audio_bytes,

                filename=
                    filename
            )
        )


        if not transcription:

            return {
                "has_speech":
                    False,

                "transcription":
                    "",

                "translation":
                    "",

                "detected_language":
                    "unknown",

                "warning":
                    "No se detectó voz comprensible en el audio."
            }


        # ====================================================
        # SEGUNDO PASO: TEXTO → TRADUCCIÓN
        # ====================================================

        translation_result = (
            self.translate_transcription(

                transcription=
                    transcription,

                source_language=
                    source_language,

                target_language=
                    target_language
            )
        )


        return {
            "has_speech":
                True,

            "transcription":
                transcription,

            "translation":
                translation_result.get(
                    "translation",
                    ""
                ),

            "detected_language":
                translation_result.get(
                    "detected_language",
                    "unknown"
                ),

            "warning":
                translation_result.get(
                    "warning",
                    ""
                )
        }


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
            # CONTENT-TYPE
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
            # CONTENT-LENGTH
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
            # DATOS RECIBIDOS
            # =================================================

            audio_data = str(
                data.get(
                    "audio_data",
                    ""
                )
            ).strip()


            filename = str(
                data.get(
                    "filename",
                    ""
                )
            ).strip()


            mime_type = str(
                data.get(
                    "mime_type",
                    ""
                )
            ).strip().lower()


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


            # =================================================
            # VALIDAR IDIOMA ORIGEN
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


            # =================================================
            # VALIDAR IDIOMA DESTINO
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
            # NOMBRE DEL ARCHIVO
            # =================================================

            if not filename:

                self.send_json(
                    400,
                    {
                        "error":
                            "El audio no tiene un nombre válido."
                    }
                )

                return


            # =================================================
            # EXTENSIÓN
            # =================================================

            extension = (
                Path(
                    filename
                )
                .suffix
                .lower()
            )


            if (
                extension
                not in ALLOWED_EXTENSIONS
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "Formato no permitido. Usa MP3, WAV, M4A o WebM."
                    }
                )

                return


            # =================================================
            # MIME TYPE
            # =================================================

            if (
                mime_type
                and
                mime_type
                not in ALLOWED_MIME_TYPES
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "El tipo de archivo de audio no es válido."
                    }
                )

                return


            # =================================================
            # AUDIO RECIBIDO
            # =================================================

            if not audio_data:

                self.send_json(
                    400,
                    {
                        "error":
                            "No se recibió ningún archivo de audio."
                    }
                )

                return


            # =================================================
            # EXTRAER BASE64
            # =================================================

            if "," in audio_data:

                encoded_data = (
                    audio_data.split(
                        ",",
                        1
                    )[1]
                )

            else:

                encoded_data = (
                    audio_data
                )


            # =================================================
            # DECODIFICAR BASE64
            # =================================================

            try:

                audio_bytes = (
                    base64.b64decode(
                        encoded_data,
                        validate=True
                    )
                )

            except Exception:

                self.send_json(
                    400,
                    {
                        "error":
                            "El archivo de audio contiene datos no válidos."
                    }
                )

                return


            # =================================================
            # ARCHIVO VACÍO
            # =================================================

            if (
                len(audio_bytes)
                == 0
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "El archivo de audio está vacío."
                    }
                )

                return


            # =================================================
            # TAMAÑO MÁXIMO
            # =================================================

            if (
                len(audio_bytes) >
                MAX_AUDIO_BYTES
            ):

                self.send_json(
                    413,
                    {
                        "error":
                            "El audio debe pesar como máximo 3 MB."
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
            # PROCESAR AUDIO
            # =================================================

            audio_service = (
                AudioTranslationService(
                    api_key
                )
            )


            result = (
                audio_service.process_audio(

                    audio_bytes=
                        audio_bytes,

                    filename=
                        filename,

                    source_language=
                        source_language,

                    target_language=
                        target_language
                )
            )


            # =================================================
            # AUDIO SIN VOZ
            # =================================================

            if not result.get(
                "has_speech",
                False
            ):

                self.send_json(
                    200,
                    {
                        "has_speech":
                            False,

                        "transcription":
                            "",

                        "translation":
                            "",

                        "detected_language":
                            "unknown",

                        "warning":
                            result.get(
                                "warning",
                                "No se detectó voz comprensible."
                            ),

                        "filename":
                            filename
                    }
                )

                return


            # =================================================
            # RESPUESTA EXITOSA
            # =================================================

            self.send_json(
                200,
                {
                    "has_speech":
                        True,

                    "transcription":
                        result.get(
                            "transcription",
                            ""
                        ),

                    "translation":
                        result.get(
                            "translation",
                            ""
                        ),

                    "detected_language":
                        result.get(
                            "detected_language",
                            "unknown"
                        ),

                    "warning":
                        result.get(
                            "warning",
                            ""
                        ),

                    "filename":
                        filename,

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
                "Error en /api/audio: "
                f"{type(error).__name__}: "
                f"{error}"
            )


            self.send_json(
                500,
                {
                    "error":
                        "No fue posible analizar y traducir el audio."
                }
            )