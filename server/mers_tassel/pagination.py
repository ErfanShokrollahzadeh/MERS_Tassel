"""
Custom DRF pagination that emits the shape the Next.js storefront expects::

    { "items": [...], "page": 1, "pageSize": 12, "total": 42, "totalPages": 4 }

The envelope renderer wraps this under ``data``, so the final wire format is::

    { "success": true, "data": { "items": [...], ... } }
"""
import math
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StorefrontPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'pageSize'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'items': data,
            'page': self.page.number,
            'pageSize': self.get_page_size(self.request),
            'total': self.page.paginator.count,
            'totalPages': math.ceil(self.page.paginator.count / self.get_page_size(self.request)),
        })
