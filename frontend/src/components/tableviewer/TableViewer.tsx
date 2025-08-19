/**
 * @fileoverview 表格視圖容器組件
 *
 * 此組件提供表格視圖的容器功能，包括：
 * - 表格切換標籤管理
 * - 各個子表格組件的協調
 * - 統一的表格標題和記錄數量顯示
 * - 通知系統整合
 * - 表格數據長度計算
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React, { useRef, useEffect, useCallback, Suspense, lazy } from "react"; // 引入 React
import clsx from "clsx"; // 引入 clsx 用於條件性類名處理
import { useTableUIStore, TableType } from "../../stores"; // 引入 Zustand stores 和類型
import LoadingSpinner from "../common/LoadingSpinner"; // 引入 Loading 組件

// 🚀 立即加載的核心表格組件（高頻使用）
import {
  PermissionTableView, // 權限表格視圖組件
  RoleTableView, // 角色表格視圖組件
  UserTableView, // 用戶表格視圖組件
  RoleToPermissionTableView, // 角色權限關聯表格視圖組件
  UserToRoleTableView, // 用戶角色關聯表格視圖組件
  DroneCommandTableView, // 無人機指令表格視圖組件
  DronePositionTableView, // 無人機位置表格視圖組件
  DroneStatusTableView, // 無人機狀態表格視圖組件
  UserPreferenceTableView, // 使用者偏好設定表格視圖組件
} from "."; // 引入表格組件

// 🔄 懶加載的歸檔表格組件（低頻使用）
const ArchiveTaskTableView = lazy(() => 
  import("./ArchiveTaskTableView").then(module => ({
    default: module.ArchiveTaskTableView
  }))
);

const DroneCommandsArchiveTableView = lazy(() => 
  import("./DroneCommandsArchiveTableView").then(module => ({
    default: module.DroneCommandsArchiveTableView
  }))
);

const DronePositionsArchiveTableView = lazy(() => 
  import("./DronePositionsArchiveTableView").then(module => ({
    default: module.DronePositionsArchiveTableView
  }))
);

const DroneStatusArchiveTableView = lazy(() => 
  import("./DroneStatusArchiveTableView").then(module => ({
    default: module.DroneStatusArchiveTableView
  }))
);
import styles from "../../styles/TableViewer.module.scss"; // 引入表格樣式
import { createLogger } from "../../configs/loggerConfig"; // 引入日誌配置

/**
 * 表格視圖容器組件的屬性介面
 *
 * 定義表格視圖容器組件可接受的屬性
 *
 * @interface TableViewerProps
 */
interface TableViewerProps {
  /** 可選的自定義 CSS 類名，用於自定義外觀樣式 */
  className?: string;
}

/**
 * 表格類型常量定義
 * 
 * 定義系統中所有可用的表格類型標識符，用於統一管理和切換不同的表格視圖
 * 
 * @const
 */
const TABLE_TYPES = {
  PERMISSION: "permission",
  ROLE: "role",
  ROLE_TO_PERMISSION: "roletopermission",
  USER: "user",
  USER_TO_ROLE: "usertorole",
  DRONE_POSITION: "DronePosition",
  DRONE_STATUS: "DroneStatus",
  DRONE_COMMAND: "DroneCommand",
  DRONE_POSITIONS_ARCHIVE: "DronePositionsArchive",
  DRONE_STATUS_ARCHIVE: "DroneStatusArchive",
  DRONE_COMMANDS_ARCHIVE: "DroneCommandsArchive",
  ARCHIVE_TASK: "ArchiveTask",
  USER_PREFERENCE: "UserPreference",
} as const;

/**
 * 表格配置陣列
 *
 * 定義每個表格的顯示標題和視圖名稱，用於標籤切換和標題顯示。
 * 使用陣列結構提供更好的可讀性和維護性，支援動態渲染和順序管理
 * 
 * @type {Array<{viewName: string, title: string}>}
 * @readonly
 */
