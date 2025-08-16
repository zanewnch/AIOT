import React from 'react';

const DocPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>AIOT 系統文檔</h1>
      
      <section>
        <h2>容器化部署</h2>
        
        <h3>Docker 容器管理</h3>
        <p>本系統使用 Docker Compose 來管理所有的容器服務，提供統一的容器編排和管理方式。</p>
        
        <h4>當前架構</h4>
        <ul>
          <li>使用 Docker Compose 進行容器編排</li>
          <li>多服務容器化部署</li>
          <li>統一的網路和資料卷管理</li>
        </ul>
        
        <h4>未來規劃</h4>
        <p>預計未來將遷移至 Kubernetes 來進行容器編排優化，以提供更好的：</p>
        <ul>
          <li>自動擴展能力</li>
          <li>服務發現和負載均衡</li>
          <li>更強的容錯和高可用性</li>
          <li>更精細的資源管理</li>
        </ul>
      </section>
    </div>
  );
};

export default DocPage;