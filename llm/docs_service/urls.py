from django.urls import path, re_path
from .controllers import (
    DocsController,
    DocsRawController,
    DocsSearchController,
    DocsStructureController,
    DocsHealthController
)

urlpatterns = [
    # 健康檢查
    path('health/', DocsHealthController.as_view(), name='docs-health'),
    
    # 文檔結構
    path('structure/', DocsStructureController.as_view(), name='docs-structure'),
    
    # 搜尋功能
    path('search/', DocsSearchController.as_view(), name='docs-search'),
    
    # 原始 HTML 文檔（用於瀏覽器直接顯示）
    path('raw/', DocsRawController.as_view(), name='docs-raw-index'),
    re_path(r'^raw/(?P<doc_path>.+)$', DocsRawController.as_view(), name='docs-raw'),
    
    # API 格式的文檔內容
    path('', DocsController.as_view(), name='docs-index'),
    re_path(r'^(?P<doc_path>.+)$', DocsController.as_view(), name='docs'),
]