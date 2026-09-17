import base64
import json
import os

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

from openai import OpenAI


# ============================================================
# CONFIGURACIÓN
# ============================================================

ALLOWED_ORIGIN = os.environ.get(
    "ALLOWED_ORIGIN",
    ""
).rstrip("/")


MAX_IMAGE_BYTES = 3 * 1024 * 1024

MAX_REQUEST_BYTES = 4_500_000


ALLOWED_PREFIXES = (
    "data:image/jpeg;base64,",
    "data:image/png;base64,",
    "data:image/webp;base64,"
)


ALLOWED_LANGUAGES = {
    "es": "Español",
    "en": "English"
}


# ============================================================
# VALIDAR URL
# ============================================================

def is_valid_image_url(value):

    if not value:
        return False

    try:

        parsed = urlparse(
            value
        )

        if parsed.scheme not in (
            "http",
            "https"
        ):
            return False

        if not parsed.netloc:
            return False

        return True

    except Exception:
        return False


# ============================================================
# SERVICIO DE TRADUCCIÓN DE IMÁGENES
# PROGRAMACIÓN ORIENTADA A OBJETOS
# ============================================================

class ImageTranslationService:

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
    # ANALIZAR Y TRADUCIR
    # ========================================================

    def translate_image(
        self,
        image,
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


        prompt = f"""
Analiza cuidadosamente el texto visible en la imagen.

La aplicación trabaja únicamente con español e inglés.

El usuario indicó:

Idioma esperado de origen:
{source_name}

Idioma de destino:
{target_name}

Debes:

1. Detectar si existe texto legible en la imagen.
2. Transcribir únicamente el texto que realmente sea visible.
3. Identificar si el texto está principalmente en español o inglés.
4. Traducir el texto visible a {target_name}.
5. Mantener nombres propios, números, fechas, precios,
   unidades, siglas y términos técnicos.
6. No inventar palabras que no sean legibles.
7. Si alguna parte es dudosa, indícalo mediante una advertencia.
8. Si no hay texto legible, indícalo claramente.
9. Si el idioma detectado no coincide con el idioma de origen
   seleccionado por el usuario, indícalo en la advertencia.

La traducción debe ser natural y mantener el significado
del contenido original.
"""


        response = self.client.responses.create(

            model=self.model,

            input=[
                {
                    "role": "user",

                    "content": [
                        {
                            "type":
                                "input_text",

                            "text":
                                prompt
                        },

                        {
                            "type":
                                "input_image",

                            "image_url":
                                image,

                            "detail":
                                "high"
                        }
                    ]
                }
            ],

            reasoning={
                "effort":
                    "none"
            },

            text={
                "format": {
                    "type":
                        "json_schema",

                    "name":
                        "image_translation",

                    "strict":
                        True,

                    "schema": {
                        "type":
                            "object",

                        "properties": {

                            "has_text": {
                                "type":
                                    "boolean"
                            },

                            "detected_text": {
                                "type":
                                    "string"
                            },

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

                            "confidence": {
                                "type":
                                    "string",

                                "enum": [
                                    "high",
                                    "medium",
                                    "low"
                                ]
                            },

                            "warning": {
                                "type":
                                    "string"
                            }
                        },

                        "required": [
                            "has_text",
                            "detected_text",
                            "translation",
                            "detected_language",
                            "confidence",
                            "warning"
                        ],

                        "additionalProperties":
                            False
                    }
                }
            },

            max_output_tokens=
                1200
        )


        output_text = str(
            response.output_text or ""
        ).strip()


        if not output_text:

            raise ValueError(
                "La IA no devolvió contenido."
            )


        result = json.loads(
            output_text
        )


        return result


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
            # VALIDAR TAMAÑO DE PETICIÓN
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
            # DATOS RECIBIDOS
            # =================================================

            image_data = str(
                data.get(
                    "image_data",
                    ""
                )
            ).strip()


            image_url = str(
                data.get(
                    "image_url",
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
            # VALIDAR QUE EXISTA IMAGEN
            # =================================================

            if (
                not image_data
                and
                not image_url
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "Debes seleccionar una imagen."
                    }
                )

                return


            # =================================================
            # IMAGEN LOCAL BASE64
            # =================================================

            if image_data:

                if not image_data.startswith(
                    ALLOWED_PREFIXES
                ):

                    self.send_json(
                        400,
                        {
                            "error":
                                "Formato de imagen no permitido. Usa JPG, PNG o WebP."
                        }
                    )

                    return


                try:

                    encoded = image_data.split(
                        ",",
                        1
                    )[1]


                    image_bytes = base64.b64decode(
                        encoded,
                        validate=True
                    )

                except Exception:

                    self.send_json(
                        400,
                        {
                            "error":
                                "La imagen contiene datos no válidos."
                        }
                    )

                    return


                if len(image_bytes) == 0:

                    self.send_json(
                        400,
                        {
                            "error":
                                "La imagen está vacía."
                        }
                    )

                    return


                if (
                    len(image_bytes) >
                    MAX_IMAGE_BYTES
                ):

                    self.send_json(
                        413,
                        {
                            "error":
                                "La imagen debe pesar como máximo 3 MB."
                        }
                    )

                    return


                final_image = (
                    image_data
                )


            # =================================================
            # IMAGEN POR URL
            # =================================================

            else:

                if not is_valid_image_url(
                    image_url
                ):

                    self.send_json(
                        400,
                        {
                            "error":
                                "La URL de la imagen no es válida."
                        }
                    )

                    return


                final_image = (
                    image_url
                )


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
                ImageTranslationService(
                    api_key
                )
            )


            result = (
                translator.translate_image(

                    image=
                        final_image,

                    source_language=
                        source_language,

                    target_language=
                        target_language
                )
            )


            # =================================================
            # VALIDAR TEXTO EN IMAGEN
            # =================================================

            if not result.get(
                "has_text",
                False
            ):

                self.send_json(
                    200,
                    {
                        "has_text":
                            False,

                        "detected_text":
                            "",

                        "translation":
                            "",

                        "detected_language":
                            result.get(
                                "detected_language",
                                "unknown"
                            ),

                        "confidence":
                            result.get(
                                "confidence",
                                "low"
                            ),

                        "warning":
                            result.get(
                                "warning"
                            )
                            or
                            "No se encontró texto legible en la imagen."
                    }
                )

                return


            # =================================================
            # RESPUESTA EXITOSA
            # =================================================

            self.send_json(
                200,
                {
                    "has_text":
                        True,

                    "detected_text":
                        result.get(
                            "detected_text",
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

                    "confidence":
                        result.get(
                            "confidence",
                            "low"
                        ),

                    "warning":
                        result.get(
                            "warning",
                            ""
                        ),

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
                f"Error en /api/image: "
                f"{type(error).__name__}: "
                f"{error}"
            )


            self.send_json(
                500,
                {
                    "error":
                        "No fue posible analizar y traducir la imagen."
                }
            )