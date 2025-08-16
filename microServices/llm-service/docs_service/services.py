"""
文檔服務模組

本模組提供 Sphinx 生成的 HTML 文檔管理功能，包含文檔內容讀取、搜尋、
結構分析和靜態文件服務等功能。
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)


class DocsService:
    """
    文檔服務類別
    
    負責處理和提供 Sphinx 生成的 HTML 文檔服務，包含文檔讀取、搜尋、
    結構分析和靜態文件服務等功能。支援安全的文件存取和內容解析。
    
    Attributes:
        docs_root (Path): 文檔根目錄路徑
        static_root (Path): 靜態文件根目錄路徑
        
    Example:
        >>> service = DocsService()
        >>> content = service.get_doc_content("api.html")
        >>> if content["success"]:
        ...     print(content["data"]["title"])
    """
    
    def __init__(self) -> None:
        """
        初始化文檔服務
        
        設定文檔根目錄和靜態文件目錄路徑。
        """
        self.docs_root = Path(__file__).parent.parent / 'docs' / '_build' / 'html'
        self.static_root = self.docs_root / '_static'
    
    def get_doc_content(self, doc_path: str = 'index.html') -> Dict[str, Any]:
        """
        獲取文檔內容
        
        安全地讀取指定的文檔內容，支援 HTML 文件和靜態文件。
        包含目錄穿越攻擊防護機制。
        
        Args:
            doc_path (str, optional): 文檔相對路徑。預設為 'index.html'
            
        Returns:
            Dict[str, Any]: 包含以下欄位的字典：
                - success (bool): 操作是否成功
                - data (Dict): 文檔內容資料 (成功時)
                - error (str): 錯誤訊息 (失敗時)
                
        Note:
            支援的文件類型包括 HTML、CSS、JavaScript、圖片和字體文件。
            
        Example:
            >>> service = DocsService()
            >>> result = service.get_doc_content("api.html")
            >>> if result["success"]:
            ...     print(result["data"]["title"])
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
        """
        確保路徑安全
        
        防止目錄穿越攻擊，確保文件路徑在允許的範圍內。
        
        Args:
            doc_path (str): 原始文件路徑
            
        Returns:
            Optional[str]: 安全的路徑，如果不安全則返回 None
        """
        # 移除前導斜線
        doc_path = doc_path.lstrip('/')
        
        # 檢查是否包含危險字符
        if '..' in doc_path or doc_path.startswith('/'):
            return None
        
        return doc_path
    
    def _get_html_content(self, file_path: Path) -> Dict[str, Any]:
        """
        讀取和解析 HTML 文檔
        
        使用 BeautifulSoup 解析 HTML 內容，提取標題和主要內容。
        
        Args:
            file_path (Path): HTML 文件的完整路徑
            
        Returns:
            Dict[str, Any]: 包含 HTML 內容的字典
        """
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
        """
        讀取靜態文件
        
        處理 CSS、JavaScript、圖片、字體等靜態資源文件。
        根據文件類型選擇文本或二進位讀取模式。
        
        Args:
            file_path (Path): 靜態文件的完整路徑
            
        Returns:
            Dict[str, Any]: 包含文件內容和媒體類型的字典
        """
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
        """
        根據文件後綴返回 MIME 類型
        
        為不同的文件類型返回適當的 Content-Type 標頭。
        
        Args:
            suffix (str): 文件後綴名 (含點號)
            
        Returns:
            str: MIME 類型字串
        """
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
        全文搜尋文檔內容
        
        在所有 HTML 文檔中搜尋指定的關鍵字，返回匹配的文檔清單。
        
        Args:
            query (str): 搜尋關鍵字，不能為空
            
        Returns:
            Dict[str, Any]: 包含以下欄位的搜尋結果：
                - success (bool): 搜尋是否成功
                - data (Dict): 搜尋結果資料 (成功時)
                - error (str): 錯誤訊息 (失敗時)
                
        Note:
            搜尋是不分大小寫的，會在所有 HTML 文件的純文本內容中搜尋。
            
        Example:
            >>> service = DocsService()
            >>> results = service.search_docs("API")
            >>> print(f"找到 {results['data']['total']} 個結果")
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
        獲取文檔結構樹
        
        扫描文檔目錄，獲取所有 HTML 文件的結構資訊。
        
        Returns:
            Dict[str, Any]: 包含以下欄位的結構資訊：
                - success (bool): 操作是否成功
                - data (Dict): 文檔結構資料 (成功時)
                - error (str): 錯誤訊息 (失敗時)
                
        Note:
            結構資訊包含文件名稱、標題、路徑和 URL 等。
            
        Example:
            >>> service = DocsService()
            >>> structure = service.get_docs_structure()
            >>> for doc in structure["data"]["structure"]:
            ...     print(f"{doc['name']}: {doc['title']}")
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


# 全域服務實例
docs_service = DocsService()
"""文檔服務的全域實例，用於整個應用程式中的文檔操作"""