"""
Custom DRF renderer that wraps every JSON response in the envelope the
Next.js storefront expects::

    { "success": true, "data": <original payload> }

Error responses are wrapped as::

    { "success": false, "message": "...", "errors": {...} }
"""
from rest_framework.renderers import JSONRenderer


class EnvelopeRenderer(JSONRenderer):
    """Wrap DRF responses in a ``{ success, data }`` envelope."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None

        if response and response.status_code >= 400:
            # Error path: surface the first available message.
            if isinstance(data, dict):
                message = data.pop('detail', None) or next(
                    (v[0] if isinstance(v, list) else v for v in data.values()), 'Request failed.'
                )
                envelope = {'success': False, 'message': str(message), 'errors': data or None}
            else:
                envelope = {'success': False, 'message': str(data)}
        else:
            envelope = {'success': True, 'data': data}

        return super().render(envelope, accepted_media_type, renderer_context)