const viewItems = [
  { viewName: TABLE_TYPES.PERMISSION, title: "Permission Table" }, // 權限表格配置
  { viewName: TABLE_TYPES.ROLE, title: "Role Table" }, // 角色表格配置
  {
    viewName: TABLE_TYPES.ROLE_TO_PERMISSION,
    title: "Role to Permission Table",
  }, // 角色權限關聯表格配置
  { viewName: TABLE_TYPES.USER, title: "User Table" }, // 用戶表格配置
  { viewName: TABLE_TYPES.USER_TO_ROLE, title: "User to Role Table" }, // 用戶角色關聯表格配置
  { viewName: TABLE_TYPES.DRONE_POSITION, title: "Drone Position Table" }, // 無人機位置表格配置
  { viewName: TABLE_TYPES.DRONE_STATUS, title: "Drone Status Table" }, // 無人機狀態表格配置
  { viewName: TABLE_TYPES.DRONE_COMMAND, title: "Drone Command Table" }, // 無人機命令表格配置
  {
    viewName: TABLE_TYPES.DRONE_POSITIONS_ARCHIVE,
    title: "Drone Positions Archive Table",
  }, // 無人機位置歸檔表格配置
  {
    viewName: TABLE_TYPES.DRONE_STATUS_ARCHIVE,
    title: "Drone Status Archive Table",
  }, // 無人機狀態歸檔表格配置
  {
    viewName: TABLE_TYPES.DRONE_COMMANDS_ARCHIVE,
    title: "Drone Commands Archive Table",
  }, // 無人機命令歸檔表格配置
  { viewName: TABLE_TYPES.ARCHIVE_TASK, title: "Archive Task Table" }, // 歸檔任務表格配置
  { viewName: TABLE_TYPES.USER_PREFERENCE, title: "User Preference Table" }, // 用戶偏好表格配置
];

/**
 * TableViewer 組件專用的日誌記錄器
 * 
 * 用於記錄表格切換、用戶互動等重要操作的日誌資訊
 * 
 * @const
 */
const logger = createLogger("TableViewer");

/**
 * 表格視圖容器組件
 *
 * 此組件負責管理表格視圖的整體結構，包括表格切換標籤、
 * 標題顯示、記錄數量統計以及各個子表格組件的渲染。
 *
 * @param {TableViewerProps} props - 組件屬性
 * @returns {JSX.Element} 表格視圖容器的 JSX 元素
 *
 * @example
 * ```tsx
 * import { TableViewer } from './TableViewer';
 *
 * function App() {
 *   return <TableViewer className="custom-table-viewer" />;
 * }
 * ```
 */
