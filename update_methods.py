#!/usr/bin/env python3
"""
自動更新 TypeScript 文件中的 arrow function 為 loggerDecorator 包裝
"""

import os
import re
import sys
from pathlib import Path

def update_arrow_functions(file_path):
    """更新文件中的 arrow functions 為 loggerDecorator 包裝"""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 備份原始文件
        backup_path = file_path + '.backup'
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 使用正則表達式匹配 arrow functions
        # 匹配模式: methodName = async (...args) => {
        pattern = r'(\s+)(\w+)\s*=\s*(async\s*\([^)]*\)\s*:\s*[^=]+)\s*=>\s*\{'
        
        def replace_function(match):
            indent = match.group(1)
            method_name = match.group(2)
            signature = match.group(3)
            
            return f'{indent}{method_name} = loggerDecorator({signature} => {{'
        
        # 替換所有匹配的函數
        updated_content = re.sub(pattern, replace_function, content)
        
        # 為每個匹配添加方法名參數和關閉括號
        # 這需要更複雜的處理，因為需要找到對應的結束括號
        
        # 簡化處理：手動匹配每個方法
        lines = updated_content.split('\n')
        result_lines = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # 檢查是否是已經被 loggerDecorator 修改的行
            if ' = loggerDecorator(' in line and ' => {' in line:
                result_lines.append(line)
                
                # 提取方法名
                method_match = re.search(r'(\w+)\s*=\s*loggerDecorator\(', line)
                if method_match:
                    method_name = method_match.group(1)
                    
                    # 找到對應的結束括號
                    brace_count = 0
                    j = i + 1
                    
                    # 計算開始的括號數量
                    brace_count += line.count('{') - line.count('}')
                    
                    while j < len(lines) and brace_count > 0:
                        result_lines.append(lines[j])
                        brace_count += lines[j].count('{') - lines[j].count('}')
                        j += 1
                    
                    # 添加方法名參數和關閉括號
                    if j < len(lines):
                        # 修改最後一行來添加方法名參數
                        if result_lines and result_lines[-1].strip().endswith('}'):
                            result_lines[-1] = result_lines[-1].rstrip() + f", '{method_name}')"
                        else:
                            result_lines.append(f"  }}, '{method_name}')")
                    
                    i = j - 1
                else:
                    result_lines.append(line)
            else:
                result_lines.append(line)
            
            i += 1
        
        # 寫回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(result_lines))
        
        print(f"已更新文件: {file_path}")
        return True
        
    except Exception as e:
        print(f"更新文件 {file_path} 時出錯: {e}")
        return False

def main():
    # 定義需要處理的文件模式
    base_path = Path("/home/user/GitHub/AIOT/microServices/drone-service/src")
    
    patterns = [
        "repo/commands/*.ts",
        "repo/queries/*.ts"
    ]
    
    files_to_process = []
    for pattern in patterns:
        files_to_process.extend(base_path.glob(pattern))
    
    for file_path in files_to_process:
        if file_path.suffix == '.ts':
            update_arrow_functions(str(file_path))

if __name__ == "__main__":
    main()