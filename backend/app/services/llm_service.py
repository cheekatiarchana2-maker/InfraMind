import json
import re
from typing import Dict, Any, Optional
from app.config import settings
from app.utils.logging import logger

class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.model = settings.LLM_MODEL
        self._openai_client = None
        self._gemini_client = None

    def _get_openai_client(self):
        if self._openai_client is None:
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is not configured.")
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    def _get_gemini_client(self):
        if self._gemini_client is None:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not configured.")
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._gemini_client = genai
        return self._gemini_client

    def _clean_json_text(self, text: str) -> str:
        """Strips markdown code blocks from model output to ensure clean JSON parsing."""
        text = text.strip()
        # Match ```json ... ``` or ``` ... ```
        pattern = r"^```(?:json)?\s*(.*?)\s*```$"
        match = re.match(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return text

    def generate_json_response(self, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        """Generates structured JSON response from configured LLM provider."""
        if not settings.is_llm_configured:
            return None

        try:
            if self.provider == "openai":
                client = self._get_openai_client()
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    timeout=20.0,
                )
                raw = response.choices[0].message.content or "{}"
                return json.loads(self._clean_json_text(raw))

            elif self.provider == "gemini":
                genai = self._get_gemini_client()
                model = genai.GenerativeModel(
                    model_name=self.model or "gemini-1.5-flash",
                    system_instruction=system_prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                response = model.generate_content(user_prompt)
                raw = response.text or "{}"
                return json.loads(self._clean_json_text(raw))

            else:
                logger.info(f"Using historical fallback reasoning engine (provider='{self.provider}').")
                return None

        except Exception as e:
            logger.warning(f"LLM API generation failed ({self.provider}): {e}. Falling back to historical reasoning.")
            return None

    def generate_text_response(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        if not settings.is_llm_configured:
            return None

        try:
            if self.provider == "openai":
                client = self._get_openai_client()
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.2,
                    timeout=20.0,
                )
                return response.choices[0].message.content

            elif self.provider == "gemini":
                genai = self._get_gemini_client()
                model = genai.GenerativeModel(
                    model_name=self.model or "gemini-1.5-flash",
                    system_instruction=system_prompt
                )
                response = model.generate_content(user_prompt)
                return response.text

            return None
        except Exception as e:
            logger.warning(f"LLM text generation failed ({self.provider}): {e}")
            return None

llm_service = LLMService()
