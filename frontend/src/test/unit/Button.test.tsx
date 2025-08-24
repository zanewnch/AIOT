/**
 * @fileoverview Button 組件單元測試
 * @description 測試 Button 組件的各種功能和狀態
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import { Button } from '../../components/Button';

// Mock logger to avoid console output in tests
vi.mock('../../configs/loggerConfig', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('Button Component', () => {
  describe('基本渲染', () => {
    it('應該正確渲染按鈕文字', () => {
      render(<Button>測試按鈕</Button>);
      
      const button = screen.getByRole('button', { name: '測試按鈕' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('測試按鈕');
    });

    it('應該支援 React 節點作為 children', () => {
      render(
        <Button>
          <span>圖標</span>
          <span>文字</span>
        </Button>
      );
      
      expect(screen.getByText('圖標')).toBeInTheDocument();
      expect(screen.getByText('文字')).toBeInTheDocument();
    });
  });

  describe('變體樣式', () => {
    it.each([
      ['primary', 'btn--primary'],
      ['secondary', 'btn--secondary'],
      ['outline', 'btn--outline'],
      ['ghost', 'btn--ghost'],
    ])('應該為 %s 變體應用正確的 CSS 類別', (variant, expectedClass) => {
      render(<Button variant={variant as any}>按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(expectedClass);
    });

    it('應該預設為 primary 變體', () => {
      render(<Button>按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--primary');
    });
  });

  describe('尺寸樣式', () => {
    it.each([
      ['sm', 'btn--sm'],
      ['md', 'btn--md'],
      ['lg', 'btn--lg'],
    ])('應該為 %s 尺寸應用正確的 CSS 類別', (size, expectedClass) => {
      render(<Button size={size as any}>按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(expectedClass);
    });

    it('應該預設為 md 尺寸', () => {
      render(<Button>按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--md');
    });
  });

  describe('禁用狀態', () => {
    it('應該正確設定禁用狀態', () => {
      render(<Button disabled>禁用按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('禁用狀態下不應該觸發點擊事件', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button disabled onClick={handleClick}>禁用按鈕</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('載入狀態', () => {
    it('應該在載入狀態下顯示載入動畫', () => {
      render(<Button loading>載入中</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--loading');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('載入狀態下應該顯示 SVG 動畫', () => {
      render(<Button loading>載入中</Button>);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    it('載入狀態下不應該觸發點擊事件', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button loading onClick={handleClick}>載入中</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('載入狀態下文字應該有特殊樣式', () => {
      render(<Button loading>載入中</Button>);
      
      const textSpan = screen.getByText('載入中');
      expect(textSpan).toHaveClass('btn__content--loading');
    });
  });

  describe('點擊事件處理', () => {
    it('應該正確處理點擊事件', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>點擊我</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('沒有 onClick 處理器時不應該出錯', async () => {
      const user = userEvent.setup();
      
      render(<Button>按鈕</Button>);
      
      const button = screen.getByRole('button');
      
      // 這個測試確保沒有 onClick 時不會拋出錯誤
      expect(async () => {
        await user.click(button);
      }).not.toThrow();
    });
  });

  describe('按鈕類型', () => {
    it('應該預設為 button 類型', () => {
      render(<Button>按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it.each(['button', 'submit', 'reset'])('應該支援 %s 類型', (type) => {
      render(<Button type={type as any}>按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', type);
    });
  });

  describe('自定義樣式', () => {
    it('應該支援自定義 CSS 類別', () => {
      render(<Button className="custom-class">按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('btn'); // 基礎類別應該保留
    });

    it('應該組合多個 CSS 類別', () => {
      render(
        <Button 
          variant="secondary" 
          size="lg" 
          loading 
          className="custom-class"
        >
          按鈕
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn');
      expect(button).toHaveClass('btn--secondary');
      expect(button).toHaveClass('btn--lg');
      expect(button).toHaveClass('btn--loading');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('可訪問性', () => {
    it('應該有正確的 role 屬性', () => {
      render(<Button>按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('禁用狀態下應該設定 aria-disabled', () => {
      render(<Button disabled>禁用按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('載入狀態下應該設定 aria-disabled', () => {
      render(<Button loading>載入中</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('邊緣情況', () => {
    it('應該處理空 children', () => {
      render(<Button>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('應該處理 undefined children', () => {
      render(<Button>{undefined}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('同時設定 disabled 和 loading 時應該都生效', () => {
      render(<Button disabled loading>按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('btn--loading');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });
});