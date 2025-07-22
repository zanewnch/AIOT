import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)


class DocsService:
    """文檔服務，處理 Sphinx 生成的 HTML 文檔"""
    
    def __init__(self):
        self.docs_root = Path(__file__).parent.parent / 'docs' / '_build' / 'html'
        self.static_root = self.docs_root / '_static'
    
    def get_doc_content(self, doc_path: str = 'index.html') -> Dict[str, Any]:
        """
        獲取文檔內容
        
        Args:
            doc_path: 文檔路徑，預設為 index.html
            
        Returns:
            包含文檔內容的字典
        """
        try:
            # 確保路徑安全，防止目錄穿越攻擊
            safe_path = self._get_safe_path(doc_path)
            if not safe_path:
                return {
                    "success": False,
                    "error": "無效的文檔路徑"
                }
            
            full_path = self.docs_root / safe_path
            
            if not full_path.exists():
                return {
                    "success": False,
                    "error": "文檔不存在"
                }
            
            if full_path.suffix == '.html':
                return self._get_html_content(full_path)
            else:
                return self._get_static_content(full_path)
                
        except Exception as e:
            logger.error(f"獲取文檔內容失敗: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_safe_path(self, doc_path: str) -> Optional[str]:
        """確保路徑安全"""
        # 移除前導斜線
        doc_path = doc_path.lstrip('/')
        
        # 檢查是否包含危險字符
        if '..' in doc_path or doc_path.startswith('/'):
            return None
        
        return doc_path
    
    def _get_html_content(self, file_path: Path) -> Dict[str, Any]:
        """讀取和解析 HTML 文檔"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 提取主要內容
            main_content = soup.find('div', {'class': 'document'}) or soup.find('body')
            title = soup.find('title')
            
            return {
                "success": True,
                "data": {
                    "title": title.text if title else "文檔",
                    "html_content": str(main_content) if main_content else html_content,
                    "raw_html": html_content,
                    "content_type": "text/html"
                }
            }
        except Exception as e:
            logger.error(f"讀取 HTML 文檔失敗: {str(e)}")
            return {
                "success": False,
                "error": f"讀取 HTML 文檔失敗: {str(e)}"
            }
    
    def _get_static_content(self, file_path: Path) -> Dict[str, Any]:
        """讀取靜態文件（CSS, JS, 圖片等）"""
        try:
            content_type = self._get_content_type(file_path.suffix)
            
            if content_type.startswith('text/'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            else:
                with open(file_path, 'rb') as f:
                    content = f.read()
            
            return {
                "success": True,
                "data": {
                    "content": content,
                    "content_type": content_type,
                    "is_binary": not content_type.startswith('text/')
                }
            }
        except Exception as e:
            logger.error(f"讀取靜態文件失敗: {str(e)}")
            return {
                "success": False,
                "error": f"讀取靜態文件失敗: {str(e)}"
            }
    
    def _get_content_type(self, suffix: str) -> str:
        """根據文件後綴返回 content type"""
        content_types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject'
        }
        return content_types.get(suffix.lower(), 'application/octet-stream')
    
    def search_docs(self, query: str) -> Dict[str, Any]:
        """
        搜尋文檔內容
        
        Args:
            query: 搜尋關鍵字
            
        Returns:
            搜尋結果
        """
        try:
            if not query.strip():
                return {
                    "success": False,
                    "error": "搜尋關鍵字不能為空"
                }
            
            results = []
            
            # 遍歷所有 HTML 文件
            for html_file in self.docs_root.glob('**/*.html'):
                try:
                    with open(html_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    soup = BeautifulSoup(content, 'html.parser')
                    text_content = soup.get_text().lower()
                    
                    if query.lower() in text_content:
                        title = soup.find('title')
                        relative_path = html_file.relative_to(self.docs_root)
                        
                        results.append({
                            "title": title.text if title else str(relative_path),
                            "path": str(relative_path),
                            "url": f"/api/docs/{relative_path}"
                        })
                        
                except Exception as e:
                    logger.warning(f"搜尋文件 {html_file} 時出錯: {str(e)}")
                    continue
            
            return {
                "success": True,
                "data": {
                    "query": query,
                    "results": results,
                    "total": len(results)
                }
            }
            
        except Exception as e:
            logger.error(f"搜尋文檔失敗: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_docs_structure(self) -> Dict[str, Any]:
        """
        獲取文檔結構
        
        Returns:
            文檔結構樹
        """
        try:
            structure = []
            
            for html_file in self.docs_root.glob('*.html'):
                try:
                    with open(html_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    soup = BeautifulSoup(content, 'html.parser')
                    title = soup.find('title')
                    
                    structure.append({
                        "name": html_file.name,
                        "title": title.text if title else html_file.stem,
                        "path": html_file.name,
                        "url": f"/api/docs/{html_file.name}"
                    })
                    
                except Exception as e:
                    logger.warning(f"處理文件 {html_file} 時出錯: {str(e)}")
                    continue
            
            return {
                "success": True,
                "data": {
                    "structure": sorted(structure, key=lambda x: x['name']),
                    "total": len(structure)
                }
            }
            
        except Exception as e:
            logger.error(f"獲取文檔結構失敗: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


docs_service = DocsService()