import base64
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


MAX_DOCUMENT_BYTES = (
    2 * 1024 * 1024
)


MAX_REQUEST_BYTES = (
    3_000_000
)


ALLOWED_LANGUAGES = {
    "es": "Español",
    "en": "English"
}


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".docx"
}


ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}


# ============================================================
# SERVICIO DE TRADUCCIÓN DE DOCUMENTOS
# ============================================================

class DocumentTranslationService:

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
    # TRADUCIR DOCUMENTO
    # ========================================================

    def translate_document(
        self,
        file_base64,
        filename,
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
Eres un traductor profesional especializado en documentos.

Debes analizar el documento proporcionado.

El usuario indicó:

Idioma de origen:
{source_name}

Idioma de destino:
{target_name}

Tu tarea es:

1. Leer el contenido textual disponible en el documento.
2. Determinar si existe texto legible.
3. Detectar si el idioma principal es español o inglés.
4. Extraer el texto manteniendo su orden lógico.
5. Traducir el contenido a {target_name}.
6. Mantener nombres propios, números, fechas, precios,
   porcentajes, unidades, siglas y términos técnicos.
7. Mantener títulos, subtítulos y separación entre párrafos
   cuando sea posible.
8. No inventar contenido que no esté presente.
9. Si una parte no puede leerse correctamente, indícalo
   mediante una advertencia.
10. Si el idioma detectado no coincide con el idioma de origen
    seleccionado, indícalo en la advertencia.

La traducción debe conservar el significado original y utilizar
una redacción natural en el idioma de destino.
"""


        response = self.client.responses.create(

            model=self.model,

            instructions=
                instructions,

            input=[
                {
                    "role":
                        "user",

                    "content": [

                        {
                            "type":
                                "input_text",

                            "text":
                                "Lee y traduce el documento adjunto."
                        },

                        {
                            "type":
                                "input_file",

                            "filename":
                                filename,

                            "file_data":
                                file_base64
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
                        "document_translation",

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

                            "original_text": {
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

                            "warning": {
                                "type":
                                    "string"
                            }
                        },

                        "required": [
                            "has_text",
                            "original_text",
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
                6000
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

            raw_body = self.rfile.read(
                content_length
            )


            data = json.loads(
                raw_body.decode(
                    "utf-8"
                )
            )


            # =================================================
            # DATOS
            # =================================================

            file_data = str(
                data.get(
                    "file_data",
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
            # VALIDAR ARCHIVO
            # =================================================

            if not filename:

                self.send_json(
                    400,
                    {
                        "error":
                            "El documento no tiene un nombre válido."
                    }
                )

                return


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
                            "Formato no permitido. Usa PDF, TXT o DOCX."
                    }
                )

                return


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
                            "El tipo de archivo no es válido."
                    }
                )

                return


            if not file_data:

                self.send_json(
                    400,
                    {
                        "error":
                            "No se recibió ningún documento."
                    }
                )

                return


            # =================================================
            # EXTRAER BASE64 DEL DATA URL
            # =================================================

            if "," in file_data:

                encoded_data = (
                    file_data.split(
                        ",",
                        1
                    )[1]
                )

            else:

                encoded_data = (
                    file_data
                )


            # =================================================
            # VALIDAR BASE64
            # =================================================

            try:

                document_bytes = (
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
                            "El documento contiene datos no válidos."
                    }
                )

                return


            # =================================================
            # ARCHIVO VACÍO
            # =================================================

            if (
                len(document_bytes)
                == 0
            ):

                self.send_json(
                    400,
                    {
                        "error":
                            "El documento está vacío."
                    }
                )

                return


            # =================================================
            # TAMAÑO MÁXIMO
            # =================================================

            if (
                len(document_bytes) >
                MAX_DOCUMENT_BYTES
            ):

                self.send_json(
                    413,
                    {
                        "error":
                            "El documento debe pesar como máximo 2 MB."
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
            # SERVICIO
            # =================================================

            translator = (
                DocumentTranslationService(
                    api_key
                )
            )


            result = (
                translator.translate_document(

                    file_base64=
                        encoded_data,

                    filename=
                        filename,

                    source_language=
                        source_language,

                    target_language=
                        target_language
                )
            )


            # =================================================
            # SIN TEXTO
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

                        "original_text":
                            "",

                        "translation":
                            "",

                        "detected_language":
                            result.get(
                                "detected_language",
                                "unknown"
                            ),

                        "warning":
                            result.get(
                                "warning"
                            )
                            or
                            "No se encontró texto legible en el documento.",

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
                    "has_text":
                        True,

                    "original_text":
                        result.get(
                            "original_text",
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
                f"Error en /api/document: "
                f"{type(error).__name__}: "
                f"{error}"
            )


            self.send_json(
                500,
                {
                    "error":
                        "No fue posible analizar y traducir el documento."
                }
            )