export const TableViewer: React.FC<TableViewerProps> = ({ className }) => {
  // 從 Zustand stores 獲取狀態和方法
  /** 當前活動的表格類型和設定方法 */
  const { activeTable, setActiveTable } = useTableUIStore();

  // 標籤滾動容器的引用
  /** 標籤滾動容器的 DOM 引用 */
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // 注意：通知功能現在由 React Query hooks 直接處理，不再需要 TableService 的回調

  /**
   * 滾動標籤容器到指定的標籤位置
   *
   * 自動計算目標標籤的位置，並平滑滾動至該位置以確保可見
   *
   * @param targetTableType - 目標表格類型標識符
   */
  const scrollToTab = (targetTableType: TableType) => {
    if (!tabsScrollRef.current) return;

    const targetButton = tabsScrollRef.current.querySelector(
      `[data-table="${targetTableType}"]`
    ) as HTMLButtonElement;

    if (targetButton) {
      const container = tabsScrollRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = targetButton.getBoundingClientRect();
      
      // 計算需要滾動的距離，將目標按鈕置中
      /** 容器當前滾動位置 */
      const scrollLeft = container.scrollLeft;
      /** 目標滾動位置，將按鈕置中顯示 */
      const targetScrollLeft = scrollLeft + (buttonRect.left - containerRect.left) - (containerRect.width / 2) + (buttonRect.width / 2);
      
      // 平滑滾動到目標位置
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  /**
   * 處理表格切換操作
   *
   * 當用戶點擊表格切換標籤時，更新活動表格類型並滾動標籤容器。
   * 同時記錄操作日誌以便除錯和用戶行為分析
   *
   * @param tableType - 要切換到的表格類型標識符
   */
  const handleTableChange = (tableType: TableType) => {
    // 記錄表格切換操作
    logger.info(`Table switched to: ${tableType}`, {
      previousTable: activeTable,
      newTable: tableType,
      tableTitle: viewItems.find((viewItem) => viewItem.viewName === tableType)
        ?.title,
    });

    setActiveTable(tableType); // 設置活動表格
    
    // 滾動到對應的標籤位置
    scrollToTab(tableType);
  };

  /**
   * 處理左箭頭點擊事件
   *
   * 切換到前一個表格，若已在第一個表格則不執行任何操作
   */
  const handleScrollLeft = useCallback(() => {
    const currentIndex = viewItems.findIndex(
      (item) => item.viewName === activeTable
    );
    if (currentIndex > 0) {
      const previousTable = viewItems[currentIndex - 1];
      handleTableChange(previousTable.viewName as TableType);
    }
  }, [activeTable]);

  /**
   * 處理右箭頭點擊事件
   *
   * 切換到下一個表格，若已在最後一個表格則不執行任何操作
   */
  const handleScrollRight = useCallback(() => {
    const currentIndex = viewItems.findIndex(
      (item) => item.viewName === activeTable
    );
    if (currentIndex < viewItems.length - 1) {
      const nextTable = viewItems[currentIndex + 1];
      handleTableChange(nextTable.viewName as TableType);
    }
  }, [activeTable]);


  /**
   * 處理鍵盤事件
   *
   * @param event - 鍵盤事件
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 只在沒有輸入框聚焦時響應鍵盤事件
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // 檢查是否在可滾動的表格內容區域或其他可滾動元素中
      const target = event.target as HTMLElement;
      if (target) {
        // 檢查目標元素或其父元素是否有滾動功能
        let currentElement = target;
        while (currentElement && currentElement !== document.body) {
          const computedStyle = window.getComputedStyle(currentElement);
          const overflowX = computedStyle.overflowX;
          
          // 如果元素有水平滾動能力，且內容確實可以滾動
          if ((overflowX === 'auto' || overflowX === 'scroll') && 
              currentElement.scrollWidth > currentElement.clientWidth) {
            // 檢查是否還能繼續滾動
            if (event.key === "ArrowLeft" && currentElement.scrollLeft > 0) {
              return; // 讓瀏覽器處理水平滾動
            }
            if (event.key === "ArrowRight" && 
                currentElement.scrollLeft < currentElement.scrollWidth - currentElement.clientWidth) {
              return; // 讓瀏覽器處理水平滾動
            }
          }
          
          // 如果當前元素是表格相關元素（table, tbody, td 等），優先處理表格內滾動
          if (currentElement.tagName && 
              ['TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH', 'DIV'].includes(currentElement.tagName) &&
              (currentElement.className.includes('table') || 
               currentElement.className.includes('cell') ||
               currentElement.getAttribute('role') === 'table' ||
               currentElement.getAttribute('role') === 'cell')) {
            
            // 檢查該元素是否有滾動條
            if (currentElement.scrollWidth > currentElement.clientWidth) {
              return; // 讓表格內容自己處理滾動
            }
          }
          
          currentElement = currentElement.parentElement as HTMLElement;
        }
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          handleScrollLeft();
          break;
        case "ArrowRight":
          event.preventDefault();
          handleScrollRight();
          break;
      }
    },
    [handleScrollLeft, handleScrollRight]
  );

  // 添加和移除鍵盤事件監聽器
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  /**
   * 獲取當前表格的數據長度
   *
   * 使用 React Query hooks 獲取各表格的數據長度
   *
   * @returns 當前表格的數據記錄數量
   */
  const getCurrentTableDataLength = () => {
    // TODO: 考慮重新實作或移除此功能
    // 數據長度計算已移到各自的表格組件中
    return 0;
  };

  /**
   * 渲染對應的表格組件
   *
   * 根據當前活動的表格類型，渲染對應的表格視圖組件。
   * 支持懶加載機制 - 歸檔表格組件將按需加載，減少初始 bundle 大小。
   * 使用 Suspense 包裝懶加載組件以提供加載狀態提示
   *
   * @returns 對應的表格組件 JSX 元素
   */
  const renderCurrentTable = () => {
    /**
     * 渲染懶加載表格組件
     * 
     * 使用 Suspense 包裝懶加載組件，提供加載狀態和錯誤邊界處理
     * 
     * @param Component - 懶加載的 React 組件
     * @returns 包裝後的 JSX 元素
     */
    const renderLazyTable = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
      <Suspense 
        fallback={
          <div className={styles.tableLoadingContainer}>
            <LoadingSpinner />
            <p className={styles.loadingText}>載入表格中...</p>
          </div>
        }
      >
        <Component />
      </Suspense>
    );

    switch (activeTable) {
      // 🚀 立即加載的核心表格（高頻使用）
      case TABLE_TYPES.PERMISSION:
        return <PermissionTableView />; // 渲染權限表格視圖
      case TABLE_TYPES.ROLE:
        return <RoleTableView />; // 渲染角色表格視圖
      case TABLE_TYPES.USER:
        return <UserTableView />; // 渲染用戶表格視圖
      case TABLE_TYPES.ROLE_TO_PERMISSION:
        return <RoleToPermissionTableView />; // 渲染角色權限關聯表格視圖
      case TABLE_TYPES.USER_TO_ROLE:
        return <UserToRoleTableView />; // 渲染用戶角色關聯表格視圖
      case TABLE_TYPES.DRONE_POSITION:
        return <DronePositionTableView />; // 渲染無人機位置表格視圖
      case TABLE_TYPES.DRONE_STATUS:
        return <DroneStatusTableView />; // 渲染無人機狀態表格視圖
      case TABLE_TYPES.DRONE_COMMAND:
        return <DroneCommandTableView />; // 渲染無人機命令表格視圖
      case TABLE_TYPES.USER_PREFERENCE:
        return <UserPreferenceTableView />; // 渲染用戶偏好表格視圖
      
      // 🔄 懶加載的歸檔表格組件（低頻使用）
      case TABLE_TYPES.DRONE_POSITIONS_ARCHIVE:
        return renderLazyTable(DronePositionsArchiveTableView); // 懶加載無人機位置歸檔表格視圖
      case TABLE_TYPES.DRONE_STATUS_ARCHIVE:
        return renderLazyTable(DroneStatusArchiveTableView); // 懶加載無人機狀態歸檔表格視圖
      case TABLE_TYPES.DRONE_COMMANDS_ARCHIVE:
        return renderLazyTable(DroneCommandsArchiveTableView); // 懶加載無人機命令歸檔表格視圖
      case TABLE_TYPES.ARCHIVE_TASK:
        return renderLazyTable(ArchiveTaskTableView); // 懶加載歸檔任務表格視圖
        
      default:
        return <div className={styles.noData}>No table selected</div>; // 無選中表格時的提示
    }
  };

  // 計算當前表格的索引位置
  /** 當前表格在配置陣列中的索引位置 */
  const currentTableIndex = viewItems.findIndex(
    (item) => item.viewName === activeTable
  );
  /** 是否為第一個表格，用於控制左箭頭狀態 */
  const isFirstTable = currentTableIndex === 0;
  /** 是否為最後一個表格，用於控制右箭頭狀態 */
  const isLastTable = currentTableIndex === viewItems.length - 1;

  // 渲染表格視圖容器的主要內容
  return (
    <div className={clsx(styles.tableViewerRoot, className)}>
      {" "}
      {/* 根容器，應用自定義類名 */}
      <div className={styles.tableContainer}>
        {" "}
        {/* 表格容器 */}
        {/* 表格切換標籤區域 */}
        <div className={styles.tabsWrapper}>
          {/* 左滾動箭頭 */}
          <button
            className={clsx(
              styles.scrollArrow,
              isFirstTable && styles.disabled
            )}
            onClick={handleScrollLeft}
            disabled={isFirstTable}
            aria-label="切換到前一個表格"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10.354 14.354a.5.5 0 0 1-.708 0L4.5 9.207 3.646 8.354a.5.5 0 0 1 0-.708L9.646 1.646a.5.5 0 1 1 .708.708L4.707 8l5.647 5.646a.5.5 0 0 1 0 .708z"
              />
            </svg>
          </button>

          {/* 滾動容器 */}
          <div className={styles.tabsContainer} ref={tabsScrollRef}>
            {/* 動態渲染表格切換標籤 */}
            {viewItems.map((viewItem) => (
              /*
              當 activeTable（目前活躍的表格）等於
    viewName（這個標籤的識別碼）時
      - 就會加上 styles.active 這個額外的樣式類別
      - 如果條件不成立，就不加上這個類別 */
              <button
                key={viewItem.viewName}
                data-table={viewItem.viewName}
                className={clsx(
                  styles.tab,
                  activeTable === viewItem.viewName && styles.active
                )} // 根據活動狀態設置樣式
                onClick={() =>
                  handleTableChange(viewItem.viewName as TableType)
                } // 點擊時切換表格
              >
                {viewItem.title} {/* 顯示表格標題 */}
              </button>
            ))}
          </div>

          {/* 右滾動箭頭 */}
          <button
            className={clsx(styles.scrollArrow, isLastTable && styles.disabled)}
            onClick={handleScrollRight}
            disabled={isLastTable}
            aria-label="切換到下一個表格"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.646 1.646a.5.5 0 0 1 .708 0L11.5 6.793l.854.853a.5.5 0 0 1 0 .708L6.354 14.354a.5.5 0 1 1-.708-.708L11.293 8 5.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>
        </div>
        {/* 表格標題和記錄數量顯示區域 */}
        <div className={styles.tableHeader}>
          <h2>
            {
              viewItems.find((viewItem) => viewItem.viewName === activeTable)
                ?.title
            }
          </h2>{" "}
          {/* 顯示當前表格標題 */}
          <span className={styles.recordCount}>
            {getCurrentTableDataLength()} records {/* 顯示當前表格記錄數量 */}
          </span>
        </div>
        {/* 表格內容區域 */}
        <div className={styles.tableWrapper}>
          {renderCurrentTable()} {/* 渲染當前選中的表格組件 */}
        </div>
      </div>
    </div>
  );
};
