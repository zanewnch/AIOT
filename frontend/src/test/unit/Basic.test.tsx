/**
 * @fileoverview 基本測試套件
 * @description 確保測試環境和核心功能正常工作
 * @author AIOT Development Team
 * @version 1.0.0
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import { Button } from '../../components/Button';

// Mock logger
vi.mock('../../configs/loggerConfig', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('基本測試套件', () => {
  describe('測試環境', () => {
    it('應該能夠渲染基本組件', () => {
      render(<Button>測試按鈕</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('測試按鈕');
    });

    it('應該支援基本的 DOM 查詢', () => {
      render(
        <div data-testid="test-div">
          <span>測試內容</span>
        </div>
      );
      
      expect(screen.getByTestId('test-div')).toBeInTheDocument();
      expect(screen.getByText('測試內容')).toBeInTheDocument();
    });

    it('應該支援事件處理', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>點擊按鈕</Button>);
      
      const button = screen.getByRole('button');
      button.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button 組件核心功能', () => {
    it('應該渲染不同變體的按鈕', () => {
      const { rerender } = render(<Button variant="primary">主要按鈕</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--primary');

      rerender(<Button variant="secondary">次要按鈕</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--secondary');
    });

    it('應該處理禁用狀態', () => {
      render(<Button disabled>禁用按鈕</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('應該處理載入狀態', () => {
      render(<Button loading>載入中</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--loading');
      expect(button).toBeDisabled();
    });

    it('應該支援不同尺寸', () => {
      const { rerender } = render(<Button size="sm">小按鈕</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--sm');

      rerender(<Button size="lg">大按鈕</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--lg');
    });
  });

  describe('React 功能測試', () => {
    it('應該支援 React hooks', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        
        return (
          <div>
            <span data-testid="count">{count}</span>
            <button onClick={() => setCount(count + 1)}>增加</button>
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('count')).toHaveTextContent('0');
      
      await user.click(screen.getByText('增加'));
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    it('應該支援條件渲染', () => {
      const ConditionalComponent = ({ show }: { show: boolean }) => (
        <div>
          {show && <span data-testid="conditional">條件內容</span>}
        </div>
      );

      const { rerender } = render(<ConditionalComponent show={false} />);
      expect(screen.queryByTestId('conditional')).not.toBeInTheDocument();

      rerender(<ConditionalComponent show={true} />);
      expect(screen.getByTestId('conditional')).toBeInTheDocument();
    });
  });

  describe('測試工具功能', () => {
    it('應該支援 vi.fn() mock 函數', () => {
      const mockFn = vi.fn();
      mockFn('test');
      mockFn('test2');
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledWith('test2');
    });

    it('應該支援 Promise 測試', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success');
      const result = await asyncFn();
      
      expect(result).toBe('success');
      expect(asyncFn).toHaveBeenCalled();
    });

    it('應該支援錯誤測試', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('test error'));
      
      await expect(errorFn()).rejects.toThrow('test error');
    });
  });
});